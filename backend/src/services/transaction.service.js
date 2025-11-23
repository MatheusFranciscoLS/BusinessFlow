import prisma from "../config/prisma.js";

export async function create(data) {
  // Converte tipos do front (income/outcome) para o banco (entrada/saida) se necessário
  const typeMap = { income: "entrada", outcome: "saida", entrada: "entrada", saida: "saida" };

  return prisma.transaction.create({
    data: {
      description: data.title || data.description, // Aceita ambos
      amount: parseFloat(data.price || data.amount),
      category: data.category,
      type: typeMap[data.type],
      date: new Date(data.date), // Garante formato Date
    },
  });
}

export async function getAll() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" }, // Ordenar pela data da transação, não criação
  });

  // Mapeia para o formato que o Frontend espera
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