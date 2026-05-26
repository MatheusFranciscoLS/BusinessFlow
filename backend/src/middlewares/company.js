import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function companyMiddleware(req, res, next) {
  // O Front-end será obrigado a enviar o ID da empresa no cabeçalho
  const companyId = req.headers["x-company-id"];

  if (!companyId) {
    return res
      .status(400)
      .json({
        error: "ID da empresa (x-company-id) não fornecido no cabeçalho.",
      });
  }

  try {
    const userId = req.userId || req.user?.id;

    // Verifica se a empresa existe e se pertence a este contabilista
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: userId },
    });

    if (!company) {
      return res.status(403).json({ error: "Acesso negado a esta empresa." });
    }

    // Se passar na verificação, guardamos o ID da empresa para o "Controller" usar
    req.companyId = companyId;
    return next();
  } catch (err) {
    return res.status(500).json({ error: "Erro ao validar empresa." });
  }
}
