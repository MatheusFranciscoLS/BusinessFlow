import prisma from "../config/prisma.js";
import { startOfMonth, endOfMonth, subDays } from "date-fns"; // <--- ADICIONE subDays AQUI

export async function getSummary() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const entradas = await prisma.transaction.aggregate({
    where: { type: "entrada", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const saidas = await prisma.transaction.aggregate({
    where: { type: "saida", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return {
    entradas: entradas._sum.amount || 0,
    saidas: saidas._sum.amount || 0,
    saldo: (entradas._sum.amount || 0) - (saidas._sum.amount || 0),
  };
}

export async function byCategory() {
  const result = await prisma.transaction.groupBy({
    by: ["category"],
    _sum: { amount: true },
  });

  return result.map((item) => ({
    category: item.category,
    total: item._sum.amount || 0,
  }));
}

export async function daily() {
  const start = subDays(new Date(), 30); // <--- Agora funciona

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: start } },
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

export async function monthly() {
  const now = new Date();
  const currentYear = now.getFullYear();
  // Pega transações apenas do ano atual para o gráfico não ficar confuso
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startOfYear, lte: endOfYear }
    }
  });

  // Inicializa array de 12 meses
  const result = Array(12).fill(null).map(() => ({
    entradas: 0,
    saidas: 0
  }));

  transactions.forEach((t) => {
    const month = t.date.getMonth(); // 0–11
    if (t.type === "entrada") result[month].entradas += t.amount;
    if (t.type === "saida") result[month].saidas += t.amount;
  });

  return result;
}

export async function topClients() {
  // Filtra apenas transações que tem clientId
  const transactions = await prisma.transaction.groupBy({
    by: ["clientId"],
    where: { clientId: { not: null } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const result = [];

  for (const t of transactions) {
    const client = await prisma.client.findUnique({
      where: { id: t.clientId }
    });

    if (client) {
      result.push({
        clientName: client.fullName, // ou client.name dependendo do seu schema
        total: t._sum.amount || 0
      });
    }
  }

  return result;
}

export async function recent() {
  const transactions = await prisma.transaction.findMany({
    take: 5, // Pega apenas as 5 últimas
    orderBy: { date: "desc" }, // Ordena da mais nova para a mais velha
    include: { client: true }, // Traz o nome do cliente (opcional)
  });

  return transactions.map(t => ({
    id: t.id,
    title: t.description,
    amount: t.amount,
    type: t.type === 'entrada' ? 'income' : 'outcome', // Padroniza para o Front
    date: t.date.toISOString().split('T')[0]
  }));
}