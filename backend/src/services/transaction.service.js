import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createTransaction(companyId, data) {
  return prisma.transaction.create({
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      clientId: data.clientId || null,
      companyId, // 🔥 Vinculado à empresa do contabilista
    },
  });
}

export async function getAllTransactions(companyId, month, year) {
  const where = { companyId };

  // Filtros da Máquina do Tempo do Financeiro
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    where.date = { gte: startDate, lte: endDate };
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function getTransactionById(companyId, id) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId },
  });
  if (!transaction) throw new Error("Transação não encontrada.");
  return transaction;
}

export async function updateTransaction(companyId, id, data) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId },
  });
  if (!transaction) throw new Error("Transação não encontrada.");

  return prisma.transaction.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: data.date ? new Date(data.date) : undefined,
      clientId: data.clientId || null,
    },
  });
}

export async function deleteTransaction(companyId, id) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId },
  });
  if (!transaction) throw new Error("Transação não encontrada.");

  return prisma.transaction.delete({ where: { id } });
}
