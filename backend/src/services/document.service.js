import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
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

export async function signDocument(companyId, documentId, userEmail, ipAddress) {
  // 1. Garante que quem está a assinar é realmente um cliente válido
  const client = await prisma.client.findFirst({
    where: { companyId, email: userEmail },
  });
  if (!client) throw new Error("Apenas clientes autorizados podem assinar documentos.");

  // 2. Busca o documento e verifica se pertence a este cliente
  const document = await prisma.document.findFirst({
    where: { id: documentId, companyId, clientId: client.id },
  });

  if (!document) throw new Error("Documento não encontrado ou sem permissão.");
  if (document.isSigned) throw new Error("Este documento já foi assinado anteriormente.");

  // 3. A Mágica da Criptografia (Gera o Hash inquebrável)
  const timestamp = new Date();
  const rawData = `${document.id}-${client.id}-${ipAddress}-${timestamp.toISOString()}`;
  const signatureHash = crypto.createHash("sha256").update(rawData).digest("hex");

  // 4. Salva a assinatura definitiva no banco
  return prisma.document.update({
    where: { id: documentId },
    data: {
      isSigned: true,
      signedAt: timestamp,
      signedByIp: ipAddress,
      signatureHash: signatureHash,
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
