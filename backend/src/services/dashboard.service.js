import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🧠 MOTOR DE DATAS INTELIGENTE (Date Engine)
// Traduz a palavra que vem do Front-end (ex: '7dias') em datas exatas para o Banco de Dados
function getDateFilters(period) {
  const now = new Date();
  let startDate, endDate, prevStartDate, prevEndDate;

  if (period === "hoje") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - 1);
    prevEndDate = new Date(endDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
  } else if (period === "7dias") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    prevStartDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 14,
    );
    prevEndDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
      23,
      59,
      59,
      999,
    );
  } else if (period === "ano") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else if (period === "tudo") {
    startDate = new Date(2000, 0, 1); // Uma data bem antiga
    endDate = new Date(now.getFullYear() + 10, 11, 31); // Uma data no futuro
    prevStartDate = startDate;
    prevEndDate = startDate; // Crescimento base será sempre 100% para o histórico completo
  } else {
    // Padrão: 'mes'
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );
  }

  return { startDate, endDate, prevStartDate, prevEndDate };
}

export async function getSummary(userId, period = "mes") {
  // Chamamos o Motor de Datas
  const { startDate, endDate, prevStartDate, prevEndDate } =
    getDateFilters(period);

  // 1. DADOS DO PERÍODO SELECIONADO
  const currentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const entradas = currentTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + t.amount, 0);
  const saidas = currentTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + t.amount, 0);
  const saldo = entradas - saidas;

  // 2. DADOS DO PERÍODO ANTERIOR (Para o Cálculo de Crescimento)
  const prevTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: prevStartDate, lte: prevEndDate },
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

  // 3. RADAR DE INADIMPLÊNCIA (Este é global, independentemente da data)
  const inadimplentes = await prisma.client.findMany({
    where: { userId, tag: "INADIMPLENTE" },
    select: { fullName: true, phone: true },
    take: 4,
  });

  // 4. DISTRIBUIÇÃO DE RECEITA (Gráfico de Tarte filtrado pela data)
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

export async function monthly(userId, period = "mes") {
  const { startDate, endDate } = getDateFilters(period);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  // O gráfico precisa sempre dos 12 meses do ano para manter a estrutura visual
  const data = Array.from({ length: 12 }, () => ({ entradas: 0, saidas: 0 }));
  transactions.forEach((t) => {
    const m = t.date.getMonth();
    if (t.type === "entrada") data[m].entradas += t.amount;
    else data[m].saidas += t.amount;
  });

  return data;
}

export async function topClients(userId, period = "mes") {
  const { startDate, endDate } = getDateFilters(period);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "entrada",
      clientId: { not: null },
      date: { gte: startDate, lte: endDate },
    },
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

export async function recent(userId, period = "mes") {
  const { startDate, endDate } = getDateFilters(period);

  return prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "desc" },
    take: 5,
  });
}

// Funções de compatibilidade exigidas pelo Controller
export async function byCategory(userId, period) {
  return [];
}
export async function daily(userId, period) {
  return [];
}
