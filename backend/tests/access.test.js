import { describe, it, expect, beforeAll } from "vitest";
import { api, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders, createUser, prisma } from "./helpers.js";

let officeA, officeB, portalA;

beforeAll(async () => {
  await resetDatabase();
  officeA = await createOffice("A");
  officeB = await createOffice("B");
  portalA = await createPortalUser(officeA.company, officeA.client);
});

describe("escolha da empresa (gestor)", () => {
  it("sem o cabeçalho x-company-id devolve 400", async () => {
    const res = await api().get("/api/clients").set(authHeaders(officeA.admin));
    expect(res.status).toBe(400);
  });

  it("com a empresa de outro gestor devolve 403", async () => {
    const res = await api().get("/api/clients").set(authHeaders(officeA.admin, officeB.company.id));
    expect(res.status).toBe(403);
  });

  it("com a própria empresa devolve 200", async () => {
    const res = await api().get("/api/clients").set(authHeaders(officeA.admin, officeA.company.id));
    expect(res.status).toBe(200);
  });

  it("usuário apagado, mas com token ainda válido, é barrado", async () => {
    const ghost = await createUser();
    const headers = authHeaders(ghost, officeA.company.id);
    await prisma.user.delete({ where: { id: ghost.id } });

    const res = await api().get("/api/clients").set(headers);
    expect(res.status).toBe(401);
  });
});

describe("perfil CLIENT (portal do cliente)", () => {
  it("não entra nas rotas de gestão do escritório (CRM)", async () => {
    const res = await api().get("/api/clients").set(authHeaders(portalA));
    expect(res.status).toBe(403);
  });

  it("não vê o log de auditoria", async () => {
    const res = await api().get("/api/audit").set(authHeaders(portalA));
    expect(res.status).toBe(403);
  });

  it("sem empresa vinculada, é barrado", async () => {
    const semEmpresa = await createUser({ role: "CLIENT" });
    const res = await api().get("/api/transactions").set(authHeaders(semEmpresa));
    expect(res.status).toBe(403);
  });

  it("fica preso à própria empresa, mesmo mandando o x-company-id de outra", async () => {
    await createTransaction(officeB.company.id, { title: "Lançamento da empresa B" });

    const res = await api()
      .get("/api/transactions")
      .set(authHeaders(portalA, officeB.company.id));

    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).not.toContain("Lançamento da empresa B");
  });
});
