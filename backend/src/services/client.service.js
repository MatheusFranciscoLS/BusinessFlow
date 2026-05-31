import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createClient(companyId, data) {
  return prisma.client.create({
    data: {
      fullName: data.fullName,
      document: data.document || null,
      taxRegime: data.taxRegime || null,
      monthlyFee: data.monthlyFee ? parseFloat(data.monthlyFee) : 0,
      status: data.status || "ATIVO",
      email: data.email || null,
      phone: data.phone || null,
      certificateExpiry: data.certificateExpiry || null, // 🔥 AQUI ESTÁ A CORREÇÃO!
      companyId,
    },
  });
}

export async function getAllClients(companyId) {
  return prisma.client.findMany({
    where: { companyId },
    orderBy: { fullName: "asc" },
  });
}

export async function getClientById(companyId, id) {
  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) throw new Error("Cliente não encontrado.");
  return client;
}

export async function updateClient(companyId, id, data) {
  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) throw new Error("Cliente não encontrado.");

  return prisma.client.update({
    where: { id },
    data: {
      fullName: data.fullName,
      document: data.document,
      taxRegime: data.taxRegime,
      monthlyFee: data.monthlyFee ? parseFloat(data.monthlyFee) : 0,
      status: data.status,
      email: data.email,
      phone: data.phone,
      certificateExpiry: data.certificateExpiry || null, // 🔥 AQUI TAMBÉM!
    },
  });
}

export async function deleteClient(companyId, id) {
  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) throw new Error("Cliente não encontrado.");
  return prisma.client.delete({ where: { id } });
}
