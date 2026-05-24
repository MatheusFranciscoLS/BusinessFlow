import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSummary(userId) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Limites de tempo (Este Mês vs Mês Passado)
  const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);

  // 1. DADOS DESTE MÊS
  const currentTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfCurrentMonth } },
  });

  const entradas = currentTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + t.amount, 0);
  const saidas = currentTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + t.amount, 0);
  const saldo = entradas - saidas;

  // 2. DADOS DO MÊS PASSADO (Para Crescimento)
  const prevTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
    },
  });

  const prevEntradas = prevTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + t.amount, 0);
  const prevSaidas = prevTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + t.amount, 0);

  const growthEntradas =
    prevEntradas === 0 ? 100 : ((entradas - prevEntradas) / prevEntradas) * 100;
  const growthSaidas =
    prevSaidas === 0 ? 100 : ((saidas - prevSaidas) / prevSaidas) * 100;

  // 3. RADAR DE INADIMPLÊNCIA
  const inadimplentes = await prisma.client.findMany({
    where: { userId, tag: "INADIMPLENTE" },
    select: { fullName: true, phone: true },
    take: 4, // Pegamos apenas os 4 principais para o radar visual
  });

  // 4. DISTRIBUIÇÃO DE RECEITA (Gráfico de Tarte)
  const incomeByCategory = currentTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => {
      const cat = t.category || "Geral";
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const distribuicao = Object.keys(incomeByCategory)
    .map((key) => ({
      name: key,
      value: incomeByCategory[key],
    }))
    .sort((a, b) => b.value - a.value);

  return {
    entradas,
    saidas,
    saldo,
    growthEntradas: parseFloat(growthEntradas.toFixed(1)),
    growthSaidas: parseFloat(growthSaidas.toFixed(1)),
    inadimplentes,
    distribuicao,
  };
}

export async function monthly(userId) {
  const year = new Date().getFullYear();
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: new Date(year, 0, 1) } },
  });

  const data = Array.from({ length: 12 }, () => ({ entradas: 0, saidas: 0 }));
  transactions.forEach((t) => {
    const m = t.date.getMonth();
    if (t.type === "entrada") data[m].entradas += t.amount;
    else data[m].saidas += t.amount;
  });
  return data;
}

export async function topClients(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "entrada", clientId: { not: null } },
    include: { client: true },
  });
  const totals = transactions.reduce((acc, t) => {
    if (!t.client) return acc;
    acc[t.clientId] = {
      clientName: t.client.fullName,
      total: (acc[t.clientId]?.total || 0) + t.amount,
    };
    return acc;
  }, {});
  return Object.values(totals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export async function recent(userId) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 5,
  });
}

// Funções de compatibilidade exigidas pelo Controller
export async function byCategory(userId) {
  return [];
}
export async function daily(userId) {
  return [];
}
