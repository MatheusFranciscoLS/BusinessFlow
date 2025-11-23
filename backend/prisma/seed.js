import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed "Modo Demonstração Real"...');

  // 1. Limpar o banco
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 2. Criar Admin
  const passwordHash = await bcrypt.hash("123456", 10);
  await prisma.user.create({
    data: {
      name: "Matheus Desenvolvedor",
      email: "admin@admin.com", // <--- Alterado para seu email preferido
      password: passwordHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin criado: admin@admin.com / 123456");

  // 3. Criar Clientes
  const client1 = await prisma.client.create({
    data: {
      fullName: "Padaria do Seu João Ltda",
      cpf: "12.345.678/0001-90",
      email: "contato@padariajoao.com.br",
      phone: "(11) 98765-4321",
      cep: "01001-000",
      address: "Praça da Sé, 100, Centro - São Paulo/SP",
      tag: "RECORRENTE",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      fullName: "Ana Beatriz Silva",
      cpf: "123.456.789-00",
      email: "ana.bea@gmail.com",
      phone: "(21) 99999-8888",
      cep: "22041-001",
      address: "Av. Atlântica, 1500, Copacabana - Rio de Janeiro/RJ",
      tag: "NOVO",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      fullName: "Tech Startups S.A.",
      cpf: "98.765.432/0001-10",
      email: "financeiro@techstart.com.br",
      phone: "(31) 3333-4444",
      cep: "30140-071",
      address: "Rua dos Tupis, 300, Centro - Belo Horizonte/MG",
      tag: "VIP",
    },
  });

  // 4. Criar Serviços
  await prisma.product.createMany({
    data: [
      { name: "Desenvolvimento de Site Institucional", description: "Site One Page", price: 2500.00, category: "Desenvolvimento", stock: 0 },
      { name: "Manutenção de Computadores", description: "Limpeza e formatação", price: 150.00, category: "Suporte", stock: 0 },
      { name: "Consultoria de Redes", description: "Configuração Wi-Fi", price: 450.00, category: "Infraestrutura", stock: 0 },
      { name: "Sistema de Gestão (SaaS)", description: "Mensalidade", price: 199.90, category: "Assinatura", stock: 0 },
    ]
  });

  // 5. Funções de Data e Hora
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Gera data sem hora (para transações)
  const getDate = (monthOffset, day) => {
    return new Date(currentYear, currentMonth + monthOffset, day);
  };

  // Gera data COM HORA (para agendamentos)
  const getDateTime = (monthOffset, day, hour, minute) => {
    return new Date(currentYear, currentMonth + monthOffset, day, hour, minute);
  };

  // 6. Criar Transações
  await prisma.transaction.createMany({
    data: [
      { description: "Criação de Site - Padaria", amount: 2500.00, type: "entrada", category: "Venda", date: getDate(-1, 10), clientId: client1.id },
      { description: "Hospedagem AWS", amount: 150.00, type: "saida", category: "Infraestrutura", date: getDate(-1, 15) },
      { description: "Consultoria Tech Startups", amount: 4500.00, type: "entrada", category: "Serviço", date: getDate(0, 5), clientId: client3.id },
      { description: "Formatação Ana Beatriz", amount: 150.00, type: "entrada", category: "Serviço", date: getDate(0, 12), clientId: client2.id },
      { description: "Aluguel do Escritório", amount: 1200.00, type: "saida", category: "Despesas Fixas", date: getDate(0, 10) },
      { description: "Conta de Internet", amount: 250.00, type: "saida", category: "Despesas Fixas", date: getDate(0, 20) },
      { description: "Venda de Licença SaaS", amount: 199.90, type: "entrada", category: "Venda", date: getDate(0, today.getDate()) },
      { description: "Pagamento Freelancer Design", amount: 800.00, type: "saida", category: "Pessoal", date: getDate(0, 18) },
    ]
  });

  // 7. Criar Agendamentos (COM HORÁRIOS CORRETOS)
  await prisma.appointment.createMany({
    data: [
      // Amanhã às 14:30
      { 
        date: getDateTime(0, today.getDate() + 1, 14, 30), 
        status: "pendente", 
        notes: "Reunião de alinhamento", 
        clientId: client3.id 
      },
      // Daqui a 3 dias às 09:00
      { 
        date: getDateTime(0, today.getDate() + 3, 9, 0), 
        status: "pendente", 
        notes: "Entregar computador formatado", 
        clientId: client2.id 
      },
      // Mês passado às 16:00 (Concluído)
      { 
        date: getDateTime(-1, 15, 16, 0), 
        status: "concluido", 
        notes: "Instalação finalizada", 
        clientId: client1.id 
      },
    ]
  });

  console.log('🚀 Seed Finalizado! Horários ajustados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });