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

export async function getAll(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: userId }, 
    orderBy: { date: "desc" },
  });

  return transactions.map(t => ({
    id: t.id,
    title: t.description,
    price: t.amount,
    type: t.type === 'entrada' ? 'income' : 'outcome',
    category: t.category,
    date: t.date.toISOString().split('T')[0]
  }));
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