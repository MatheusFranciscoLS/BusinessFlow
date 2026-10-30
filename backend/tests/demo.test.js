import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, authHeaders } from "./helpers.js";
import { seedDemo, removeDemo } from "../src/services/demo.service.js";
import { DEMO_PROFILES } from "../src/utils/demo.js";

const originalDemoMode = process.env.DEMO_MODE;
afterEach(() => {
  process.env.DEMO_MODE = originalDemoMode;
});

let real, summary, demoCompany;

beforeAll(async () => {
  await resetDatabase();
  real = await createOffice("REAL");
  await createPortalUser(real.company, real.client);
  summary = await seedDemo();
  demoCompany = await prisma.company.findFirst({ where: { name: { contains: "DEMONSTRAÇÃO" } } });
});

const demoLogin = (profile) => api().post("/api/auth/demo-login").send({ profile });
const asDemo = async (profile) => {
  process.env.DEMO_MODE = "true";
  const res = await demoLogin(profile);
  expect(res.status).toBe(200);
  return { token: res.body.token, headers: { Authorization: `Bearer ${res.body.token}`, "x-company-id": demoCompany.id } };
};

describe("carga da demonstração", () => {
  it("cria o escritório fictício com todas as áreas preenchidas", async () => {
    expect(summary).toMatchObject({ clients: 12, documents: 5, tickets: 3 });
    expect(summary.transactions).toBeGreaterThan(80);
    expect(summary.obligationTasks).toBeGreaterThan(0);

    const [tasks, logs, members, files] = await Promise.all([
      prisma.task.count({ where: { companyId: demoCompany.id } }),
      prisma.auditLog.count({ where: { companyId: demoCompany.id } }),
      prisma.companyMember.count({ where: { companyId: demoCompany.id } }),
      prisma.storedFile.count({ where: { companyId: demoCompany.id } }),
    ]);
    expect(tasks).toBeGreaterThan(4);
    expect(logs).toBeGreaterThan(0);
    expect(members).toBe(1);
    expect(files).toBe(5);
  });

  it("carregar de novo não duplica e não encosta nos dados reais", async () => {
    await seedDemo();

    expect(await prisma.company.count({ where: { name: { contains: "DEMONSTRAÇÃO" } } })).toBe(1);
    expect(await prisma.user.count({ where: { email: { endsWith: "@businessflow.demo" } } })).toBe(3);
    expect(await prisma.company.findUnique({ where: { id: real.company.id } })).not.toBeNull();
    expect(await prisma.client.findUnique({ where: { id: real.client.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: real.admin.id } })).not.toBeNull();

    demoCompany = await prisma.company.findFirst({ where: { name: { contains: "DEMONSTRAÇÃO" } } });
  });

  it("os documentos abrem como PDF de verdade", async () => {
    const { headers } = await asDemo("gestor");
    const docs = await api().get("/api/documents").set(headers);
    const first = docs.body[0];

    const file = await api().get(`/api/documents/${first.id}/file`).set(headers).buffer(true).parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(file.status).toBe(200);
    expect(file.headers["content-type"]).toMatch(/application\/pdf/);
    expect(file.body.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("entrada na demonstração", () => {
  it("desligada por padrão: recusa com 403", async () => {
    delete process.env.DEMO_MODE;
    expect((await demoLogin("gestor")).status).toBe(403);
  });

  it("a tela de login descobre se a demo está ativa", async () => {
    delete process.env.DEMO_MODE;
    expect((await api().get("/api/auth/config")).body.demoEnabled).toBe(false);
    process.env.DEMO_MODE = "true";
    expect((await api().get("/api/auth/config")).body.demoEnabled).toBe(true);
  });

  it("ligada: entra como gestor, analista e cliente, sem senha", async () => {
    process.env.DEMO_MODE = "true";
    for (const profile of ["gestor", "analista", "cliente"]) {
      const res = await demoLogin(profile);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(DEMO_PROFILES[profile]);
      expect(res.body.token).toEqual(expect.any(String));
    }
    expect((await demoLogin("dono-do-mundo")).status).toBe(400);
  });

  it("não dá para entrar na conta da demo pelo login normal", async () => {
    for (const password of ["123456", "demo", "senha123", "businessflow"]) {
      const res = await api().post("/api/auth/login").send({ email: DEMO_PROFILES.gestor, password });
      expect(res.status).toBe(401);
    }
  });
});

describe("a demonstração é somente leitura e isolada", () => {
  it("o gestor da demo vê as telas (leitura funciona)", async () => {
    const { headers } = await asDemo("gestor");
    const reads = await Promise.all(
      ["/api/clients", "/api/transactions?month=" + (new Date().getUTCMonth() + 1) + "&year=" + new Date().getUTCFullYear(), "/api/documents", "/api/tickets", "/api/tasks", "/api/audit", "/api/dashboard/summary", "/api/team"].map((url) =>
        api().get(url).set(headers),
      ),
    );
    expect(reads.map((r) => r.status)).toEqual([200, 200, 200, 200, 200, 200, 200, 200]);
    expect(reads[0].body).toHaveLength(12);
  });

  it("recusa qualquer alteração: criar, editar, apagar, assinar, trocar senha", async () => {
    const { headers } = await asDemo("gestor");
    const client = await prisma.client.findFirst({ where: { companyId: demoCompany.id } });

    const attempts = await Promise.all([
      api().post("/api/clients").set(headers).send({ fullName: "Intruso" }),
      api().put(`/api/clients/${client.id}`).set(headers).send({ fullName: "Mudou" }),
      api().delete(`/api/clients/${client.id}`).set(headers),
      api().post("/api/fees/generate").set(headers).send({ month: 1, year: 2027 }),
      api().post("/api/team").set(headers).send({ name: "Fulano da Silva", email: "fulano@x.com", password: "senha-forte", role: "ANALISTA" }),
    ]);

    expect(attempts.map((r) => r.status)).toEqual([403, 403, 403, 403, 403]);
    expect(attempts[0].body.error).toMatch(/somente leitura/i);
    expect((await prisma.client.findUnique({ where: { id: client.id } })).fullName).toBe(client.fullName);
  });

  it("o cliente da demo vê o portal, mas não assina nem envia", async () => {
    const { headers } = await asDemo("cliente");
    const doc = await prisma.document.findFirst({ where: { companyId: demoCompany.id, isSigned: false } });

    const pending = await api().get("/api/portal/pending").set(headers);
    const sign = await api().put(`/api/documents/${doc.id}/sign`).set(headers);
    const send = await api().post("/api/portal/documents").set(headers).attach("file", Buffer.from("x"), "x.pdf");

    expect(pending.status).toBe(200);
    expect([sign.status, send.status]).toEqual([403, 403]);
    expect((await prisma.document.findUnique({ where: { id: doc.id } })).isSigned).toBe(false);
  });

  it("a sugestão de conciliação (que só calcula) funciona; confirmar não", async () => {
    const { headers } = await asDemo("gestor");
    const movement = { id: "demo-1", type: "entrada", amount: 650, date: new Date().toISOString(), description: "PIX" };

    const suggest = await api().post("/api/reconciliation/suggest").set(headers).send({ movements: [movement] });
    const confirm = await api().post("/api/reconciliation/confirm").set(headers).send({ bank: movement, transactionIds: ["x"] });

    expect(suggest.status).toBe(200);
    expect(confirm.status).toBe(403);
  });

  it("a demo não enxerga empresa de verdade, nem trocando o cabeçalho", async () => {
    const { token } = await asDemo("gestor");
    const res = await api().get("/api/clients").set({ Authorization: `Bearer ${token}`, "x-company-id": real.company.id });
    expect(res.status).toBe(403);
  });

  it("a renovação da sessão da demo continua somente leitura", async () => {
    process.env.DEMO_MODE = "true";
    const login = await demoLogin("gestor");
    const refreshed = await api().post("/api/auth/refresh-token").send({ refreshToken: login.body.refreshToken });
    expect(refreshed.status).toBe(200);

    const write = await api()
      .post("/api/clients")
      .set({ Authorization: `Bearer ${refreshed.body.token}`, "x-company-id": demoCompany.id })
      .send({ fullName: "Intruso" });
    expect(write.status).toBe(403);
  });

  it("usuários de verdade continuam podendo alterar (o bloqueio é só da demo)", async () => {
    const res = await api().post("/api/clients").set(authHeaders(real.admin, real.company.id)).send({ fullName: "Cliente real novo" });
    expect(res.status).toBe(201);
  });
});

describe("remover a demonstração", () => {
  it("apaga só a demo", async () => {
    const removed = await removeDemo();

    expect(removed).toBe(3);
    expect(await prisma.company.count({ where: { name: { contains: "DEMONSTRAÇÃO" } } })).toBe(0);
    expect(await prisma.user.count({ where: { email: { endsWith: "@businessflow.demo" } } })).toBe(0);
    expect(await prisma.company.findUnique({ where: { id: real.company.id } })).not.toBeNull();
  });
});
