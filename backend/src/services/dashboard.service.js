import prisma from "../config/prisma.js";
import { startOfMonth, endOfMonth, subDays } from "date-fns";

export async function getSummary(userId) {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const entradas = await prisma.transaction.aggregate({
    where: { type: "entrada", userId, date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const saidas = await prisma.transaction.aggregate({
    where: { type: "saida", userId, date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return {
    entradas: entradas._sum.amount || 0,
    saidas: saidas._sum.amount || 0,
    saldo: (entradas._sum.amount || 0) - (saidas._sum.amount || 0),
  };
}

export async function byCategory(userId) {
  const result = await prisma.transaction.groupBy({
    by: ["category"],
    where: { userId },
    _sum: { amount: true },
  });

  return result.map((item) => ({
    category: item.category,
    total: item._sum.amount || 0,
  }));
}

export async function daily(userId) {
  const start = subDays(new Date(), 30);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start } },
    orderBy: { date: "asc" },
  });

  const result = {};

  transactions.forEach((t) => {
    const day = t.date.toISOString().split("T")[0];
    if (!result[day]) result[day] = { entradas: 0, saidas: 0 };
    if (t.type === "entrada") result[day].entradas += t.amount;
    if (t.type === "saida") result[day].saidas += t.amount;
  });

  return result;
}

export async function monthly(userId) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfYear, lte: endOfYear } },
  });

  const result = Array(12)
    .fill(null)
    .map(() => ({ entradas: 0, saidas: 0 }));

  transactions.forEach((t) => {
    const month = t.date.getMonth();
    if (t.type === "entrada") result[month].entradas += t.amount;
    if (t.type === "saida") result[month].saidas += t.amount;
  });

  return result;
}

export async function topClients(userId) {
  const transactions = await prisma.transaction.groupBy({
    by: ["clientId"],
    where: { userId, clientId: { not: null } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const clientIds = transactions.map((t) => t.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
  });

  return transactions.map((t) => {
    const client = clients.find((c) => c.id === t.clientId);
    return {
      clientName: client ? client.fullName : "Cliente Deletado",
      total: t._sum.amount || 0,
    };
  });
}

export async function recent(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    take: 5,
    orderBy: { date: "desc" },
    include: { client: true },
  });

  return transactions.map((t) => ({
    id: t.id,
    title: t.description,
    amount: t.amount,
    type: t.type === "entrada" ? "income" : "outcome",
    date: t.date.toISOString().split("T")[0],
  }));
}
