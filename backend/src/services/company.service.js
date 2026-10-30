import prisma from "../config/prisma.js";


export async function createCompany(userId, data) {
  return prisma.company.create({
    data: {
      name: data.name,
      document: data.document,
      userId: userId,
    },
  });
}

// Empresas do usuário: as que ele criou (OWNER) e as em que ele está na equipe.
export async function getUserCompanies(userId) {
  const companies = await prisma.company.findMany({
    where: { OR: [{ userId }, { members: { some: { userId } } }] },
    include: { members: { where: { userId }, select: { role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return companies.map(({ members, ...company }) => ({
    ...company,
    teamRole: company.userId === userId ? "OWNER" : members[0].role,
  }));
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
