import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o Super Seed do BusinessFlow...");

  // 1. Limpar banco atual para evitar duplicações
  console.log("🧹 Limpando dados antigos...");
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // 2. PRIMEIRO: Criar o Usuário Gestor (Admin)
  const hashedPassword = await bcrypt.hash("123456", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Matheus Francisco",
      email: "matheus@businessflow.com",
      password: hashedPassword,
      role: "ADMIN",
      agencyName: "BusinessFlow Contabilidade",
    },
  });

  // 3. SEGUNDO: Criar a Empresa Principal, vinculando-a ao Admin
  const company = await prisma.company.create({
    data: {
      name: "BusinessFlow Contabilidade Premium",
      document: "11.222.333/0001-99",
      userId: admin.id, // 🔥 Agora sim! Dizemos ao banco quem é o dono.
    },
  });

  // 4. Criar Clientes (CRM Completo com os novos campos)
  console.log("🏢 Criando Dossiês de Clientes (CRM)...");
  const client1 = await prisma.client.create({
    data: {
      fullName: "TechX Inovações Ltda",
      document: "00.111.222/0001-33",
      taxRegime: "Lucro Presumido",
      monthlyFee: 3500.0,
      email: "contato@techx.com",
      phone: "(11) 99999-1111",
      status: "ATIVO",
      billingDay: "10",
      certificateExpiry: new Date("2027-01-15T00:00:00Z"),
      notes: "Cliente VIP. Enviar relatórios DRE sempre com cópia para o CEO.",
      companyId: company.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      fullName: "Clínica Sorriso",
      document: "99.888.777/0001-55",
      taxRegime: "Simples Nacional",
      monthlyFee: 1200.0,
      email: "financeiro@clinicasorriso.com",
      phone: "(11) 98888-2222",
      status: "ATIVO",
      billingDay: "05",
      certificateExpiry: new Date("2026-06-10T00:00:00Z"), // 🔥 Certificado a vencer
      notes: "A Dona Ana prefere receber os avisos de impostos pelo WhatsApp.",
      companyId: company.id,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      fullName: "Padaria do João",
      document: "44.555.666/0001-77",
      taxRegime: "Simples Nacional",
      monthlyFee: 850.0,
      email: "joao@padaria.com",
      phone: "(11) 97777-3333",
      status: "INADIMPLENTE",
      billingDay: "20",
      certificateExpiry: new Date("2026-11-20T00:00:00Z"),
      notes:
        "Cliente com 2 meses de honorários em atraso. Ligar para negociar.",
      companyId: company.id,
    },
  });

  // 5. Criar Agenda e Prazos
  console.log("📅 Preenchendo a Agenda...");
  await prisma.appointment.createMany({
    data: [
      {
        title: "Fechamento Folha de Pagamento",
        date: new Date("2026-05-05T10:00:00Z"),
        type: "meeting",
        status: "CONCLUIDO",
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Enviar DAS Simples Nacional",
        date: new Date("2026-05-20T14:00:00Z"),
        type: "deadline",
        status: "PENDENTE",
        clientId: client3.id,
        companyId: company.id,
      },
      {
        title: "Reunião de Planejamento Tributário",
        date: new Date("2026-05-29T09:00:00Z"),
        type: "meeting",
        status: "PENDENTE",
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Renovar e-CNPJ da Clínica (Urgente)",
        date: new Date("2026-06-05T00:00:00Z"),
        type: "deadline",
        status: "ATRASADO",
        clientId: client2.id,
        companyId: company.id,
      },
    ],
  });

  // 6. Criar Transações Financeiras (Extrato e DRE Inteligente)
  console.log("💰 Gerando o fluxo de caixa...");
  await prisma.transaction.createMany({
    data: [
      {
        title: "Honorários TechX",
        amount: 3500.0,
        type: "entrada",
        category: "Honorários Contábeis",
        date: new Date("2026-05-10T12:00:00Z"),
        status: "PAGO",
        paymentMethod: "PIX",
        companyId: company.id,
      },
      {
        title: "Honorários Clínica Sorriso",
        amount: 1200.0,
        type: "entrada",
        category: "Honorários Contábeis",
        date: new Date("2026-05-05T12:00:00Z"),
        status: "PAGO",
        paymentMethod: "Boleto Bancário",
        companyId: company.id,
      },
      {
        title: "Honorários Padaria do João",
        amount: 850.0,
        type: "entrada",
        category: "Honorários Contábeis",
        date: new Date("2026-05-20T12:00:00Z"),
        status: "ATRASADO",
        companyId: company.id,
      },

      {
        title: "Aluguel da Sede",
        amount: 1500.0,
        type: "saida",
        category: "Despesas Fixas",
        date: new Date("2026-05-05T12:00:00Z"),
        status: "PAGO",
        paymentMethod: "PIX",
        companyId: company.id,
      },
      {
        title: "Licença Software Contábil",
        amount: 450.0,
        type: "saida",
        category: "Despesas Fixas",
        date: new Date("2026-05-15T12:00:00Z"),
        status: "PAGO",
        paymentMethod: "Boleto Bancário",
        companyId: company.id,
      },
      {
        title: "Conta de Energia Elétrica",
        amount: 250.0,
        type: "saida",
        category: "Despesas Fixas",
        date: new Date("2026-05-28T12:00:00Z"),
        status: "PENDENTE",
        companyId: company.id,
      },

      // BPO Financeiro da Clínica Sorriso
      {
        title: "Faturamento de Consultas Médicas",
        amount: 15800.0,
        type: "entrada",
        category: "Serviços",
        date: new Date("2026-05-12T12:00:00Z"),
        status: "PAGO",
        clientId: client2.id,
        companyId: company.id,
      },
      {
        title: "Pagamento de Dentistas (Folha)",
        amount: 6500.0,
        type: "saida",
        category: "Folha de Pagamento",
        date: new Date("2026-05-05T12:00:00Z"),
        status: "PAGO",
        clientId: client2.id,
        companyId: company.id,
      },
      {
        title: "Guia de Imposto (DAS)",
        amount: 948.0,
        type: "saida",
        category: "Impostos",
        date: new Date("2026-05-20T12:00:00Z"),
        status: "PAGO",
        clientId: client2.id,
        companyId: company.id,
      },

      // BPO Financeiro da TechX
      {
        title: "Venda de Software (Projeto A)",
        amount: 45000.0,
        type: "entrada",
        category: "Serviços Extras",
        date: new Date("2026-05-10T12:00:00Z"),
        status: "PAGO",
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Salários dos Programadores",
        amount: 18000.0,
        type: "saida",
        category: "Folha de Pagamento",
        date: new Date("2026-05-05T12:00:00Z"),
        status: "PAGO",
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Fatura de Servidores AWS",
        amount: 2500.0,
        type: "saida",
        category: "Despesas Fixas",
        date: new Date("2026-05-15T12:00:00Z"),
        status: "PAGO",
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Distribuição de Lucros Sócios",
        amount: 5000.0,
        type: "saida",
        category: "Distribuição de Lucros aos Sócios",
        date: new Date("2026-05-25T12:00:00Z"),
        status: "PAGO",
        clientId: client1.id,
        companyId: company.id,
      },
    ],
  });

  console.log("✅ Super Seed finalizado com sucesso!");
  console.log("--------------------------------------------------");
  console.log("Bem-vindo de volta! Credenciais de Acesso:");
  console.log("E-mail: matheus@businessflow.com");
  console.log("Senha: 123456");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
