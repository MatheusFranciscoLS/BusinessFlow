import app from "./app.js";
import { execSync } from "child_process";

try {
  console.log("🔄 Gerando Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (err) {
  console.log("⚠️ Prisma Client já existia ou falhou, continuando...");
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});
