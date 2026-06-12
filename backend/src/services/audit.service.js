export async function registerLog(
  companyId,
  user,
  action,
  moduleName,
  details,
) {
  try {
    // 1. Pega o horário exato da ação
    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    // 2. Cria um log visual e bonito no console do seu servidor (Render)
    console.log(`\n🚨 [AUDITORIA - ${timestamp}]`);
    console.log(`🏢 Empresa: ${companyId}`);
    console.log(
      `👤 Usuário: ${user?.name || "Sistema"} (${user?.role || "N/A"})`,
    );
    console.log(`⚙️  Ação: [${action}] no módulo ${moduleName}`);
    console.log(`📄 Detalhes: ${details}`);
    console.log(`------------------------------------------------------\n`);

    /* 
      💡 NOTA: No futuro, se quiser salvar isso no Banco de Dados 
      (para mostrar em uma tela de "Histórico" no Front-end), 
      nós criamos uma tabela no Prisma e usamos o código abaixo:
      
      import { PrismaClient } from '@prisma/client';
      const prisma = new PrismaClient();
      
      await prisma.auditLog.create({
        data: {
          companyId,
          userName: user?.name || "Sistema",
          action,
          module: moduleName,
          details,
        }
      });
    */
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}
