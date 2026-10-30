import prisma from "../config/prisma.js";

// Para o perfil CLIENT, descobre qual cadastro de cliente é o dele (pelo e-mail,
// dentro da empresa a que ele tem acesso) e deixa em req.portal.clientId.
// Para o gestor não faz nada: req.portal fica indefinido.
// Rodar depois de authMiddleware e companyMiddleware.
export async function portalScope(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, email: true },
    });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado." });

    if (user.role === "CLIENT") {
      const client = await prisma.client.findFirst({
        where: { email: user.email, companyId: req.companyId },
        select: { id: true },
      });
      req.portal = { clientId: client?.id ?? null };
    }
    return next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na verificação de acesso." });
  }
}
