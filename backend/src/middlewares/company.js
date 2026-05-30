import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function companyMiddleware(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId)
      return res.status(401).json({ error: "Utilizador não autenticado." });

    // 🔥 OTIMIZAÇÃO DE PERFORMANCE MÁXIMA: Traz apenas o necessário (sem carregar senhas e dados pesados)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyAccessId: true },
    });

    if (!currentUser)
      return res
        .status(401)
        .json({ error: "Utilizador não encontrado no banco." });

    // 🔥 SEGURANÇA TOTAL PARA O CLIENTE
    if (currentUser.role === "CLIENT") {
      if (!currentUser.companyAccessId)
        return res
          .status(403)
          .json({ error: "Cliente sem empresa vinculada." });
      req.companyId = currentUser.companyAccessId;
      return next();
    }

    // 🔥 PARA O ESCRITÓRIO: Verifica o menu lateral
    const companyId = req.headers["x-company-id"];
    if (!companyId)
      return res
        .status(400)
        .json({ error: "ID da empresa não fornecido no cabeçalho." });

    // 🔥 OTIMIZAÇÃO: "count" não descarrega a empresa para a memória, apenas responde com um número (1 ou 0)
    const companyExists = await prisma.company.count({
      where: { id: companyId, userId: userId },
    });

    if (companyExists === 0)
      return res.status(403).json({ error: "Acesso negado a esta empresa." });

    req.companyId = companyId;
    return next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro crítico na validação do acesso." });
  }
}
