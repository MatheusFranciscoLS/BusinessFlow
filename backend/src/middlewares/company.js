import prisma from "../config/prisma.js";

export async function companyMiddleware(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId)
      return res.status(401).json({ error: "Utilizador não autenticado." });

    // 🔥 OTIMIZAÇÃO DE PERFORMANCE MÁXIMA: Traz apenas o necessário (sem carregar senhas e dados pesados)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true, companyAccessId: true },
    });

    if (!currentUser)
      return res
        .status(401)
        .json({ error: "Utilizador não encontrado no banco." });

    // Quem está agindo, para o log de auditoria (vem do banco, não da requisição).
    req.actor = { name: currentUser.name, role: currentUser.role };

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

    // O acesso é do dono da empresa ou de alguém da equipe dela.
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [{ userId }, { members: { some: { userId } } }],
      },
      select: {
        userId: true,
        members: { where: { userId }, select: { role: true } },
      },
    });

    if (!company)
      return res.status(403).json({ error: "Acesso negado a esta empresa." });

    // OWNER (dono), SOCIO ou ANALISTA
    req.teamRole = company.userId === userId ? "OWNER" : company.members[0].role;
    req.companyId = companyId;
    return next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro crítico na validação do acesso." });
  }
}
