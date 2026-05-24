import prisma from "../config/prisma.js";

export async function create(data, userId) {
  const typeMap = { income: "entrada", outcome: "saida", entrada: "entrada", saida: "saida" };

  return prisma.transaction.create({
    data: {
      description: data.title || data.description,
      amount: parseFloat(data.price || data.amount),
      category: data.category,
      type: typeMap[data.type],
      date: new Date(data.date),
      userId: userId, 
    },
  });
}

export async function getAll(userId, month, year) {
  let whereClause = { userId };

  // Se o Front-end enviar o mês e o ano, ativamos a "Máquina do Tempo"
  if (month && year) {
    // No JavaScript, o mês começa em 0 (Janeiro = 0, Fevereiro = 1...)
    const targetMonth = parseInt(month) - 1;
    const targetYear = parseInt(year);

    // Primeiro e último dia do mês às 23:59:59
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Trazemos as transações filtradas e já ordenadas das mais recentes para as mais antigas
  return prisma.transaction.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });
}

export async function getById(id, userId) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId }
  });
  if (!transaction) throw new Error("Transação não encontrada ou acesso negado.");
  return transaction;
}

export async function update(id, data, userId) {
  await getById(id, userId); 

  const typeMap = { income: "entrada", outcome: "saida", entrada: "entrada", saida: "saida" };

  const updateData = {
    amount: parseFloat(data.price || data.amount),
    description: data.title || data.description,
    category: data.category,
    type: typeMap[data.type] || data.type,
    date: new Date(data.date),
  };

  return prisma.transaction.update({
    where: { id },
    data: updateData,
  });
}

export async function remove(id, userId) {
  await getById(id, userId); 
  return prisma.transaction.delete({ where: { id } });
}