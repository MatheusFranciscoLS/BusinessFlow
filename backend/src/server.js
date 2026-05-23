import app from "./app.js";
import { execSync } from "child_process";

try {
  console.log(
    "🔄 Sincronizando Prisma e atualizando o Banco de Dados na nuvem...",
  );
  execSync("npx prisma generate", { stdio: "ignore" });
  // O comando abaixo garante que as tabelas no Render fiquem idênticas ao seu schema
  execSync("npx prisma db push --accept-data-loss", { stdio: "ignore" });
} catch (err) {
  console.error(
    "⚠️ Aviso no Prisma (pode ser ignorado se o banco já estiver atualizado).",
  );
}

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recebido. Fechando servidor...");
  server.close(() => {
    process.exit(0);
  });
});
