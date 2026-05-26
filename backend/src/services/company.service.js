import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createCompany(userId, data) {
  return prisma.company.create({
    data: {
      name: data.name,
      document: data.document,
      userId: userId,
    },
  });
}

export async function getUserCompanies(userId) {
  return prisma.company.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCompany(userId, companyId, data) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId },
  });
  if (!company) throw new Error("Empresa não encontrada ou acesso negado.");

  return prisma.company.update({
    where: { id: companyId },
    data: { name: data.name, document: data.document },
  });
}

export async function deleteCompany(userId, companyId) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId },
  });
  if (!company) throw new Error("Empresa não encontrada ou acesso negado.");

  return prisma.company.delete({ where: { id: companyId } });
}
