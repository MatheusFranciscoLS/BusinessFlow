import prisma from "../config/prisma.js";

// Honorários mensais: gera a cobrança do mês para cada cliente a partir do
// honorário mensal do cadastro, e mantém o status de inadimplência em dia.
// Só registra e avisa: não cobra nada sozinho (sem boleto, sem pagamento online).

export const FEE_CATEGORY = "Honorários";
const BILLABLE_STATUS = ["ATIVO", "INADIMPLENTE"];
const DEFAULT_DUE_DAY = 10;

const pad = (n) => String(n).padStart(2, "0");

// Vencimento: o dia pedido, ou o último dia do mês se o mês for mais curto.
function dueDate(year, month, day) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay), 12));
}

function validateMonth(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new Error("Informe um mês (1 a 12) e um ano válidos.");
  }
  return { m, y };
}

// Gera o honorário do mês para cada cliente ativo ou inadimplente com valor combinado.
// Rodar de novo no mesmo mês não duplica.
export async function generateMonthlyFees(companyId, month, year, dueDay = DEFAULT_DUE_DAY) {
  const { m, y } = validateMonth(month, year);
  const day = Number.isInteger(Number(dueDay)) && dueDay >= 1 && dueDay <= 31 ? Number(dueDay) : DEFAULT_DUE_DAY;
  const reference = `${y}-${pad(m)}`;

  const clients = await prisma.client.findMany({
    where: { companyId, status: { in: BILLABLE_STATUS }, monthlyFee: { gt: 0 } },
    select: { id: true, fullName: true, monthlyFee: true },
  });

  const existing = await prisma.transaction.findMany({
    where: { companyId, feeReference: reference, clientId: { in: clients.map((c) => c.id) } },
    select: { clientId: true },
  });
  const alreadyBilled = new Set(existing.map((t) => t.clientId));
  const toCreate = clients.filter((c) => !alreadyBilled.has(c.id));

  if (toCreate.length > 0) {
    await prisma.transaction.createMany({
      data: toCreate.map((c) => ({
        title: `Honorários ${pad(m)}/${y} - ${c.fullName}`,
        amount: c.monthlyFee,
        type: "entrada",
        category: FEE_CATEGORY,
        date: dueDate(y, m, day),
        status: "PENDENTE",
        clientId: c.id,
        companyId,
        feeReference: reference,
      })),
    });
  }

  const statusChanges = await syncDelinquency(companyId);
  return { reference, created: toCreate.length, skipped: clients.length - toCreate.length, ...statusChanges };
}

// Cobranças de entrada vencidas e não pagas, por cliente.
export async function overdue(companyId, today = new Date()) {
  const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const late = await prisma.transaction.findMany({
    where: {
      companyId,
      type: { in: ["entrada", "income"] },
      status: { not: "PAGO" },
      clientId: { not: null },
      date: { lt: startOfToday },
    },
    include: { client: { select: { id: true, fullName: true, phone: true, email: true } } },
    orderBy: { date: "asc" },
  });

  const byClient = new Map();
  for (const t of late) {
    const entry = byClient.get(t.clientId) || { client: t.client, items: [], totalCents: 0 };
    entry.items.push({
      id: t.id,
      title: t.title,
      amount: t.amount,
      dueDate: t.date,
      daysLate: Math.floor((startOfToday - t.date) / 86400000),
    });
    entry.totalCents += Math.round(t.amount * 100);
    byClient.set(t.clientId, entry);
  }

  return [...byClient.values()]
    .map(({ client, items, totalCents }) => ({ client, total: totalCents / 100, items }))
    .sort((a, b) => b.total - a.total);
}

// Cliente com cobrança vencida vira INADIMPLENTE; quando quita tudo, volta a ATIVO.
// Clientes suspensos não são mexidos.
export async function syncDelinquency(companyId, today = new Date()) {
  const lateClientIds = (await overdue(companyId, today)).map((o) => o.client.id);

  const marked = await prisma.client.updateMany({
    where: { companyId, status: "ATIVO", id: { in: lateClientIds } },
    data: { status: "INADIMPLENTE" },
  });
  const cleared = await prisma.client.updateMany({
    where: { companyId, status: "INADIMPLENTE", id: { notIn: lateClientIds } },
    data: { status: "ATIVO" },
  });

  return { markedDelinquent: marked.count, clearedDelinquent: cleared.count };
}
