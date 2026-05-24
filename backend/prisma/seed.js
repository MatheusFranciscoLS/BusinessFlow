import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Arrays de dados fictícios para gerar combinações realistas
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
  {
    name: "Desenvolvimento de App Mobile",
    category: "Desenvolvimento",
    price: 8000,
    description: "App iOS e Android nativo",
    stock: 999,
  },
  {
    name: "Gestão de Tráfego Pago",
    category: "Marketing",
    price: 1500,
    description: "Google Ads e Meta Ads",
    stock: 999,
  },
  {
    name: "Otimização de SEO",
    category: "Marketing",
    price: 900,
    description: "SEO On-page e Off-page",
    stock: 999,
  },
  {
    name: "Design de Identidade Visual",
    category: "Design",
    price: 1800,
    description: "Logo e manual da marca",
    stock: 999,
  },
  {
    name: "Instalação de Redes",
    category: "Infraestrutura",
    price: 750,
    description: "Cabeamento estruturado",
    stock: 999,
  },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysBack));
  return date;
}

async function main() {
  console.log("🌱 A preparar o terreno para o Business Intelligence...");

  // Identificar a conta do utilizador principal (para associar os dados corretamente)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error(
      "❌ Erro: Nenhum utilizador encontrado. Crie uma conta no Front-end primeiro!",
    );
    return;
  }
  console.log(`👤 A injetar dados na conta de: ${user.name}`);

  // 1. Injetar Clientes
  console.log("👥 A semear 50 clientes premium...");
  const clients = [];
  for (let i = 0; i < 50; i++) {
    const client = await prisma.client.create({
      data: {
        fullName: `${getRandom(nomes)} ${getRandom(sobrenomes)} ${getRandom(sobrenomes)}`,
        cpf: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
        email: `cliente${i}@exemplo.com`,
        phone: `119${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`,
        tag: getRandom(tags),
        userId: user.id,
      },
    });
    clients.push(client);
  }

  // 2. Injetar Catálogo de Serviços
  console.log("💼 A configurar o catálogo de produtos e serviços...");
  const products = [];
  for (const servico of servicosIniciais) {
    const product = await prisma.product.create({
      data: { ...servico, userId: user.id },
    });
    products.push(product);
  }

  // 3. Injetar Transações Financeiras Históricas
  console.log(
    "💸 A gerar o histórico financeiro dos últimos 365 dias (Isto pode demorar alguns segundos)...",
  );
  const transactionsData = [];
  for (let i = 0; i < 200; i++) {
    const isIncome = Math.random() > 0.35; // 65% de taxa de conversão (entradas), 35% de saídas
    const selectedProduct = getRandom(products);
    const selectedClient = getRandom(clients);

    transactionsData.push({
      type: isIncome ? "entrada" : "saida",
      amount: isIncome ? selectedProduct.price : getRandomInt(100, 2500),
      description: isIncome
        ? `Fatura: ${selectedProduct.name}`
        : getRandom([
            "Pagamento de Impostos",
            "Licenças de Software",
            "Material de Escritório",
            "Anúncios Digitais",
            "Manutenção de Servidores",
          ]),
      category: isIncome
        ? selectedProduct.category
        : getRandom(["Impostos", "Fixo", "Variavel", "Infraestrutura"]),
      date: getRandomDate(365),
      clientId: isIncome ? selectedClient.id : null,
      userId: user.id,
    });
  }

  // Grava todas as 200 transações na base de dados de uma só vez para máxima performance
  await prisma.transaction.createMany({ data: transactionsData });

  console.log(
    "✅ Concluído com sucesso! O seu SaaS agora tem o volume de dados de uma empresa real em pleno funcionamento.",
  );
}

main()
  .catch((e) => {
    console.error("Ocorreu um erro catastrófico durante a semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
