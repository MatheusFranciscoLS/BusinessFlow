import prisma from "../config/prisma.js";

// Recebe o userId como segundo argumento
export async function create(data, userId) {
  const typeMap = { income: "entrada", outcome: "saida", entrada: "entrada", saida: "saida" };

  return prisma.transaction.create({
    data: {
      description: data.title || data.description,
      amount: parseFloat(data.price || data.amount),
      category: data.category,
      type: typeMap[data.type],
      date: new Date(data.date),
      userId: userId, // <--- Salva a transação com o dono dela!
    },
  });
}

// Recebe o userId
export async function getAll(userId) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId, // <--- O FILTRO MÁGICO: "Traga apenas onde o userId for igual ao meu"
    },
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

export async function update(id, data) {
  // Mapeia income/outcome para entrada/saida se necessário
  const typeMap = { income: "entrada", outcome: "saida", entrada: "entrada", saida: "saida" };

  // Prepara o objeto para o Prisma
  const updateData = {
    amount: parseFloat(data.price || data.amount),
    description: data.title || data.description,
    category: data.category,
    type: typeMap[data.type] || data.type,
    date: new Date(data.date), // Garante que a data seja atualizada
  };

  return prisma.transaction.update({
    where: { id },
    data: updateData,
  });
}

export async function remove(id) {
  return prisma.transaction.delete({ where: { id } });
}