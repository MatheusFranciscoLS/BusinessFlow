import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 A limpar a base de dados antiga para um recomeço perfeito...");
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 A iniciar a Super Sementeira (BPO Financeiro)...");

  // 1. CRIAR O SEU ACESSO DE ADMIN
  const hashedPassword = await bcrypt.hash("123456", 8);
  const admin = await prisma.user.create({
    data: {
      name: "Matheus Francisco",
      email: "admin@admin.com",
      password: hashedPassword,
      role: "ADMIN",
      agencyName: "BusinessFlow Contabilidade",
    },
  });
  console.log(`✅ Admin criado: ${admin.name}`);

  // 2. CRIAR A SUA EMPRESA (O ESCRITÓRIO)
  const company = await prisma.company.create({
    data: {
      name: "BusinessFlow Sede",
      document: "12.345.678/0001-99",
      userId: admin.id,
    },
  });
  console.log(`✅ Empresa (Sede) criada!`);

  // 3. CRIAR O CRM DE CLIENTES (Empresas que você atende)
  const client1 = await prisma.client.create({
    data: {
      fullName: "TechX Inovações Ltda",
      document: "00.111.222/0001-33",
      taxRegime: "Lucro Presumido",
      monthlyFee: 3500.00,
      status: "ATIVO",
      companyId: company.id,
    }
  });

  const client2 = await prisma.client.create({
    data: {
      fullName: "Padaria do João",
      document: "44.555.666/0001-77",
      taxRegime: "Simples Nacional",
      monthlyFee: 850.00,
      status: "INADIMPLENTE", // Vai disparar alertas no Dashboard!
      companyId: company.id,
    }
  });

  const client3 = await prisma.client.create({
    data: {
      fullName: "Clínica Sorriso",
      document: "99.888.777/0001-55",
      taxRegime: "Simples Nacional",
      monthlyFee: 1200.00,
      status: "ATIVO",
      companyId: company.id,
    }
  });
  console.log(`✅ CRM Populado: 3 Clientes adicionados (MRR: R$ 5.550,00)`);

  // 4. CRIAR UM ACESSO PARA O PORTAL DO CLIENTE (O João da Padaria)
  await prisma.user.create({
    data: {
      name: "João (Dono da Padaria)",
      email: "joao@padaria.com",
      password: hashedPassword,
      role: "CLIENT",
      companyAccessId: company.id,
    }
  });
  console.log(`✅ Acesso do Portal do Cliente criado: joao@padaria.com`);

  // 5. POPULAR O FINANCEIRO (Gráficos e DRE)
  const today = new Date();
  const lastWeek = new Date(); lastWeek.setDate(today.getDate() - 7);
  const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);

  await prisma.transaction.createMany({
    data: [
      // Entradas Pagas (Honorários)
      { title: "Honorários TechX", amount: 3500, type: "entrada", category: "Honorários Contábeis", status: "PAGO", date: lastWeek, companyId: company.id, clientId: client1.id },
      { title: "Honorários Clínica", amount: 1200, type: "entrada", category: "Honorários Contábeis", status: "PAGO", date: today, companyId: company.id, clientId: client3.id },
      // Entrada Atrasada (O Inadimplente)
      { title: "Honorários Padaria", amount: 850, type: "entrada", category: "Honorários Contábeis", status: "ATRASADO", date: lastWeek, companyId: company.id, clientId: client2.id },
      
      // Saídas (Despesas Operacionais do seu Escritório)
      { title: "Aluguel da Sede", amount: 1500, type: "saida", category: "Despesas Fixas", status: "PAGO", date: lastWeek, companyId: company.id },
      { title: "Licença Software Fiscal", amount: 450, type: "saida", category: "Despesas Fixas", status: "PAGO", date: today, companyId: company.id },
      { title: "Folha de Pagamento", amount: 2000, type: "saida", category: "Folha de Pagamento", status: "AGENDADO", date: nextWeek, companyId: company.id },
      
      // Enviado pelo Portal do Cliente (Pendente)
      { title: "Nota Fiscal de Fornecedor", description: "Enviado pelo Portal do Cliente", amount: 300, type: "saida", category: "A Classificar", status: "PENDENTE", date: nextWeek, companyId: company.id },
    ]
  });
  console.log(`✅ Financeiro Populado: Entradas, Saídas, Pendências e Atrasos!`);

  // 6. POPULAR A AGENDA E PRAZOS
  await prisma.appointment.createMany({
    data: [
      { title: "Enviar DAS Simples Nacional", type: "OBRIGACAO", status: "pendente", date: nextWeek, companyId: company.id, clientId: client2.id },
      { title: "Fechar Folha de Pagamento", type: "TAREFA", status: "pendente", date: today, companyId: company.id, clientId: client1.id },
      { title: "Reunião de Alinhamento", type: "REUNIAO", status: "concluido", date: lastWeek, companyId: company.id, clientId: client3.id },
    ]
  });
  console.log(`✅ Agenda Populada: Prazos Fiscais e Tarefas criadas!`);

  console.log("🎉 SUPER SEED CONCLUÍDO COM SUCESSO! O SISTEMA ESTÁ PRONTO PARA A DEMONSTRAÇÃO.");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao semear:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });