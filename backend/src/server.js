import app from "./app.js";
import { execSync } from "child_process";

// 1. Garante que o Prisma esteja gerado antes de iniciar
try {
  console.log("🔄 Sincronizando Prisma Client...");
  execSync("npx prisma generate", { stdio: "ignore" }); // 'ignore' deixa o log mais limpo
} catch (err) {
  console.error("⚠️ Falha ao gerar Prisma Client:", err.message);
}

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});

// 2. A MÁGICA DO "DESLIGAMENTO GRACIOSO"
// Se o servidor receber um sinal de desligamento (SIGTERM/SIGINT), ele fecha o banco e para de aceitar novas requisições
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recebido. Fechando servidor...");
  server.close(() => {
    console.log("✅ Servidor fechado com sucesso.");
    process.exit(0);
  });
});