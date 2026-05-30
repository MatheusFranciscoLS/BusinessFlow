import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createTransaction(companyId, data, fileUrl) {
  const installments = parseInt(data.installments) || 1;
  const baseDate = new Date(data.date);
  const transactions = [];

  for (let i = 0; i < installments; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setMonth(currentDate.getMonth() + i);

    let title = data.title;
    if (installments > 1) {
      title = `${data.title} (${i + 1}/${installments})`;
    }

    const isFirst = i === 0;
    const currentStatus = isFirst ? data.status || "PAGO" : "PENDENTE";

    const t = await prisma.transaction.create({
      data: {
        title: title,
        description: data.description || title,
        amount: parseFloat(data.amount),
        type: data.type,
        category: data.category,
        date: currentDate,
        status: currentStatus,
        paymentMethod: data.paymentMethod || null,
        clientId: data.clientId || null,
        fileUrl: isFirst ? fileUrl : null,
        companyId,
      },
    });
    transactions.push(t);
  }

  return transactions[0];
}

export async function getAllTransactions(companyId, month, year, clientId) {
  const where = { companyId };

  if (clientId) {
    where.clientId = clientId;
  }

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    where.date = { gte: startDate, lte: endDate };
  }

  return prisma.transaction.findMany({
    where,
    include: { client: true },
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

// 🔥 SEGREDO DA CORREÇÃO: Preserva os dados antigos se eles não forem enviados no payload!
export async function updateTransaction(companyId, id, data, fileUrl) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId },
  });
  if (!transaction) throw new Error("Transação não encontrada.");

  const updateData = {
    title: data.title !== undefined ? data.title : transaction.title,
    description:
      data.description !== undefined
        ? data.description
        : transaction.description,
    amount: data.amount ? parseFloat(data.amount) : transaction.amount,
    type: data.type !== undefined ? data.type : transaction.type,
    category:
      data.category !== undefined ? data.category : transaction.category,
    date: data.date ? new Date(data.date) : transaction.date,
    status: data.status !== undefined ? data.status : transaction.status,
    paymentMethod:
      data.paymentMethod !== undefined
        ? data.paymentMethod
        : transaction.paymentMethod,
    // Se data.clientId for enviado, atualiza (mesmo que seja null). Se não for enviado, mantém o que já estava!
    clientId:
      data.clientId !== undefined ? data.clientId : transaction.clientId,
  };

  if (fileUrl) updateData.fileUrl = fileUrl;

  return prisma.transaction.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteTransaction(companyId, id) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId },
  });
  if (!transaction) throw new Error("Transação não encontrada.");
  return prisma.transaction.delete({ where: { id } });
}

export async function updateOverdueTransactions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = await prisma.transaction.updateMany({
    where: { status: "PENDENTE", date: { lt: today } },
    data: { status: "ATRASADO" },
  });
  return overdue;
}
