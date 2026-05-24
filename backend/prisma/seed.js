import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const nomes = [
  "Ana",
  "Bruno",
  "Carlos",
  "Daniela",
  "Eduardo",
  "Fernanda",
  "Gabriel",
  "Helena",
  "Igor",
  "Juliana",
  "Lucas",
  "Mariana",
  "Nicolas",
  "Olivia",
  "Pedro",
  "Rafael",
  "Sofia",
  "Tiago",
  "Vitória",
  "Wesley",
];
const sobrenomes = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Rodrigues",
  "Ferreira",
  "Alves",
  "Pereira",
  "Lima",
  "Gomes",
  "Costa",
  "Ribeiro",
  "Martins",
  "Carvalho",
];
const tags = ["NOVO", "RECORRENTE", "VIP", "INADIMPLENTE"];
const ruas = [
  "Av. Paulista",
  "Rua das Flores",
  "Av. Brigadeiro Faria Lima",
  "Rua Augusta",
  "Av. Rio Branco",
  "Rua do Ouvidor",
  "Av. Afonso Pena",
  "Rua da Consolação",
];
const cidades = [
  "São Paulo",
  "Guarujá",
  "Piracicaba",
  "Limeira",
  "Campinas",
  "Rio de Janeiro",
];

const servicosIniciais = [
  {
    name: "Consultoria em Gestão de TI",
    category: "Consultoria",
    price: 2500,
    description: "Análise e planeamento de infraestrutura",
    stock: 999,
  },
  {
    name: "Desenvolvimento de Landing Page",
    category: "Desenvolvimento",
    price: 1200,
    description: "Página de alta conversão",
    stock: 999,
  },
  {
    name: "Suporte Técnico Mensal",
    category: "Suporte",
    price: 500,
    description: "Manutenção e suporte 24/7",
    stock: 999,
  },
  {
    name: "Migração para Cloud",
    category: "Infraestrutura",
    price: 3500,
    description: "Migração de dados para AWS/Azure",
    stock: 999,
  },
  {
    name: "Auditoria de Segurança",
    category: "Consultoria",
    price: 4000,
    description: "Teste de invasão e relatórios",
    stock: 999,
  },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gera uma data baseada em dias para trás (negativo) ou para a frente (positivo)
function getShiftedDate(daysShift) {
  const date = new Date();
  date.setDate(date.getDate() + daysShift);
  date.setHours(getRandomInt(8, 18), 0, 0, 0); // Horário comercial
  return date;
}

async function main() {
  console.log("🌱 A iniciar a Mega Semente Enterprise...");

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ Crie um usuário no sistema primeiro!");
    return;
  }

  // 1. LIMPAR DADOS ANTIGOS (Para evitar duplicações de seed)
  console.log("🧹 Limpando dados antigos...");
  await prisma.appointment.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.product.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  // 2. INJETAR CLIENTES COM ENDEREÇO
  console.log("👥 A semear 30 clientes premium...");
  const clients = [];
  for (let i = 0; i < 30; i++) {
    const client = await prisma.client.create({
      data: {
        fullName: `${getRandom(nomes)} ${getRandom(sobrenomes)} ${getRandom(sobrenomes)}`,
        cpf: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
        email: `contato${i}@exemplo.com`,
        phone: `119${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`,
        cep: `0${getRandomInt(1000, 9999)}${getRandomInt(100, 999)}`,
        address: `${getRandom(ruas)}, ${getRandomInt(10, 2000)} - ${getRandom(cidades)}`,
        tag: getRandom(tags),
        notes: "Cliente importado via base de dados legada.",
        userId: user.id,
      },
    });
    clients.push(client);
  }

  // 3. INJETAR SERVIÇOS
  console.log("💼 A configurar o catálogo...");
  const products = [];
  for (const servico of servicosIniciais) {
    products.push(
      await prisma.product.create({ data: { ...servico, userId: user.id } }),
    );
  }

  // 4. INJETAR TRANSAÇÕES (Com Descrição/Título)
  console.log("💸 A gerar histórico financeiro com títulos...");
  const transactionsData = [];
  for (let i = 0; i < 150; i++) {
    const isIncome = Math.random() > 0.4;
    const prod = getRandom(products);
    const cli = getRandom(clients);

    transactionsData.push({
      type: isIncome ? "entrada" : "saida",
      amount: isIncome ? prod.price : getRandomInt(100, 1500),
      description: isIncome
        ? `Venda: ${prod.name}`
        : getRandom([
            "Assinatura AWS",
            "Conta de Internet",
            "Licença Vercel Pro",
            "Material de Escritório",
            "Anúncios Google",
          ]),
      category: isIncome
        ? prod.category
        : getRandom(["Impostos", "Fixo", "Variavel", "Infraestrutura"]),
      date: getShiftedDate(-getRandomInt(0, 180)), // Últimos 6 meses
      clientId: isIncome ? cli.id : null,
      userId: user.id,
    });
  }
  await prisma.transaction.createMany({ data: transactionsData });

  // 5. INJETAR AGENDAMENTOS (Passados e Futuros)
  console.log("📅 A popular a Agenda...");
  const appointmentsData = [];

  // Agendamentos passados (Concluídos/Cancelados)
  for (let i = 0; i < 20; i++) {
    appointmentsData.push({
      clientId: getRandom(clients).id,
      date: getShiftedDate(-getRandomInt(1, 30)),
      status: Math.random() > 0.2 ? "concluido" : "cancelado",
      notes: "Reunião de alinhamento.",
      userId: user.id,
    });
  }

  // Agendamentos HOJE (Pendentes)
  for (let i = 0; i < getRandomInt(2, 5); i++) {
    appointmentsData.push({
      clientId: getRandom(clients).id,
      date: getShiftedDate(0), // Hoje
      status: "pendente",
      notes: "Apresentação de resultados.",
      userId: user.id,
    });
  }

  // Agendamentos Futuros (Pendentes)
  for (let i = 0; i < 15; i++) {
    appointmentsData.push({
      clientId: getRandom(clients).id,
      date: getShiftedDate(getRandomInt(1, 20)),
      status: "pendente",
      notes: "Discussão de novo contrato.",
      userId: user.id,
    });
  }
  await prisma.appointment.createMany({ data: appointmentsData });

  console.log(
    "✅ MEGA SEED CONCLUÍDA! O seu sistema agora é uma máquina viva.",
  );
}

main()
  .catch((e) => {
    console.error("Erro na seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
