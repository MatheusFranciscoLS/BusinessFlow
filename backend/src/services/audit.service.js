import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function registerLog(
  companyId,
  user,
  action,
  moduleName,
  details,
) {
  try {
    // 1. Log visual para o terminal
    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    console.log(
      `🚨 [AUDITORIA - ${timestamp}] ${user?.name || "Sistema"} -> [${action}] ${moduleName}`,
    );

    // 2. 🔥 GRAVAÇÃO PERMANENTE NO BANCO DE DADOS
    await prisma.auditLog.create({
      data: {
        companyId,
        userName: user?.name || "Sistema",
        userRole: user?.role || "N/A",
        action,
        module: moduleName,
        details,
      },
    });
  } catch (error) {
    console.error("Erro fatal ao gravar log de auditoria no banco:", error);
  }
}
