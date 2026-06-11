import { PrismaClient } from "@prisma/client";
import { fakerPT_BR as faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A iniciar o Motor de Seed Master V2 (Com Auditoria)...\n");

  console.log("🧹 A limpar o banco de dados antigo...");
  await prisma.auditLog.deleteMany(); // 🔥 Limpeza da nova tabela
  await prisma.transaction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log("🏢 A criar o Gestor e o Escritório...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const gestor = await prisma.user.create({
    data: {
      name: "Matheus Francisco",
      email: "matheusfran.ls@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "BusinessFlow Contabilidade & BI",
      userId: gestor.id,
    },
  });

  console.log("👥 A simular carteira de clientes...");

  const premiumClientsData = [
    {
      name: "Caterpillar Engenharia Brasil",
      email: "financeiro@caterpillar.com",
      doc: "02.449.992/0001-64",
    },
    {
      name: "Panobianco Academia - Centro",
      email: "admin@panobianco.com",
      doc: "18.991.332/0001-12",
    },
    {
      name: "Pousada Praia do Espelho",
      email: "reservas@praiadoespelho.com.br",
      doc: "22.111.444/0001-99",
    },
    {
      name: "CazéTV Transmissões S/A",
      email: "contato@cazetv.com.br",
      doc: "33.444.555/0001-00",
    },
  ];

  const allClients = [];

  for (let i = 0; i < 24; i++) {
    const isPremium = i < 4;
    const clientName = isPremium
      ? premiumClientsData[i].name
      : faker.company.name();
    const clientEmail = isPremium
      ? premiumClientsData[i].email
      : faker.internet.email().toLowerCase();
    const clientDoc = isPremium
      ? premiumClientsData[i].doc
      : faker.string
          .numeric(14)
          .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

    const client = await prisma.client.create({
      data: {
        fullName: clientName,
        email: clientEmail,
        document: clientDoc,
        phone: faker.phone.number("(19) 9####-####"),
        certificateExpiry:
          Math.random() > 0.9
            ? faker.date.soon({ days: 25 })
            : faker.date.future({ years: 1 }),
        companyId: company.id,
      },
    });

    await prisma.user.create({
      data: {
        name: `Ana (${clientName.split(" ")[0]})`,
        email: clientEmail,
        password: hashedPassword,
        role: "CLIENT",
        companyAccessId: company.id,
        clientId: client.id, // 🔥 NOVO: O Vínculo Físico inquebrável!
      },
    });

    allClients.push(client);
  }

  console.log("💸 A gerar histórico, cofre e KANBAN...");

  let transCount = 0;

  for (const client of allClients) {
    const numTransactions = faker.number.int({ min: 5, max: 20 });
    for (let j = 0; j < numTransactions; j++) {
      const isIncome = faker.datatype.boolean();
      const txDate = faker.date.recent({ days: 90 });
      let status = "PAGO";
      if (txDate > new Date()) status = "PENDENTE";
      else if (Math.random() > 0.8) status = "ATRASADO";

      await prisma.transaction.create({
        data: {
          title: isIncome
            ? `Honorários Contábeis ${faker.date.month()}`
            : `Imposto ${faker.helpers.arrayElement(["DAS", "GPS", "IRPJ", "CSLL"])}`,
          amount: parseFloat(
            faker.finance.amount({ min: 500, max: 8000, dec: 2 }),
          ),
          category: isIncome ? "Honorários" : "Impostos",
          type: isIncome ? "entrada" : "saida",
          date: txDate,
          status: status,
          paymentMethod: faker.helpers.arrayElement([
            "PIX",
            "Boleto Bancário",
            "Cartão",
          ]),
          clientId: client.id,
          companyId: company.id,
          installments: 1, // 🔥 NOVO: Campo de parcelas agora é oficial
        },
      });
      transCount++;
    }

    const numDocs = faker.number.int({ min: 1, max: 5 });
    for (let k = 0; k < numDocs; k++) {
      await prisma.document.create({
        data: {
          name: `${faker.helpers.arrayElement(["Contrato Social", "Balancete Anual", "Guia de Imposto"])} - ${new Date().getFullYear()}`,
          category: faker.helpers.arrayElement([
            "Societário",
            "Contábil",
            "Fiscal",
            "Pessoal",
          ]),
          fileUrl: "/uploads/fake-document.pdf",
          clientId: client.id,
          companyId: company.id,
        },
      });
    }

    const numTasks = faker.number.int({ min: 1, max: 3 });
    for (let t = 0; t < numTasks; t++) {
      await prisma.task.create({
        data: {
          title: `${faker.helpers.arrayElement(["Calcular Folha", "Apurar Simples Nacional", "Revisar DRE"])} - ${client.fullName.split(" ")[0]}`,
          status: faker.helpers.arrayElement([
            "A_FAZER",
            "EM_ANDAMENTO",
            "CONCLUIDO",
          ]),
          priority: faker.helpers.arrayElement(["BAIXA", "MEDIA", "ALTA"]),
          dueDate: faker.date.soon({ days: 45 }),
          clientId: client.id,
          companyId: company.id,
        },
      });
    }
  }

  // 🔥 NOVO: Gerar Trilha de Auditoria (Caixa Preta)
  console.log("🕵️‍♂️ A gerar relatórios de auditoria...");
  for (let a = 0; a < 30; a++) {
    await prisma.auditLog.create({
      data: {
        action: faker.helpers.arrayElement([
          "CREATE",
          "UPDATE",
          "DELETE",
          "DOWNLOAD",
        ]),
        module: faker.helpers.arrayElement([
          "FINANCEIRO",
          "DOCUMENTOS",
          "CLIENTES",
          "KANBAN",
        ]),
        details: faker.helpers.arrayElement([
          "Fatura de R$ 1.500 excluída do sistema.",
          "Novo contrato social submetido no cofre.",
          "Status do cliente alterado para INADIMPLENTE.",
          "Dados cadastrais atualizados.",
        ]),
        userName: faker.helpers.arrayElement([
          "Matheus Francisco",
          "Ana (Cliente)",
        ]),
        userRole: faker.helpers.arrayElement(["ADMIN", "CLIENT"]),
        companyId: company.id,
        createdAt: faker.date.recent({ days: 15 }),
      },
    });
  }

  console.log("✅ SEED V2 CONCLUÍDO COM SUCESSO!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
