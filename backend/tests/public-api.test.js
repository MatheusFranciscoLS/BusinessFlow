import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, authHeaders } from "./helpers.js";

let a, b;

beforeAll(async () => {
  await resetDatabase();
  a = await createOffice("A");
  b = await createOffice("B");
  await prisma.client.update({
    where: { id: a.client.id },
    data: { document: "123.456.789-00", phone: "19999990000", monthlyFee: 500 },
  });
  await prisma.client.create({
    data: { fullName: "Cliente inativo de A", status: "INATIVO", companyId: a.company.id },
  });
  await prisma.apiKey.create({ data: { name: "Integração A", key: "bf_live_chave_a", companyId: a.company.id } });
  await prisma.apiKey.create({ data: { name: "Antiga", key: "bf_live_revogada", companyId: a.company.id, isActive: false } });
});

describe("API pública (GET /api/v1/clients)", () => {
  it("sem a chave devolve 401", async () => {
    const res = await api().get("/api/v1/clients");
    expect(res.status).toBe(401);
  });

  it("chave que não existe devolve 401", async () => {
    const res = await api().get("/api/v1/clients").set("x-api-key", "bf_live_inventada");
    expect(res.status).toBe(401);
  });

  it("chave revogada devolve 401", async () => {
    const res = await api().get("/api/v1/clients").set("x-api-key", "bf_live_revogada");
    expect(res.status).toBe(401);
  });

  it("com chave válida devolve só os clientes ativos da empresa dona da chave", async () => {
    const res = await api().get("/api/v1/clients").set("x-api-key", "bf_live_chave_a");
    const names = res.body.map((c) => c.fullName);

    expect(res.status).toBe(200);
    expect(names).toEqual(["Cliente A"]);
  });

  it("devolve só os campos combinados (sem telefone, honorários ou id da empresa)", async () => {
    const res = await api().get("/api/v1/clients").set("x-api-key", "bf_live_chave_a");

    expect(Object.keys(res.body[0]).sort()).toEqual(["document", "email", "fullName", "id"]);
  });

  it("registra a data do último uso da chave", async () => {
    await api().get("/api/v1/clients").set("x-api-key", "bf_live_chave_a");

    const key = await prisma.apiKey.findUnique({ where: { key: "bf_live_chave_a" } });
    expect(key.lastUsed).toBeInstanceOf(Date);
  });
});

describe("gerar chave (POST /api/apikeys)", () => {
  it("cria uma chave no formato bf_live_ + 48 caracteres, ligada à empresa logada", async () => {
    const res = await api()
      .post("/api/apikeys")
      .set(authHeaders(b.admin, b.company.id))
      .send({ name: "Zapier" });

    expect(res.status).toBe(201);
    expect(res.body.key).toMatch(/^bf_live_[0-9a-f]{48}$/);
    expect(res.body.companyId).toBe(b.company.id);
  });

  it("exige o nome da integração", async () => {
    const res = await api().post("/api/apikeys").set(authHeaders(b.admin, b.company.id)).send({});
    expect(res.status).toBe(400);
  });
});
