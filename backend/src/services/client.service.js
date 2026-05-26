import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createClient(companyId, data) {
  return prisma.client.create({
    data: { ...data, companyId },
  });
}

export async function getAllClients(companyId) {
  return prisma.client.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientById(companyId, id) {
  const client = await prisma.client.findFirst({
    where: { id, companyId },
    include: { transactions: { orderBy: { date: "desc" } } }, // Mantém o Mini-CRM a funcionar!
  });
  if (!client) throw new Error("Cliente não encontrado ou acesso negado.");
  return client;
}

export async function updateClient(companyId, id, data) {
  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) throw new Error("Cliente não encontrado.");

  return prisma.client.update({
    where: { id },
    data,
  });
}

export async function deleteClient(companyId, id) {
  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) throw new Error("Cliente não encontrado.");

  return prisma.client.delete({ where: { id } });
}
