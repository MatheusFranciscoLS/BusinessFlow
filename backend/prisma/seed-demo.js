// Carrega (ou remove) a demonstração: um escritório fictício com dados inventados.
//
//   npm run seed:demo              carrega a demo (em banco local)
//   npm run seed:demo -- --confirm carrega a demo em outro banco (por exemplo, o publicado)
//   npm run seed:demo -- --remove --confirm   remove só a demo
//
// Só mexe em registros da demo (e-mails @businessflow.demo e a empresa deles). Dados reais
// não são lidos nem apagados. Para a entrada sem senha aparecer no login, o servidor precisa
// de DEMO_MODE=true.
import "dotenv/config";
import prisma from "../src/config/prisma.js";
import { seedDemo, removeDemo } from "../src/services/demo.service.js";

const args = process.argv.slice(2);
const host = (process.env.DATABASE_URL || "").match(/@([^/:?]+)/)?.[1] || "";
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);

async function main() {
  if (!isLocal && !args.includes("--confirm")) {
    throw new Error(
      `O banco "${host || "(vazio)"}" não é local. A demo só cria e apaga registros próprios, ` +
        `mas por segurança passe --confirm para seguir.`,
    );
  }

  if (args.includes("--remove")) {
    const removed = await removeDemo();
    console.log(`Demo removida (${removed} usuários).`);
    return;
  }

  const summary = await seedDemo();
  console.log("Demo carregada:", JSON.stringify(summary, null, 2));
  console.log("\nPara aparecer o botão de entrada no login, defina DEMO_MODE=true no servidor.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
