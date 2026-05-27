import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function companyMiddleware(req, res, next) {
  try {
    // 1. Descobrimos quem é o utilizador que está a tentar aceder
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) {
      return res.status(401).json({ error: "Utilizador não autenticado." });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return res
        .status(401)
        .json({ error: "Utilizador não encontrado no banco." });
    }

    // 🔥 2. A MÁGICA DA SEGURANÇA DE NÍVEL ENTERPRISE
    if (currentUser.role === "CLIENT") {
      // Se for um CLIENTE, ignoramos o que ele pediu e FORÇAMOS a empresa dele!
      if (!currentUser.companyAccessId) {
        return res
          .status(403)
          .json({ error: "Cliente sem empresa vinculada." });
      }
      req.companyId = currentUser.companyAccessId;
      return next();
    }

    // 3. Se for o ADMIN (Você), lemos a empresa que você escolheu no Menu Lateral
    const companyId = req.headers["x-company-id"];

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "ID da empresa não fornecido (x-company-id)." });
    }

    // Verifica se a empresa realmente pertence ao escritório do ADMIN
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: currentUser.id },
    });

    if (!company) {
      return res.status(403).json({ error: "Acesso negado a esta empresa." });
    }

    // Tudo certo! Passa o ID para a frente
    req.companyId = companyId;
    return next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro interno ao validar a empresa." });
  }
}
