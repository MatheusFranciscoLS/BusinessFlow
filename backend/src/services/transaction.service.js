import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createTransaction(companyId, data, fileUrl) {
  const installments = parseInt(data.installments) || 1;
  const baseDate = new Date(data.date);
  const transactions = [];

  // 🔥 O MOTOR DE RECORRÊNCIA MÁGICO
  for (let i = 0; i < installments; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setMonth(currentDate.getMonth() + i); // Avança um mês a cada loop

    let title = data.title;
    if (installments > 1) {
      title = `${data.title} (${i + 1}/${installments})`; // Ex: Mensalidade (1/12)
    }

    // A primeira parcela segue o status que o usuário escolheu. 
    // As parcelas dos meses seguintes entram SEMPRE como PENDENTES!
    const isFirst = i === 0;
    const currentStatus = isFirst ? (data.status || 'PAGO') : 'PENDENTE';

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
        fileUrl: isFirst ? fileUrl : null, // Só anexa o PDF na primeira parcela
        companyId,
      },
    });
    transactions.push(t);
  }

  return transactions[0];
}

export async function getAllTransactions(companyId, month, year) {
  const where = { companyId };
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    where.date = { gte: startDate, lte: endDate };
  }
  return prisma.transaction.findMany({ 
    where, 
    include: { client: true }, 
    orderBy: { date: "desc" } 
  });
}

export async function getTransactionById(companyId, id) {
  const transaction = await prisma.transaction.findFirst({ where: { id, companyId } });
  if (!transaction) throw new Error("Transação não encontrada.");
  return transaction;
}

export async function updateTransaction(companyId, id, data, fileUrl) {
  const transaction = await prisma.transaction.findFirst({ where: { id, companyId } });
  if (!transaction) throw new Error("Transação não encontrada.");

  const updateData = {
    title: data.title,
    description: data.description || data.title,
    amount: data.amount ? parseFloat(data.amount) : undefined,
    type: data.type,
    category: data.category,
    date: data.date ? new Date(data.date) : undefined,
    status: data.status,
    paymentMethod: data.paymentMethod,
    clientId: data.clientId || null,
  };

  if (fileUrl) updateData.fileUrl = fileUrl;

  return prisma.transaction.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteTransaction(companyId, id) {
  const transaction = await prisma.transaction.findFirst({ where: { id, companyId } });
  if (!transaction) throw new Error("Transação não encontrada.");
  return prisma.transaction.delete({ where: { id } });
}

export async function updateOverdueTransactions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = await prisma.transaction.updateMany({
    where: { status: 'PENDENTE', date: { lt: today } },
    data: { status: 'ATRASADO' }
  });
  return overdue;
}