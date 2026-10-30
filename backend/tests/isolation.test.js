// Cada escritório só pode ver e mexer nos próprios dados.
// Aqui o escritório A tenta ler, alterar e apagar o que é do escritório B.
import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders } from "./helpers.js";

let a, b, asA, asB;

beforeAll(async () => {
  await resetDatabase();
  a = await createOffice("A");
  b = await createOffice("B");
  asA = authHeaders(a.admin, a.company.id);
  asB = authHeaders(b.admin, b.company.id);
});

describe("clientes (CRM)", () => {
  it("a listagem traz só os clientes da própria empresa", async () => {
    const res = await api().get("/api/clients").set(asA);
    const names = res.body.map((c) => c.fullName);

    expect(res.status).toBe(200);
    expect(names).toContain("Cliente A");
    expect(names).not.toContain("Cliente B");
  });

  it("não consegue abrir o cliente de outra empresa pelo id", async () => {
    const res = await api().get(`/api/clients/${b.client.id}`).set(asA);
    expect(res.status).toBe(400);
    expect(res.body.fullName).toBeUndefined();
  });

  it("não consegue alterar o cliente de outra empresa", async () => {
    const res = await api().put(`/api/clients/${b.client.id}`).set(asA).send({ fullName: "Invadido" });

    expect(res.status).toBe(400);
    const unchanged = await prisma.client.findUnique({ where: { id: b.client.id } });
    expect(unchanged.fullName).toBe("Cliente B");
  });

  it("não consegue apagar o cliente de outra empresa", async () => {
    const res = await api().delete(`/api/clients/${b.client.id}`).set(asA);

    expect(res.status).toBe(404);
    expect(await prisma.client.count({ where: { id: b.client.id } })).toBe(1);
  });
});

describe("financeiro", () => {
  let txB;
  beforeAll(async () => {
    await createTransaction(a.company.id, { title: "Lançamento A" });
    txB = await createTransaction(b.company.id, { title: "Lançamento B" });
  });

  it("a listagem traz só os lançamentos da própria empresa", async () => {
    const res = await api().get("/api/transactions").set(asA);
    const titles = res.body.map((t) => t.title);

    expect(res.status).toBe(200);
    expect(titles).toContain("Lançamento A");
    expect(titles).not.toContain("Lançamento B");
  });

  it("não consegue abrir, alterar ou apagar o lançamento de outra empresa", async () => {
    const read = await api().get(`/api/transactions/${txB.id}`).set(asA);
    const update = await api().put(`/api/transactions/${txB.id}`).set(asA).send({ title: "Invadido" });
    const remove = await api().delete(`/api/transactions/${txB.id}`).set(asA);

    expect(read.status).toBe(400);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(403);

    const unchanged = await prisma.transaction.findUnique({ where: { id: txB.id } });
    expect(unchanged.title).toBe("Lançamento B");
  });

  it("o resumo do painel soma só a empresa logada", async () => {
    const hoje = new Date();
    await createTransaction(a.company.id, { type: "entrada", status: "PAGO", amount: 1000, date: hoje });
    await createTransaction(b.company.id, { type: "entrada", status: "PAGO", amount: 999999, date: hoje });

    const res = await api().get("/api/dashboard/summary").set(asA);

    expect(res.status).toBe(200);
    expect(res.body.entradas).toBe(1000);
  });
});

describe("tarefas", () => {
  it("a listagem traz só as tarefas da própria empresa", async () => {
    const dueDate = new Date();
    await prisma.task.create({ data: { title: "Tarefa A", dueDate, companyId: a.company.id } });
    await prisma.task.create({ data: { title: "Tarefa B", dueDate, companyId: b.company.id } });

    const res = await api().get("/api/tasks").set(asA);
    const titles = res.body.map((t) => t.title);

    expect(res.status).toBe(200);
    expect(titles).toContain("Tarefa A");
    expect(titles).not.toContain("Tarefa B");
  });
});

describe("chaves de API", () => {
  it("a listagem traz só as chaves da própria empresa", async () => {
    await prisma.apiKey.create({ data: { name: "Chave A", key: "bf_live_lista_a", companyId: a.company.id } });
    await prisma.apiKey.create({ data: { name: "Chave B", key: "bf_live_lista_b", companyId: b.company.id } });

    const res = await api().get("/api/apikeys").set(asA);
    const names = res.body.map((k) => k.name);

    expect(res.status).toBe(200);
    expect(names).toContain("Chave A");
    expect(names).not.toContain("Chave B");
  });

  it("não consegue revogar a chave de outra empresa", async () => {
    const keyB = await prisma.apiKey.create({
      data: { name: "Chave B2", key: "bf_live_revogar_b", companyId: b.company.id },
    });

    const res = await api().delete(`/api/apikeys/${keyB.id}`).set(asA);

    expect(res.status).not.toBe(204);
    expect(await prisma.apiKey.count({ where: { id: keyB.id } })).toBe(1);
  });
});

describe("empresas", () => {
  it("cada gestor lista só as próprias empresas", async () => {
    const res = await api().get("/api/companies").set(asA);
    const ids = res.body.map((c) => c.id);

    expect(ids).toContain(a.company.id);
    expect(ids).not.toContain(b.company.id);
  });

  it("não consegue alterar nem apagar a empresa de outro gestor", async () => {
    const update = await api().put(`/api/companies/${b.company.id}`).set(asA).send({ name: "Invadida" });
    const remove = await api().delete(`/api/companies/${b.company.id}`).set(asA);

    expect(update.status).toBe(400);
    expect(remove.status).toBe(400);
    const unchanged = await prisma.company.findUnique({ where: { id: b.company.id } });
    expect(unchanged.name).toBe("Empresa B");
  });
});

describe("portal do cliente (perfil CLIENT)", () => {
  let portal;
  beforeAll(async () => {
    portal = await createPortalUser(a.company, a.client);
  });

  it("o painel do cliente soma só os lançamentos dele, não os de outros clientes da mesma empresa", async () => {
    const outro = await prisma.client.create({
      data: { fullName: "Outro cliente de A", email: "outro-a@teste.local", companyId: a.company.id },
    });
    const hoje = new Date();
    await createTransaction(a.company.id, { clientId: a.client.id, type: "entrada", status: "PAGO", amount: 50, date: hoje });
    await createTransaction(a.company.id, { clientId: outro.id, type: "entrada", status: "PAGO", amount: 7000, date: hoje });

    const res = await api().get("/api/dashboard/summary").set(authHeaders(portal));

    expect(res.status).toBe(200);
    expect(res.body.entradas).toBe(50);
    expect(res.body.inadimplentes).toEqual([]);
  });

  it("os chamados do cliente aparecem só para ele", async () => {
    const outro = await prisma.client.create({
      data: { fullName: "Segundo cliente de A", email: "segundo-a@teste.local", companyId: a.company.id },
    });
    await prisma.ticket.create({
      data: { subject: "Chamado do cliente A", department: "FISCAL", description: "x", clientId: a.client.id, companyId: a.company.id },
    });
    await prisma.ticket.create({
      data: { subject: "Chamado do segundo", department: "FISCAL", description: "x", clientId: outro.id, companyId: a.company.id },
    });

    const res = await api().get("/api/tickets").set(authHeaders(portal));
    const subjects = res.body.map((t) => t.subject);

    expect(res.status).toBe(200);
    expect(subjects).toContain("Chamado do cliente A");
    expect(subjects).not.toContain("Chamado do segundo");
  });
});
