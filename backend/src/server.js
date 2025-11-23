import app from "./app.js";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

try {
    console.log("Gerando Prisma Client...");
    execSync("npx prisma generate", { stdio: "inherit" });
} catch (err) {
    console.error("Erro ao gerar Prisma Client", err);
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});
