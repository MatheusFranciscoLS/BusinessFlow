import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../config/prisma.js";
import { DEMO_DOMAIN, DEMO_PROFILES } from "../utils/demo.js";
import { generateObligations } from "./obligations.service.js";

// Carrega a demonstração: um escritório de contabilidade FICTÍCIO, com clientes, lançamentos,
// documentos, chamados, tarefas e auditoria inventados, para mostrar todas as telas.
//
// Segurança:
// - Só mexe em registros da demo (usuários com e-mail @businessflow.demo e a empresa deles).
//   Dados reais nunca são lidos nem apagados.
// - As contas da demo recebem senha aleatória que ninguém conhece: a entrada é só pelo
//   botão de demonstração (DEMO_MODE=true), e a sessão é somente leitura.

const COMPANY_NAME = "Contabilidade Modelo (DEMONSTRAÇÃO)";

const CLIENTS = [
  { name: "Padaria Pão Quente Ltda", regime: "Simples Nacional", fee: 650 },
  { name: "Clínica Vida Plena", regime: "Lucro Presumido", fee: 2200 },
  { name: "Oficina Mecânica Rápida", regime: "Simples Nacional", fee: 780 },
  { name: "Mercadinho Bom Preço", regime: "Simples Nacional", fee: 900 },
  { name: "Studio Bela Forma", regime: "MEI", fee: 180 },
  { name: "Construtora Alicerce", regime: "Lucro Real", fee: 4200 },
  { name: "Escola Aprender Mais", regime: "Lucro Presumido", fee: 1800 },
  { name: "Restaurante Sabor da Casa", regime: "Simples Nacional", fee: 1100 },
  { name: "Loja Moda Viva", regime: "Simples Nacional", fee: 850, status: "INADIMPLENTE" },
  { name: "Consultoria Norte Digital", regime: "Lucro Presumido", fee: 1500 },
  { name: "Transportadora Estrada Certa", regime: "Lucro Real", fee: 3100 },
  { name: "Pet Shop Amigo Fiel", regime: "MEI", fee: 150, status: "SUSPENSO" },
];

const EXPENSES = [
  { title: "Aluguel do escritório", amount: 3500, category: "Despesas fixas", day: 5 },
  { title: "Folha de pagamento da equipe", amount: 9800, category: "Pessoal", day: 5 },
  { title: "Sistemas e licenças", amount: 520, category: "Tecnologia", day: 15 },
  { title: "Energia e internet", amount: 410, category: "Despesas fixas", day: 20 },
];

const pad = (n) => String(n).padStart(2, "0");
const noon = (year, month, day) => new Date(Date.UTC(year, month - 1, day, 12));

// Um PDF mínimo (uma página com um texto), só para o Cofre ter arquivos que abrem de verdade.
function samplePdf(text) {
  const content = `BT /F1 20 Tf 60 740 Td (${text.replace(/[()\\]/g, "")}) Tj 0 -32 Td (Documento de demonstracao. Dados ficticios.) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

// Apaga só o que é da demonstração (para poder carregar de novo com datas atuais).
export async function removeDemo() {
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}`, mode: "insensitive" } },
    select: { id: true },
  });
  const ids = demoUsers.map((u) => u.id);
  if (ids.length === 0) return 0;

  await prisma.company.deleteMany({ where: { userId: { in: ids } } }); // leva clientes, lançamentos etc. junto
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

export async function seedDemo(now = new Date()) {
  await removeDemo();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const randomPassword = () => bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

  // ----- pessoas -----
  const owner = await prisma.user.create({
    data: { name: "Ana Souza (demo)", email: DEMO_PROFILES.gestor, password: await randomPassword(), role: "ADMIN", agencyName: COMPANY_NAME },
  });
  const analyst = await prisma.user.create({
    data: { name: "Bruno Lima (demo)", email: DEMO_PROFILES.analista, password: await randomPassword(), role: "ADMIN" },
  });
  const company = await prisma.company.create({ data: { name: COMPANY_NAME, document: "00.000.000/0001-00", userId: owner.id } });
  await prisma.companyMember.create({ data: { userId: analyst.id, companyId: company.id, role: "ANALISTA" } });

  // ----- clientes -----
  const clients = [];
  for (const [i, c] of CLIENTS.entries()) {
    clients.push(
      await prisma.client.create({
        data: {
          fullName: c.name,
          document: `00.000.0${pad(i + 1)}/0001-00`,
          taxRegime: c.regime,
          monthlyFee: c.fee,
          status: c.status || "ATIVO",
          email: i === 0 ? DEMO_PROFILES.cliente : `contato${i + 1}@cliente.${DEMO_DOMAIN}`,
          phone: `(11) 90000-00${pad(i + 1)}`,
          certificateExpiry: i === 5 ? noon(year, month, 28) : null,
          companyId: company.id,
        },
      }),
    );
  }
  // O acesso do portal: o cliente 1, com o mesmo e-mail do cadastro.
  await prisma.user.create({
    data: {
      name: "Carlos Mendes (demo)",
      email: DEMO_PROFILES.cliente,
      password: await randomPassword(),
      role: "CLIENT",
      companyAccessId: company.id,
      clientId: clients[0].id,
    },
  });

  // ----- financeiro: 6 meses de honorários e despesas -----
  const transactions = [];
  for (let back = 5; back >= 0; back--) {
    const ref = new Date(Date.UTC(year, month - 1 - back, 1));
    const y = ref.getUTCFullYear();
    const m = ref.getUTCMonth() + 1;
    const isCurrent = back === 0;

    for (const [i, c] of CLIENTS.entries()) {
      if (c.status === "SUSPENSO") continue;
      const lateClient = c.status === "INADIMPLENTE" && back <= 2;
      transactions.push({
        title: `Honorários ${pad(m)}/${y} - ${c.name}`,
        amount: c.fee,
        type: "entrada",
        category: "Honorários",
        date: noon(y, m, 10),
        status: isCurrent || lateClient ? "PENDENTE" : "PAGO",
        paymentMethod: isCurrent || lateClient ? null : i % 3 === 0 ? "Boleto" : "PIX",
        feeReference: `${y}-${pad(m)}`,
        clientId: clients[i].id,
        companyId: company.id,
      });
    }

    for (const e of EXPENSES) {
      transactions.push({
        title: e.title,
        amount: e.amount + (e.category === "Despesas fixas" && e.title.startsWith("Energia") ? m * 7 : 0),
        type: "saida",
        category: e.category,
        date: noon(y, m, e.day),
        status: isCurrent && e.day > now.getUTCDate() ? "PENDENTE" : "PAGO",
        paymentMethod: "PIX",
        companyId: company.id,
      });
    }

    if (back % 2 === 1) {
      transactions.push({
        title: "Abertura de empresa - Consultoria Norte Digital",
        amount: 1200,
        type: "entrada",
        category: "Serviços avulsos",
        date: noon(y, m, 18),
        status: "PAGO",
        paymentMethod: "PIX",
        clientId: clients[9].id,
        companyId: company.id,
      });
    }
  }
  await prisma.transaction.createMany({ data: transactions });

  // ----- cofre digital -----
  const docs = [
    { client: 0, name: "Contrato de prestação de serviços", file: "contrato-prestacao-servicos.pdf", category: "Societário (Contrato Social)", signed: true, read: true },
    { client: 1, name: "Alvará de funcionamento", file: "alvara-funcionamento.pdf", category: "Alvarás e Licenças", read: true },
    { client: 2, name: "Guia DAS do mês anterior", file: "guia-das.pdf", category: "Fiscal e Tributário" },
    { client: 5, name: "Balanço patrimonial do ano anterior", file: "balanco-patrimonial.pdf", category: "Fiscal e Tributário" },
    { client: 0, name: "Informe de rendimentos", file: "informe-rendimentos.pdf", category: "Enviado pelo cliente", read: true },
  ];
  for (const d of docs) {
    const buffer = samplePdf(d.name);
    const stored = await prisma.storedFile.create({ data: { filename: d.file, size: buffer.length, data: buffer, companyId: company.id } });
    await prisma.document.create({
      data: {
        name: d.name,
        category: d.category,
        fileUrl: `db:${stored.id}/${d.file}`,
        clientId: clients[d.client].id,
        companyId: company.id,
        readAt: d.read ? noon(year, month, 2) : null,
        isSigned: Boolean(d.signed),
        signedAt: d.signed ? noon(year, month, 3) : null,
        signedByIp: d.signed ? "203.0.113.10" : null, // faixa de endereços reservada para exemplos
        signatureHash: d.signed ? crypto.createHash("sha256").update(`demo-${d.file}`).digest("hex") : null,
      },
    });
  }

  // ----- chamados -----
  const tickets = [
    {
      client: 0, subject: "Dúvida sobre emissão de nota fiscal", department: "Fiscal", status: "ABERTO", unreadClient: true,
      messages: [
        ["CLIENT", "Carlos Mendes (demo)", "Preciso emitir uma nota para um cliente novo. Qual o procedimento?"],
        ["ADMIN", "Ana Souza (demo)", "Olá, Carlos! Me envie o CNPJ do tomador e eu preparo a nota ainda hoje."],
      ],
    },
    {
      client: 1, subject: "Segunda via do contrato social", department: "Societário", status: "RESOLVIDO", unreadClient: false,
      messages: [
        ["CLIENT", "Clínica Vida Plena", "Podem reenviar a cópia do contrato social atualizado?"],
        ["ADMIN", "Bruno Lima (demo)", "Enviado no Cofre Digital. Qualquer dúvida, é só chamar."],
      ],
    },
    {
      client: 5, subject: "Prazo para entrega do balanço", department: "Contábil", status: "EM_ANDAMENTO", unreadClient: false,
      messages: [["CLIENT", "Construtora Alicerce", "Qual a data limite para enviarmos os documentos do balanço?"]],
    },
  ];
  for (const t of tickets) {
    const ticket = await prisma.ticket.create({
      data: {
        subject: t.subject,
        department: t.department,
        description: t.messages[0][2],
        status: t.status,
        hasUnreadClient: t.unreadClient,
        hasUnreadAdmin: t.status === "EM_ANDAMENTO",
        clientId: clients[t.client].id,
        companyId: company.id,
      },
    });
    await prisma.ticketMessage.createMany({
      data: t.messages.map(([senderRole, senderName, message]) => ({ ticketId: ticket.id, senderRole, senderName, message })),
    });
  }

  // ----- tarefas: obrigações do mês (calendário) + algumas manuais -----
  const obligations = await generateObligations(company.id, month, year);
  await prisma.task.createMany({
    data: [
      { title: "Conferir extrato bancário - Mercadinho Bom Preço", status: "A_FAZER", priority: "NORMAL", dueDate: noon(year, month, Math.min(now.getUTCDate() + 3, 28)), clientId: clients[3].id },
      { title: "Renovar e-CNPJ - Construtora Alicerce", description: "Certificado vence neste mês.", status: "EM_ANDAMENTO", priority: "URGENTE", dueDate: noon(year, month, 28), clientId: clients[5].id },
      { title: "Fechamento da folha - Escola Aprender Mais", status: "CONCLUIDO", priority: "NORMAL", dueDate: noon(year, month, 1), clientId: clients[6].id },
      { title: "Cobrar honorários em atraso - Loja Moda Viva", status: "A_FAZER", priority: "ALTA", dueDate: noon(year, month, Math.max(now.getUTCDate() - 2, 1)), clientId: clients[8].id },
    ].map((t) => ({ ...t, companyId: company.id })),
  });

  // ----- auditoria -----
  const actions = [
    ["Ana Souza (demo)", "ADMIN", "CREATE", "CLIENTES", "Cadastrou o novo cliente: Consultoria Norte Digital"],
    ["Bruno Lima (demo)", "ADMIN", "CREATE", "FINANCEIRO", "Registou o lançamento: Abertura de empresa no valor de R$ 1200"],
    ["Ana Souza (demo)", "ADMIN", "UPDATE", "FINANCEIRO", "Alterou os dados ou status da fatura: Honorários - Padaria Pão Quente Ltda"],
    ["Carlos Mendes (demo)", "CLIENT", "UPDATE", "COFRE DIGITAL", "Assinou eletronicamente o documento: Contrato de prestação de serviços"],
    ["Bruno Lima (demo)", "ADMIN", "CREATE", "DOCUMENTOS", "Fez o upload de um novo documento: Guia DAS do mês anterior"],
    ["Ana Souza (demo)", "ADMIN", "CREATE", "HONORÁRIOS", `Gerou os honorários de ${year}-${pad(month)}`],
  ];
  await prisma.auditLog.createMany({
    data: actions.map(([userName, userRole, action, moduleName, details], i) => ({
      userName, userRole, action, module: moduleName, details, companyId: company.id,
      createdAt: new Date(now.getTime() - i * 3 * 3600 * 1000),
    })),
  });

  return {
    company: COMPANY_NAME,
    clients: clients.length,
    transactions: transactions.length,
    documents: docs.length,
    tickets: tickets.length,
    obligationTasks: obligations.created,
    logins: Object.values(DEMO_PROFILES),
  };
}
