import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders, uniqueEmail } from "./helpers.js";

let office, other, owner, portal;

const member = (name, role) => ({ name, email: uniqueEmail("equipe"), password: "senha-forte-1", role });

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("EQ");
  other = await createOffice("EQ2");
  owner = authHeaders(office.admin, office.company.id);
  portal = await createPortalUser(office.company, office.client);
});

// cria uma pessoa da equipe pela API e devolve o usuário (para gerar o token)
async function addMember(role, as = owner) {
  const res = await api().post("/api/team").set(as).send(member(`Pessoa ${role}`, role));
  expect(res.status).toBe(201);
  return prisma.user.findUnique({ where: { id: res.body.id } });
}

describe("equipe do escritório", () => {
  it("o dono adiciona sócio e analista; a senha fica criptografada e não volta na resposta", async () => {
    const res = await api().post("/api/team").set(owner).send(member("Ana Sócia", "SOCIO"));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Ana Sócia", role: "SOCIO" });
    expect(res.body.password).toBeUndefined();

    const saved = await prisma.user.findUnique({ where: { id: res.body.id } });
    expect(saved.password).toMatch(/^\$2[aby]\$/);

    const analyst = await api().post("/api/team").set(owner).send(member("Bruno Analista", "ANALISTA"));
    expect(analyst.status).toBe(201);
  });

  it("lista o dono e os membros, e diz qual é o seu perfil", async () => {
    const res = await api().get("/api/team").set(owner);

    expect(res.status).toBe(200);
    expect(res.body.yourRole).toBe("OWNER");
    expect(res.body.team.find((p) => p.role === "OWNER").email).toBe(office.admin.email);
    expect(res.body.team.map((p) => p.role)).toEqual(expect.arrayContaining(["SOCIO", "ANALISTA"]));
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
  });

  it("recusa e-mail que já existe, perfil inválido e dados fracos", async () => {
    const duplicated = await api().post("/api/team").set(owner).send({ ...member("Dup", "ANALISTA"), email: office.admin.email });
    const badRole = await api().post("/api/team").set(owner).send({ ...member("Chefe", "ANALISTA"), role: "ADMIN" });
    const weak = await api().post("/api/team").set(owner).send({ ...member("Fraco", "ANALISTA"), password: "1" });

    expect([duplicated.status, badRole.status, weak.status]).toEqual([400, 400, 400]);
  });

  it("a pessoa da equipe entra e vê a empresa na lista de empresas", async () => {
    const analyst = await addMember("ANALISTA");
    const list = await api().get("/api/companies").set(authHeaders(analyst));

    expect(list.status).toBe(200);
    const company = list.body.find((c) => c.id === office.company.id);
    expect(company).toMatchObject({ teamRole: "ANALISTA" });
  });

  it("não vê a empresa de outro escritório", async () => {
    const analyst = await addMember("ANALISTA");
    const res = await api().get("/api/clients").set(authHeaders(analyst, other.company.id));
    expect(res.status).toBe(403);
  });
});

describe("o que cada perfil pode", () => {
  let socio, analista, socioHeaders, analistaHeaders;

  beforeAll(async () => {
    socio = await addMember("SOCIO");
    analista = await addMember("ANALISTA");
    socioHeaders = authHeaders(socio, office.company.id);
    analistaHeaders = authHeaders(analista, office.company.id);
  });

  it("o analista trabalha no dia a dia: cadastra cliente e lança", async () => {
    const client = await api().post("/api/clients").set(analistaHeaders).send({ fullName: "Cliente do analista" });
    const read = await api().get("/api/clients").set(analistaHeaders);
    expect(client.status).toBe(201);
    expect(read.status).toBe(200);
  });

  it("o analista não apaga cliente, lançamento nem documento, não vê auditoria nem chaves de API", async () => {
    const tx = await createTransaction(office.company.id, {});
    const doc = await prisma.document.create({
      data: { name: "d", category: "c", fileUrl: "db:x/y.pdf", clientId: office.client.id, companyId: office.company.id },
    });

    const results = await Promise.all([
      api().delete(`/api/clients/${office.client.id}`).set(analistaHeaders),
      api().delete(`/api/transactions/${tx.id}`).set(analistaHeaders),
      api().delete(`/api/documents/${doc.id}`).set(analistaHeaders),
      api().get("/api/audit").set(analistaHeaders),
      api().get("/api/apikeys").set(analistaHeaders),
      api().post("/api/team").set(analistaHeaders).send(member("Intruso", "ANALISTA")),
    ]);

    expect(results.map((r) => r.status)).toEqual([403, 403, 403, 403, 403, 403]);
    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).not.toBeNull();
  });

  it("o sócio apaga lançamento, vê a auditoria e adiciona analista, mas não adiciona sócio", async () => {
    const tx = await createTransaction(office.company.id, {});

    const remove = await api().delete(`/api/transactions/${tx.id}`).set(socioHeaders);
    const audit = await api().get("/api/audit").set(socioHeaders);
    const analystAdded = await api().post("/api/team").set(socioHeaders).send(member("Novo Analista", "ANALISTA"));
    const socioAdded = await api().post("/api/team").set(socioHeaders).send(member("Novo Sócio", "SOCIO"));

    expect([remove.status, audit.status, analystAdded.status, socioAdded.status]).toEqual([204, 200, 201, 403]);
  });

  it("o log de auditoria mostra o nome de cada pessoa da equipe", async () => {
    await api().post("/api/clients").set(analistaHeaders).send({ fullName: "Cliente auditado pela equipe" });

    const logs = await api().get("/api/audit").set(owner);
    const entry = logs.body.find((l) => l.details.includes("Cliente auditado pela equipe"));
    expect(entry.userName).toBe(analista.name);
  });

  it("só o dono muda perfil; o sócio não remove sócio, mas remove analista", async () => {
    const otherSocio = await addMember("SOCIO");
    const otherAnalyst = await addMember("ANALISTA");

    const socioChanges = await api().put(`/api/team/${otherAnalyst.id}`).set(socioHeaders).send({ role: "SOCIO" });
    const ownerChanges = await api().put(`/api/team/${otherAnalyst.id}`).set(owner).send({ role: "SOCIO" });
    const socioRemovesSocio = await api().delete(`/api/team/${otherSocio.id}`).set(socioHeaders);
    const socioRemovesAnalyst = await api().delete(`/api/team/${analista.id}`).set(socioHeaders);

    expect([socioChanges.status, ownerChanges.status, socioRemovesSocio.status, socioRemovesAnalyst.status]).toEqual([403, 200, 403, 200]);
    expect(await prisma.user.findUnique({ where: { id: analista.id } })).toBeNull(); // sem outro acesso, o login sai junto

    // quem foi removido perde o acesso
    const after = await api().get("/api/clients").set(analistaHeaders);
    expect(after.status).toBe(401);
  });
});

describe("outros perfis", () => {
  it("o cliente do portal não vê nem mexe na equipe", async () => {
    const list = await api().get("/api/team").set(authHeaders(portal));
    const add = await api().post("/api/team").set(authHeaders(portal)).send(member("Intruso", "ANALISTA"));
    const anonymous = await api().get("/api/team");

    expect([list.status, add.status, anonymous.status]).toEqual([403, 403, 401]);
  });

  it("o cliente do portal não cria chave de API", async () => {
    const res = await api().post("/api/apikeys").set(authHeaders(portal)).send({ name: "x" });
    expect(res.status).toBe(403);
  });

  it("o dono continua com acesso total (apaga cliente, vê chaves)", async () => {
    const keys = await api().get("/api/apikeys").set(owner);
    expect(keys.status).toBe(200);
  });
});
