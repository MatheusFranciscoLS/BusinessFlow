import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getLogs(req, res) {
  try {
    const companyId = req.companyId;

    // 🔥 Proteção Máxima: Apenas o Gestor (ADMIN) pode ver a Caixa Preta!
    if (req.user?.role === "CLIENT" || req.query.role === "CLIENT") {
      return res
        .status(403)
        .json({
          error:
            "Acesso negado. Apenas gestores podem visualizar logs de auditoria.",
        });
    }

    // Puxa os últimos 100 registos do escritório, do mais recente para o mais antigo
    const logs = await prisma.auditLog.findMany({
      where: { companyId: companyId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.status(200).json(logs);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
