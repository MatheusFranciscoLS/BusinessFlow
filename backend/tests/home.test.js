import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders, uniqueEmail } from "./helpers.js";
import { overview, competence } from "../src/services/home.service.js";

// "Hoje" fixo para o teste não depender da data em que roda: 30/10/2026.
const NOW = new Date(Date.UTC(2026, 9, 30, 15));
const day = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12));

let office, other, simples, presumido, mei;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("HOME");
  other = await createOffice("HOME2");
  const newClient = (fullName, taxRegime, monthlyFee) =>
    prisma.client.create({ data: { fullName, taxRegime, monthlyFee, email: uniqueEmail("home"), companyId: office.company.id } });
  simples = await newClient("Padaria Simples", "Simples Nacional", 650);
  presumido = await newClient("Clínica Presumido", "Lucro Presumido", 2200);
  mei = await newClient("Studio MEI", "MEI", 0);

  const tx = (data) => createTransaction(office.company.id, data);
  // outubro: recebido 650 + 2200; despesa paga 500; setembro: recebido 2000
  await tx({ type: "entrada", status: "PAGO", amount: 650, date: day(2026, 10, 10), clientId: simples.id, feeReference: "2026-10" });
  await tx({ type: "entrada", status: "PAGO", amount: 2200, date: day(2026, 10, 10), clientId: presumido.id, feeReference: "2026-10" });
  await tx({ type: "saida", status: "PAGO", amount: 500, date: day(2026, 10, 5) });
  await tx({ type: "entrada", status: "PAGO", amount: 2000, date: day(2026, 9, 10) });
  // em aberto: um vencido (setembro do presumido) e um a vencer
  await tx({ type: "entrada", status: "PENDENTE", amount: 2200, date: day(2026, 9, 10), clientId: presumido.id, feeReference: "2026-09" });
  await tx({ type: "entrada", status: "PENDENTE", amount: 300, date: day(2026, 11, 5), clientId: simples.id });
  // de outra empresa: não pode aparecer
  await createTransaction(other.company.id, { type: "entrada", status: "PAGO", amount: 99999, date: day(2026, 10, 10) });

  // obrigações que vencem em novembro (competência outubro)
  await prisma.task.create({ data: { title: "DAS", dueDate: day(2026, 11, 20), obligationKey: "das:2026-11", status: "CONCLUIDO", clientId: simples.id, companyId: office.company.id } });
  await prisma.task.create({ data: { title: "DCTFWeb", dueDate: day(2026, 11, 30), obligationKey: "dctfweb:2026-11", status: "A_FAZER", clientId: presumido.id, companyId: office.company.id } });
  // tarefas: uma vence hoje, uma atrasada
  await prisma.task.create({ data: { title: "Vence hoje", dueDate: day(2026, 10, 30), companyId: office.company.id } });
  await prisma.task.create({ data: { title: "Atrasada", dueDate: day(2026, 10, 20), companyId: office.company.id } });
  // chamado sem resposta e documento enviado pelo cliente
  await prisma.ticket.create({ data: { subject: "Dúvida", department: "Fiscal", description: "d", hasUnreadAdmin: true, clientId: simples.id, companyId: office.company.id } });
  await prisma.document.create({ data: { name: "extrato.pdf", category: "Enviado pelo cliente", fileUrl: "db:x/extrato.pdf", clientId: simples.id, companyId: office.company.id, createdAt: day(2026, 10, 28) } });
});

describe("início do gestor", () => {
  it("números do mês só da empresa, com variação real", async () => {
    const o = await overview(office.company.id, NOW);

    expect(o.received).toBe(2850);
    expect(o.receivedGrowth).toBe(42.5); // de 2000 para 2850
    expect(o.closing).toEqual({ received: 2850, expensesPaid: 500, result: 2350 });
    expect(o.receivable).toEqual({ amount: 300, count: 1 });
    expect(o.overdue).toMatchObject({ amount: 2200, count: 1, clients: ["Clínica Presumido"] });
  });

  it("'Para fazer hoje' traz cada tipo de pendência, do mais urgente para o menos", async () => {
    const o = await overview(office.company.id, NOW);
    expect(o.todo.map((t) => t.kind)).toEqual(["vence_hoje", "atrasado", "chamado", "documento", "cobranca"]);
    expect(o.todo[0].text).toBe("Vence hoje");
    expect(o.todo[3].text).toContain("extrato.pdf");
  });

  it("sem mês anterior para comparar, a variação é nula (não inventa número)", async () => {
    const o = await overview(other.company.id, NOW);
    expect(o.receivedGrowth).toBeNull();
  });
});

describe("mapa da competência", () => {
  it("cada cliente com o status das entregas do mês, conforme o regime", async () => {
    const c = await competence(office.company.id, 10, 2026, NOW);
    const row = (client) => c.rows.find((r) => r.client.id === client.id).cells;

    expect(c.competence).toBe("2026-10");
    expect(c.dueMonth).toBe("2026-11");
    expect(row(simples)).toMatchObject({ das: { status: "ok" }, dctfweb: { status: "na" }, honorario: { status: "ok" }, documentos: { count: 1 } });
    expect(row(presumido)).toMatchObject({ das: { status: "na" }, dctfweb: { status: "pendente" }, honorario: { status: "ok" } });
    expect(row(mei)).toMatchObject({ das: { status: "na" }, dctfweb: { status: "na" }, honorario: { status: "na" } });
  });

  it("competência anterior: honorário vencido aparece como atrasado e falta de tarefa aparece", async () => {
    const c = await competence(office.company.id, 9, 2026, NOW);
    const row = (client) => c.rows.find((r) => r.client.id === client.id).cells;

    expect(row(presumido).honorario.status).toBe("atrasado");
    expect(row(presumido).dctfweb.status).toBe("sem_tarefa");
    expect(row(simples).honorario.status).toBe("sem_cobranca");
    expect(c.summary.atrasado).toBeGreaterThanOrEqual(1);
  });

  it("mês inválido é recusado", async () => {
    await expect(competence(office.company.id, 13, 2026, NOW)).rejects.toThrow(/mês/);
  });
});

describe("rotas do início", () => {
  it("o gestor acessa; o cliente do portal e quem não tem login, não", async () => {
    const portal = await createPortalUser(office.company, office.client);
    const ok = await api().get("/api/home/overview").set(authHeaders(office.admin, office.company.id));
    const map = await api().get("/api/home/competence?month=10&year=2026").set(authHeaders(office.admin, office.company.id));
    const asPortal = await api().get("/api/home/overview").set(authHeaders(portal));
    const anonymous = await api().get("/api/home/competence");

    expect([ok.status, map.status, asPortal.status, anonymous.status]).toEqual([200, 200, 403, 401]);
    expect(map.body.rows.length).toBeGreaterThanOrEqual(3);
  });

  it("outro escritório não vê o mapa desta empresa", async () => {
    const res = await api().get("/api/home/competence").set(authHeaders(other.admin, office.company.id));
    expect(res.status).toBe(403);
  });
});
