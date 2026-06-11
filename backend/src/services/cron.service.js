import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function startCronJobs() {
  // 🕒 Roda todos os dias às 00:01 (Meia-noite e um)
  cron.schedule(
    "1 0 * * *",
    async () => {
      console.log("🤖 [CRON] A iniciar as rotinas da madrugada...");

      try {
        // 1. Zera as horas para comparar apenas os dias
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ==========================================
        // 💰 MISSÃO 1: AUDITORIA FINANCEIRA (Já tínhamos)
        // ==========================================
        const resultFin = await prisma.transaction.updateMany({
          where: { status: "PENDENTE", date: { lt: today } },
          data: { status: "ATRASADO" },
        });
        if (resultFin.count > 0)
          console.log(
            `🚨 [CRON] Financeiro: ${resultFin.count} faturas marcadas como ATRASADAS!`,
          );

        // ==========================================
        // 👁️ MISSÃO 2: O VIGIA DE CERTIFICADOS (NOVO!)
        // ==========================================
        // Qual é o dia daqui a exatos 30 dias?
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + 30);

        // Procura clientes cujo e-CNPJ vença nesse exato dia alvo
        const expiringClients = await prisma.client.findMany({
          where: {
            certificateExpiry: {
              gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              lt: new Date(targetDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        // Se encontrou alguém, cria as tarefas no Kanban automaticamente!
        if (expiringClients.length > 0) {
          for (const client of expiringClients) {
            await prisma.task.create({
              data: {
                title: `🚨 Renovar e-CNPJ: ${client.fullName.split(" ")[0]}`,
                description: `O certificado digital deste cliente vence em 30 dias. Entre em contacto para providenciar a renovação antes que o escritório perca o acesso às emissões fiscais.`,
                status: "A_FAZER",
                priority: "ALTA", // Ganha a cor amarela/laranja no seu front-end!
                dueDate: client.certificateExpiry,
                companyId: client.companyId,
                clientId: client.id,
              },
            });
          }
          console.log(
            `📅 [CRON] Kanban: ${expiringClients.length} novas tarefas de renovação criadas sozinhas!`,
          );
        } else {
          console.log("✅ [CRON] Kanban: Nenhum e-CNPJ a vencer em 30 dias.");
        }
      } catch (error) {
        console.error("❌ [CRON] Erro ao executar as rotinas:", error);
      }
    },
    {
      scheduled: true,
      timezone: "America/Sao_Paulo",
    },
  );

  console.log("⏳ Motor do Tempo (Node-Cron) ativado (Financeiro + Kanban).");
}
