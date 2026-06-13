import app from "./app.js";
import { startCronJobs } from "./services/cron.service.js";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando lindamente na porta ${PORT}`);
});

// Inicia as tarefas automatizadas (Robôs de Email e Varredura)
startCronJobs();

// ==========================================
// 🛡️ DESLIGAMENTO GRACIOSO E PROTEÇÃO CONTRA QUEDAS FATAIS
// ==========================================

// Se o servidor cloud pedir para desligar
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recebido. Fechando o servidor graciosamente...");
  server.close(() => {
    console.log("Servidor encerrado.");
    process.exit(0);
  });
});

// Captura erros críticos que não foram apanhados por nenhum try/catch
process.on("uncaughtException", (err) => {
  console.error("💥 ERRO CRÍTICO (Uncaught Exception):", err);
  // Em casos de corrupção total de memória, matamos o processo para o Render reiniciá-lo limpo
  process.exit(1);
});

// Captura Promessas que falharam e ficaram "perdidas"
process.on("unhandledRejection", (err) => {
  console.error("💥 REJEIÇÃO NÃO TRATADA (Unhandled Rejection):", err);
});
