import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createDocument(companyId, data, fileUrl) {
  return prisma.document.create({
    data: {
      name: data.name,
      category: data.category,
      fileUrl,
      clientId: data.clientId,
      companyId,
    },
  });
}

// 🔥 A Fechadura Zero Trust entra no Service!
export async function getDocuments(companyId, role, userEmail) {
  let where = { companyId };

  if (role === "CLIENT") {
    const client = await prisma.client.findFirst({
      where: { companyId, email: userEmail },
    });
    if (!client) return []; // Proteção total: devolve vazio se não for do cliente
    where.clientId = client.id;
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { client: { select: { fullName: true } } },
  });
}

export async function deleteDocument(companyId, documentId) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, companyId },
  });
  if (!document) throw new Error("Documento não encontrado ou sem permissão.");

  return prisma.document.delete({ where: { id: documentId } });
}
