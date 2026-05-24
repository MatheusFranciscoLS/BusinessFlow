import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create(data, userId) {
  return prisma.client.create({
    data: { ...data, userId },
  });
}

export async function getAll(userId) {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id, userId) {
  const client = await prisma.client.findFirst({
    where: { id, userId },
    // AQUI ESTÁ A MAGIA: Pedimos ao banco para trazer as transações deste cliente!
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!client) throw new Error("Cliente não encontrado.");
  return client;
}

export async function update(id, data, userId) {
  return prisma.client.update({
    where: { id, userId },
    data,
  });
}

export async function remove(id, userId) {
  return prisma.client.delete({
    where: { id, userId },
  });
}
