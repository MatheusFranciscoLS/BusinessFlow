import prisma from "../config/prisma.js";
import { sumMoney } from "../utils/money.js";
import { regimeKey } from "./obligations.service.js";

// Dados da tela de início do gestor e do mapa da competência.
// Tudo calculado a partir do que já existe no banco: nada de número inventado.

const INCOME = ["entrada", "income"];
const OUTCOME = ["saida", "outcome"];
const CLIENT_UPLOAD_CATEGORY = "Enviado pelo cliente";

const utcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const monthRange = (year, month) => ({ gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) });
const pad = (n) => String(n).padStart(2, "0");

function growth(current, previous) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Início do gestor: números do mês, o que fazer hoje e o fechamento.
export async function overview(companyId, now = new Date()) {
  const today = utcDay(now);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

  const [monthTx, prevTx, openIncome, lateTasks, todayTasks, tickets, uploads] = await Promise.all([
    prisma.transaction.findMany({ where: { companyId, date: monthRange(year, month) }, select: { amount: true, type: true, status: true } }),
    prisma.transaction.findMany({ where: { companyId, date: monthRange(prev.year, prev.month), status: "PAGO", type: { in: INCOME } }, select: { amount: true } }),
    prisma.transaction.findMany({
      where: { companyId, type: { in: INCOME }, status: { not: "PAGO" } },
      select: { amount: true, date: true, clientId: true, client: { select: { fullName: true } } },
    }),
    prisma.task.findMany({
      where: { companyId, status: { not: "CONCLUIDO" }, dueDate: { lt: today } },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.findMany({
      where: { companyId, status: { not: "CONCLUIDO" }, dueDate: { gte: today, lt: new Date(today.getTime() + 86400000) } },
      select: { id: true, title: true },
    }),
    prisma.ticket.findMany({
      where: { companyId, hasUnreadAdmin: true },
      select: { id: true, subject: true, client: { select: { fullName: true } } },
    }),
    prisma.document.findMany({
      where: { companyId, category: CLIENT_UPLOAD_CATEGORY, createdAt: { gte: new Date(today.getTime() - 7 * 86400000) } },
      select: { id: true, name: true, client: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const received = sumMoney(monthTx.filter((t) => INCOME.includes(t.type) && t.status === "PAGO").map((t) => t.amount));
  const expensesPaid = sumMoney(monthTx.filter((t) => OUTCOME.includes(t.type) && t.status === "PAGO").map((t) => t.amount));
  const previousReceived = sumMoney(prevTx.map((t) => t.amount));

  const late = openIncome.filter((t) => t.date < today);
  const upcoming = openIncome.filter((t) => t.date >= today);
  const lateClients = [...new Set(late.map((t) => t.client?.fullName).filter(Boolean))];

  // "Para fazer hoje": o que pede ação, do mais urgente para o menos urgente.
  const todo = [];
  if (todayTasks.length) todo.push({ kind: "vence_hoje", count: todayTasks.length, text: todayTasks.length === 1 ? todayTasks[0].title : `${todayTasks.length} tarefas vencem hoje`, link: "/app/agenda" });
  if (lateTasks.length) todo.push({ kind: "atrasado", count: lateTasks.length, text: lateTasks.length === 1 ? lateTasks[0].title : `${lateTasks.length} tarefas passaram do prazo`, link: "/app/agenda" });
  if (tickets.length) todo.push({ kind: "chamado", count: tickets.length, text: tickets.length === 1 ? `${tickets[0].client?.fullName ?? "Cliente"}: ${tickets[0].subject}` : `${tickets.length} chamados esperam resposta`, link: "/app/helpdesk" });
  if (uploads.length) todo.push({ kind: "documento", count: uploads.length, text: uploads.length === 1 ? `${uploads[0].client?.fullName ?? "Cliente"} enviou ${uploads[0].name}` : `${uploads.length} documentos enviados por clientes nesta semana`, link: "/app/documentos" });
  if (lateClients.length) todo.push({ kind: "cobranca", count: lateClients.length, text: lateClients.length === 1 ? `Cobrar ${lateClients[0]}` : `${lateClients.length} clientes com cobrança em atraso`, link: "/app/financeiro" });

  return {
    month: `${year}-${pad(month)}`,
    received,
    receivedGrowth: growth(received, previousReceived),
    receivable: { amount: sumMoney(upcoming.map((t) => t.amount)), count: upcoming.length },
    overdue: { amount: sumMoney(late.map((t) => t.amount)), count: late.length, clients: lateClients },
    closing: { received, expensesPaid, result: Math.round((received - expensesPaid) * 100) / 100 },
    todo,
  };
}

// ---------- mapa da competência ----------

// Colunas do mapa: só o que o sistema acompanha de verdade.
const OBLIGATION_COLUMNS = [
  { key: "das", regimes: ["SIMPLES"] },
  { key: "dctfweb", regimes: ["PRESUMIDO", "REAL"] },
];

function taskStatus(task, today) {
  if (!task) return { status: "sem_tarefa" };
  if (task.status === "CONCLUIDO") return { status: "ok", dueDate: task.dueDate, taskId: task.id };
  return { status: task.dueDate < today ? "atrasado" : "pendente", dueDate: task.dueDate, taskId: task.id };
}

function feeStatus(fee, client, today) {
  if (!fee) return { status: client.monthlyFee > 0 ? "sem_cobranca" : "na" };
  if (fee.status === "PAGO") return { status: "ok", amount: fee.amount };
  return { status: fee.date < today ? "atrasado" : "pendente", amount: fee.amount, dueDate: fee.date };
}

// Clientes nas linhas e as entregas da competência (mês de referência) nas colunas.
// As guias de uma competência vencem no mês seguinte (DAS da competência outubro vence em novembro).
export async function competence(companyId, month, year, now = new Date()) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new Error("Informe um mês (1 a 12) e um ano válidos.");
  }
  const today = utcDay(now);
  const due = m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
  const dueKey = `${due.year}-${pad(due.month)}`;

  const clients = await prisma.client.findMany({
    where: { companyId, status: { in: ["ATIVO", "INADIMPLENTE"] } },
    select: { id: true, fullName: true, taxRegime: true, monthlyFee: true, status: true },
    orderBy: { fullName: "asc" },
  });
  const ids = clients.map((c) => c.id);

  const [tasks, fees, uploads] = await Promise.all([
    prisma.task.findMany({
      where: { companyId, clientId: { in: ids }, obligationKey: { in: OBLIGATION_COLUMNS.map((c) => `${c.key}:${dueKey}`) } },
      select: { id: true, clientId: true, obligationKey: true, status: true, dueDate: true },
    }),
    prisma.transaction.findMany({
      where: { companyId, clientId: { in: ids }, feeReference: `${y}-${pad(m)}` },
      select: { clientId: true, status: true, amount: true, date: true },
    }),
    prisma.document.groupBy({
      by: ["clientId"],
      where: { companyId, clientId: { in: ids }, category: CLIENT_UPLOAD_CATEGORY, createdAt: monthRange(y, m) },
      _count: { _all: true },
    }),
  ]);

  const taskOf = (clientId, key) => tasks.find((t) => t.clientId === clientId && t.obligationKey === `${key}:${dueKey}`);
  const uploadsOf = (clientId) => uploads.find((u) => u.clientId === clientId)?._count._all ?? 0;

  const rows = clients.map((client) => {
    const regime = regimeKey(client.taxRegime);
    const cells = {};
    for (const column of OBLIGATION_COLUMNS) {
      cells[column.key] = column.regimes.includes(regime) ? taskStatus(taskOf(client.id, column.key), today) : { status: "na" };
    }
    cells.honorario = feeStatus(fees.find((f) => f.clientId === client.id), client, today);
    cells.documentos = { status: "info", count: uploadsOf(client.id) };
    return { client: { id: client.id, name: client.fullName, regime: client.taxRegime, status: client.status }, cells };
  });

  const summary = { ok: 0, pendente: 0, atrasado: 0, sem_tarefa: 0, sem_cobranca: 0 };
  for (const row of rows) {
    for (const [key, cell] of Object.entries(row.cells)) {
      if (key === "documentos") continue;
      if (cell.status in summary) summary[cell.status] += 1;
    }
  }

  return {
    competence: `${y}-${pad(m)}`,
    dueMonth: dueKey,
    columns: [
      { key: "das", label: "DAS e PGDAS-D", due: "dia 20 do mês seguinte" },
      { key: "dctfweb", label: "DCTFWeb", due: "último dia útil do mês seguinte" },
      { key: "honorario", label: "Honorário" },
      { key: "documentos", label: "Enviados pelo cliente" },
    ],
    rows,
    summary,
  };
}
