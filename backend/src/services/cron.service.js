import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function startCronJobs() {
  // 🕒 Configurado para rodar todos os dias às 00:01 (Meia-noite e um)
  // Para testar agora mesmo (a cada minuto), troque '1 0 * * *' por '* * * * *'
  cron.schedule(
    "1 0 * * *",
    async () => {
      console.log(
        "🤖 [CRON] A iniciar a Auditoria Financeira da Meia-Noite...",
      );

      try {
        // 1. Descobrir que dia é hoje (zerando as horas para comparar só a data)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. A MÁGICA: Buscar tudo o que está PENDENTE e cuja data já passou de hoje
        const result = await prisma.transaction.updateMany({
          where: {
            status: "PENDENTE",
            date: {
              lt: today, // "lt" = Less Than (Menor que hoje)
            },
          },
          data: {
            status: "ATRASADO",
          },
        });

        if (result.count > 0) {
          console.log(
            `🚨 [CRON] Auditoria concluída: ${result.count} faturas foram marcadas como ATRASADAS!`,
          );
        } else {
          console.log(
            "✅ [CRON] Auditoria concluída: Nenhum atraso detetado hoje.",
          );
        }
      } catch (error) {
        console.error(
          "❌ [CRON] Erro ao executar a auditoria financeira:",
          error,
        );
      }
    },
    {
      scheduled: true,
      timezone: "America/Sao_Paulo", // Garante que a meia-noite é no fuso horário do Brasil
    },
  );

  console.log("⏳ Motor do Tempo (Node-Cron) ativado e em espera.");
}
