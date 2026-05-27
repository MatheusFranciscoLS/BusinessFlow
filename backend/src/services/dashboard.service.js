import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
    startDate = new Date(2000, 0, 1);
    endDate = new Date(now.getFullYear() + 10, 11, 31);
    prevStartDate = startDate;
    prevEndDate = startDate;
  } else {
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

export async function getSummary(companyId, period = "mes") {
  const { startDate, endDate, prevStartDate, prevEndDate } =
    getDateFilters(period);

  // 🔥 O DASHBOARD AGORA IGNORA OS BOLETOS PENDENTES NO CAIXA!
  const currentTransactions = await prisma.transaction.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "PAGO",
    },
  });

  const entradas = currentTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + t.amount, 0);
  const saidas = currentTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + t.amount, 0);
  const saldo = entradas - saidas;

  const prevTransactions = await prisma.transaction.findMany({
    where: {
      companyId,
      date: { gte: prevStartDate, lte: prevEndDate },
      status: "PAGO",
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

  const inadimplentes = await prisma.client.findMany({
    where: { companyId, tag: "INADIMPLENTE" },
    select: { fullName: true, phone: true },
    take: 4,
  });

  const incomeByCategory = currentTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => {
      const cat = t.category || "Geral";
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const distribuicao = Object.keys(incomeByCategory)
    .map((key) => ({ name: key, value: incomeByCategory[key] }))
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

export async function monthly(companyId, period = "mes") {
  const { startDate, endDate } = getDateFilters(period);
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: "PAGO",
    },
  });
  const data = Array.from({ length: 12 }, () => ({ entradas: 0, saidas: 0 }));
  transactions.forEach((t) => {
    const m = t.date.getMonth();
    if (t.type === "entrada") data[m].entradas += t.amount;
    else data[m].saidas += t.amount;
  });
  return data;
}

export async function topClients(companyId, period = "mes") {
  const { startDate, endDate } = getDateFilters(period);
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      type: "entrada",
      status: "PAGO",
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

// O campo Recentes continua a mostrar tudo (mesmo os pendentes) para você saber o que está a acontecer
export async function recent(companyId, period = "mes") {
  const { startDate, endDate } = getDateFilters(period);
  return prisma.transaction.findMany({
    where: { companyId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "desc" },
    take: 5,
  });
}

export async function byCategory(companyId, period) {
  return [];
}
export async function daily(companyId, period) {
  return [];
}
