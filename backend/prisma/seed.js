import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A iniciar a sementeira da base de dados...");

  // 1. Criar a senha criptografada (123456)
  const hashedPassword = await bcrypt.hash("123456", 8);

  // 2. Criar ou Atualizar o seu Usuário (Contador/Consultor)
  // Usamos upsert para não dar erro se o utilizador já existir
  const user = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      name: "Matheus Francisco",
      email: "admin@admin.com",
      password: hashedPassword,
    },
  });
  console.log(`✅ Utilizador criado/encontrado: ${user.name} (${user.email})`);

  // 3. Verificar se o utilizador já tem alguma empresa
  const existingCompanies = await prisma.company.findMany({
    where: { userId: user.id },
  });

  // 4. Se não tiver empresas, criamos a primeira
  if (existingCompanies.length === 0) {
    const company = await prisma.company.create({
      data: {
        name: "BusinessFlow Consultoria (Sede)",
        document: "00.000.000/0001-00",
        userId: user.id,
      },
    });
    console.log(`✅ Empresa inicial criada: ${company.name}`);
  } else {
    console.log(
      `⚠️ O utilizador já tem ${existingCompanies.length} empresa(s). Ignorando criação.`,
    );
  }

  console.log("🎉 Sementeira concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao semear:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
