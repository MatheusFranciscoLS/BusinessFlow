import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando a execução da Master Seed B2B...");

  // 1. Limpeza controlada para evitar violações de chaves estrangeiras
  console.log("🧹 Realizando a limpeza profunda do banco de dados...");
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 2. Criar o Dono da Agência Contábil (Admin)
  console.log("👤 Criando credenciais do Administrador da Agência...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Matheus Francisco",
      email: "matheus@businessflow.com",
      password: hashedPassword,
      role: "ADMIN",
      agencyName: "BusinessFlow Contabilidade Premium",
    },
  });

  // 3. Criar a Organização/Agência Contábil no ecossistema
  const company = await prisma.company.create({
    data: {
      name: "BusinessFlow Contabilidade Premium LTDA",
      document: "11.222.333/0001-99",
      userId: adminUser.id,
    },
  });

  // 4. Criar Clientes no CRM da Agência (Dossiês de Empresas)
  console.log("🏢 Cadastrando dossiês de clientes no CRM...");

  // Data simulada para o Certificado Digital vencer daqui a 10 dias (Garante o gatilho do robô!)
  const dateExpiryCert = new Date();
  dateExpiryCert.setDate(dateExpiryCert.getDate() + 10);

  const client1 = await prisma.client.create({
    data: {
      fullName: "Clínica Sorriso Odontologia LTDA",
      document: "22.333.444/0001-88",
      taxRegime: "Simples Nacional",
      monthlyFee: 1200.0,
      status: "ATIVO",
      email: "ana@clinicasorriso.com",
      phone: "(19) 99888-7766",
      certificateExpiry: dateExpiryCert, // ⚠️ Alvo perfeito para o Auto-Scan!
      companyId: company.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      fullName: "TechX Inovações Tecnológicas",
      document: "55.666.777/0001-55",
      taxRegime: "Lucro Presumido",
      monthlyFee: 2500.0,
      status: "INADIMPLENTE", // ⚠️ Vai testar o gráfico de risco do Dashboard!
      email: "contato@techx.com",
      phone: "(11) 98765-4321",
      companyId: company.id,
    },
  });

  // 5. Gerar Contas de Acesso para os Clientes (Portal do Cliente)
  console.log("🔑 Gerando logins de acesso isolados para a Área do Cliente...");

  await prisma.user.create({
    data: {
      name: "Ana Sorriso",
      email: "ana@clinicasorriso.com", // Mesmos e-mails do CRM para o cruzamento!
      password: hashedPassword,
      role: "CLIENT",
      companyAccessId: company.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Rodrigo TechX",
      email: "contato@techx.com",
      password: hashedPassword,
      role: "CLIENT",
      companyAccessId: company.id,
    },
  });

  // 6. Lançamentos Financeiros (Para alimentar o Caixa Geral, BPO e DRE)
  console.log("💰 Injetando histórico contábil e conciliações financeiras...");

  // Referências de datas para o mês corrente
  const today = new Date();
  const datePaid = new Date(today.getFullYear(), today.getMonth(), 10);
  const datePending = new Date(today.getFullYear(), today.getMonth(), 28);

  await prisma.transaction.createMany({
    data: [
      // Entradas Realizadas (Lucro no DRE)
      {
        title: "Honorários Contábeis - Clínica Sorriso",
        description:
          "Mensalidade referente aos serviços contábeis recorrentes.",
        amount: 1200.0,
        type: "entrada",
        category: "Honorários Contábeis",
        date: datePaid,
        status: "PAGO",
        paymentMethod: "PIX",
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Faturamento de Consultoria Médica",
        description:
          "BPO Financeiro: Entrada de prestação de serviços da Clínica Sorriso.",
        amount: 15800.0,
        type: "entrada",
        category: "Serviços",
        date: datePaid,
        status: "PAGO",
        paymentMethod: "Boleto Bancário",
        clientId: client1.id,
        companyId: company.id,
      },
      // Despesas Internas Pagas da Agência
      {
        title: "Folha de Pagamento - Equipe Técnica",
        description: "Salários dos analistas contábeis e fiscais da agência.",
        amount: 8500.0,
        type: "saida",
        category: "Folha de Pagamento",
        date: datePaid,
        status: "PAGO",
        paymentMethod: "Boleto Bancário",
        companyId: company.id,
      },
      // Guias de Impostos Pagas de Clientes
      {
        title: "Guia de Imposto (DAS)",
        description:
          "Imposto Simples Nacional mensal unificado da Clínica Sorriso.",
        amount: 948.0,
        type: "saida",
        category: "Impostos",
        date: datePaid,
        status: "PAGO",
        paymentMethod: "PIX",
        clientId: client1.id,
        companyId: company.id,
      },
      // ⚠️ GATILHOS DO RADAR BPO (Pendentes e Atrasados)
      {
        title: "Conta de Energia Elétrica",
        description: "BPO Financeiro: Despesa fixa de infraestrutura pendente.",
        amount: 250.0,
        type: "saida",
        category: "Despesas Fixas",
        date: datePending,
        status: "PENDENTE", // Aparece no radar e no card de despesas
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Honorários Contábeis Atrasados - TechX",
        description: "Mensalidade em aberto com mais de 5 dias de atraso.",
        amount: 2500.0,
        type: "entrada",
        category: "Honorários Contábeis",
        date: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 5,
        ),
        status: "PENDENTE", // Alimentará o indicador de inadimplência pendente
        clientId: client2.id,
        companyId: company.id,
      },
    ],
  });

  // 7. Popular o Quadro Operacional Kanban
  console.log("📋 Alimentando cartões operacionais no quadro Kanban...");
  await prisma.task.createMany({
    data: [
      {
        title: "Apurar Simples Nacional - Clínica Sorriso",
        description:
          "Baixar extrato de faturamento e emitir a DAS unificada do mês.",
        status: "A_FAZER",
        priority: "ALTA",
        dueDate: datePending,
        clientId: client1.id,
        companyId: company.id,
      },
      {
        title: "Conciliação do Pró-Labore dos Sócios",
        description:
          "Verificar retiradas bancárias e bater com os lançamentos de RH.",
        status: "EM_ANDAMENTO",
        priority: "NORMAL",
        dueDate: datePending,
        clientId: client1.id,
        companyId: company.id,
      },
    ],
  });

  // 8. Popular a Central de Suporte e Helpdesk (Atendimentos em Tempo Real)
  console.log("💬 Abrindo chamados históricos de atendimento...");
  const ticket = await prisma.ticket.create({
    data: {
      subject: "Dúvida sobre Emissão de Nota Fiscal conjugada",
      department: "Fiscal e Tributário",
      description:
        "Precisamos emitir uma nota de serviço junto com venda de materiais médicos na mesma guia.",
      priority: "ALTA",
      status: "ABERTO",
      hasUnreadAdmin: true, // Aciona a bolinha vermelha de alerta para o escritório!
      hasUnreadClient: false,
      clientId: client1.id,
      companyId: company.id,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      message:
        "Olá, Matheus! Conseguem nos orientar se o Simples Nacional unifica essa emissão de venda e serviço?",
      senderRole: "CLIENT",
      senderName: "Ana Sorriso",
      ticketId: ticket.id,
    },
  });

  // 9. Injetar Metadados no Cofre Digital (GED)
  console.log("🗄️ Arquivando documentos estruturais no Cofre Digital...");
  await prisma.document.create({
    data: {
      name: "Contrato Social Atualizado - Alteração Cláusula 4",
      category: "Societário (Contrato Social)",
      fileUrl: "/uploads/documents/sample_contrato_social.pdf",
      clientId: client1.id,
      companyId: company.id,
    },
  });

  console.log(
    "✨ Banco de dados populado com maestria de Engenharia de Software!",
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro fatal ao executar a Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
