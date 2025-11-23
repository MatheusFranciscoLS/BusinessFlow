import app from "./app.js";
import { execSync } from "child_process";

// Gera Prisma Client no runtime
try {
  console.log("🔄 Gerando Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (err) {
  console.error("❌ Erro ao gerar Prisma Client:", err);
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});
