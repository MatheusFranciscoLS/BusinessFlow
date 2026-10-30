import prisma from "../config/prisma.js";
import { parseMoney, sumMoney } from "../utils/money.js";

// Conciliação bancária no padrão do mercado (como no Omie): para cada movimento do
// extrato procura o lançamento pendente que o explica, nesta ordem de confiança:
//   1. valor exato, data com até 3 dias de diferença
//   2. soma de 2 a 4 lançamentos que dão o valor do banco
//   3. valor aproximado (até 10% de diferença), data com até 3 dias

const DATE_TOLERANCE_DAYS = 3;
const APPROX_TOLERANCE = 0.1;
const MAX_SUM_ITEMS = 4;
const MAX_SUM_CANDIDATES = 12;
const MAX_MOVEMENTS = 2000;
export const FEE_CATEGORY = "Tarifas bancárias";
// Marca o lançamento criado a partir do extrato (e não conciliado com um já existente).
export const BANK_ORIGIN = "Extrato bancário";

const cents = (value) => Math.round(parseMoney(value) * 100);
const dayNumber = (date) => Math.floor(new Date(date).getTime() / 86400000);
const daysApart = (a, b) => Math.abs(dayNumber(a) - dayNumber(b));

// Os lançamentos usam "entrada"/"saida" (e, em dados antigos, "income"/"outcome").
function directionOf(type) {
  const value = String(type || "").toLowerCase();
  if (value === "entrada" || value === "income") return "entrada";
  if (value === "saida" || value === "outcome") return "saida";
  return null;
}

// Combinações de 2 até `maxSize` itens cuja soma (em centavos) é `target`.
function findSubset(candidates, target, maxSize) {
  for (let size = 2; size <= maxSize; size++) {
    const found = pick(candidates, 0, size, 0, [], target);
    if (found) return found;
  }
  return null;
}

function pick(items, start, size, sum, chosen, target) {
  if (chosen.length === size) return sum === target ? [...chosen] : null;
  for (let i = start; i < items.length; i++) {
    chosen.push(items[i]);
    const found = pick(items, i + 1, size, sum + items[i].cents, chosen, target);
    chosen.pop();
    if (found) return found;
  }
  return null;
}

// Função pura (sem banco): recebe os movimentos do banco e os lançamentos pendentes.
export function suggestMatches(bankMovements, pending) {
  const used = new Set();
  const suggestions = [];
  const items = pending
    .map((t) => ({ id: t.id, date: t.date, direction: directionOf(t.type), cents: cents(t.amount) }))
    .filter((t) => t.direction);

  const bank = bankMovements.map((m) => ({ ...m, direction: directionOf(m.type), cents: cents(m.amount) }));
  const open = (m) => !suggestions.some((s) => s.bankId === m.id);
  const available = (m) =>
    items.filter((t) => !used.has(t.id) && t.direction === m.direction && daysApart(t.date, m.date) <= DATE_TOLERANCE_DAYS);
  const take = (m, kind, list, diff) => {
    list.forEach((t) => used.add(t.id));
    suggestions.push({ bankId: m.id, kind, transactionIds: list.map((t) => t.id), difference: diff / 100 });
  };

  // 1. valor exato (o de data mais próxima)
  for (const m of bank) {
    const exact = available(m)
      .filter((t) => t.cents === m.cents)
      .sort((a, b) => daysApart(a.date, m.date) - daysApart(b.date, m.date))[0];
    if (exact) take(m, "exata", [exact], 0);
  }

  // 2. soma de vários lançamentos
  for (const m of bank.filter(open)) {
    const candidates = available(m)
      .filter((t) => t.cents < m.cents)
      .sort((a, b) => daysApart(a.date, m.date) - daysApart(b.date, m.date))
      .slice(0, MAX_SUM_CANDIDATES);
    const subset = findSubset(candidates, m.cents, MAX_SUM_ITEMS);
    if (subset) take(m, "soma", subset, 0);
  }

  // 3. valor aproximado
  for (const m of bank.filter(open)) {
    const near = available(m)
      .map((t) => ({ ...t, diff: Math.abs(t.cents - m.cents) }))
      .filter((t) => t.diff <= m.cents * APPROX_TOLERANCE)
      .sort((a, b) => a.diff - b.diff)[0];
    if (near) take(m, "aproximada", [near], m.cents - near.cents);
  }

  const matched = new Set(suggestions.map((s) => s.bankId));
  return { suggestions, unmatched: bank.filter((m) => !matched.has(m.id)).map((m) => m.id) };
}

function normalizeMovements(movements) {
  if (!Array.isArray(movements) || movements.length === 0 || movements.length > MAX_MOVEMENTS) {
    throw new Error("Envie de 1 a 2000 movimentos do extrato.");
  }
  return movements.map((m) => {
    const amount = parseMoney(m?.amount);
    const direction = directionOf(m?.type);
    const date = new Date(m?.date);
    if (!m?.id || amount === null || amount <= 0 || !direction || Number.isNaN(date.getTime())) {
      throw new Error("Movimento do extrato inválido.");
    }
    return { id: String(m.id), type: direction, amount, date, description: String(m.description || "Movimento Bancário") };
  });
}

// Sugere conciliações. Movimentos que já foram conciliados antes (reimportação) são
// separados e não entram na busca.
export async function suggest(companyId, movements) {
  const bank = normalizeMovements(movements);

  const done = await prisma.transaction.findMany({
    where: { companyId, bankFitId: { in: bank.map((m) => m.id) } },
    select: { bankFitId: true },
  });
  const alreadyReconciled = [...new Set(done.map((t) => t.bankFitId))];
  const toMatch = bank.filter((m) => !alreadyReconciled.includes(m.id));

  const pending = await prisma.transaction.findMany({
    where: { companyId, status: { not: "PAGO" }, reconciledAt: null },
    select: { id: true, date: true, type: true, amount: true },
  });

  const { suggestions, unmatched } = suggestMatches(toMatch, pending);
  return { suggestions, unmatched, alreadyReconciled };
}

// Marca lançamentos como pagos a partir de um movimento do extrato.
export async function confirm(companyId, { bank, transactionIds, allowDifference = false }) {
  const [movement] = normalizeMovements([bank]);
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw new Error("Escolha ao menos um lançamento.");
  }

  const already = await prisma.transaction.count({ where: { companyId, bankFitId: movement.id } });
  if (already > 0) {
    const error = new Error("Este movimento do extrato já foi conciliado.");
    error.status = 409;
    throw error;
  }

  const transactions = await prisma.transaction.findMany({
    where: { id: { in: transactionIds }, companyId, status: { not: "PAGO" }, reconciledAt: null },
  });
  if (transactions.length !== new Set(transactionIds).size) {
    throw new Error("Algum lançamento não existe, já está pago ou é de outra empresa.");
  }
  if (transactions.some((t) => directionOf(t.type) !== movement.type)) {
    throw new Error("Entrada do banco só concilia com entrada, e saída com saída.");
  }

  const total = sumMoney(transactions.map((t) => t.amount));
  const difference = Math.round((movement.amount - total) * 100) / 100;
  if (difference !== 0 && !allowDifference) {
    const error = new Error(`O valor do banco difere dos lançamentos em ${difference}. Confirme a diferença para concluir.`);
    error.status = 409;
    throw error;
  }

  await prisma.transaction.updateMany({
    where: { id: { in: transactions.map((t) => t.id) }, companyId },
    data: { status: "PAGO", bankFitId: movement.id, reconciledAt: new Date() },
  });

  return { reconciled: transactions.length, difference };
}

// Cria o lançamento de algo que existe só no banco (tarifa, juros, rendimento...).
export async function createFromBank(companyId, { bank, title, category, clientId }) {
  const [movement] = normalizeMovements([bank]);

  const already = await prisma.transaction.count({ where: { companyId, bankFitId: movement.id } });
  if (already > 0) {
    const error = new Error("Este movimento do extrato já foi conciliado.");
    error.status = 409;
    throw error;
  }

  if (clientId) {
    const owner = await prisma.client.count({ where: { id: clientId, companyId } });
    if (!owner) throw new Error("Cliente não encontrado nesta empresa.");
  }

  return prisma.transaction.create({
    data: {
      title: title || movement.description,
      amount: movement.amount,
      type: movement.type,
      category: category || FEE_CATEGORY,
      date: movement.date,
      status: "PAGO",
      paymentMethod: BANK_ORIGIN,
      clientId: clientId || null,
      companyId,
      bankFitId: movement.id,
      reconciledAt: new Date(),
    },
  });
}

// Desfaz uma conciliação. Lançamento criado a partir do banco (tarifa) é apagado;
// os demais voltam a pendentes.
export async function undo(companyId, transactionId) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, companyId, reconciledAt: { not: null } },
  });
  if (!transaction) throw new Error("Lançamento conciliado não encontrado.");

  // Todos os lançamentos que pagaram o mesmo movimento do extrato voltam juntos.
  const siblings = await prisma.transaction.findMany({
    where: { companyId, bankFitId: transaction.bankFitId },
  });
  let restored = 0;
  let removed = 0;
  for (const t of siblings) {
    if (t.paymentMethod === BANK_ORIGIN) {
      await prisma.transaction.delete({ where: { id: t.id } });
      removed++;
    } else {
      await prisma.transaction.update({
        where: { id: t.id },
        data: { status: "PENDENTE", bankFitId: null, reconciledAt: null },
      });
      restored++;
    }
  }
  return { restored, removed };
}
