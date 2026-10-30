import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders, uniqueEmail } from "./helpers.js";

let office, other, portal, otherClient, otherPortal;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("LGPD");
  other = await createOffice("LGPD2");
  portal = await createPortalUser(office.company, office.client);
  otherClient = await prisma.client.create({
    data: { fullName: "Outro cliente", email: uniqueEmail("outro-l"), companyId: office.company.id },
  });
  otherPortal = await createPortalUser(office.company, otherClient);
});

describe("exportar meus dados", () => {
  it("o cliente do portal recebe só os próprios dados, sem senha", async () => {
    await createTransaction(office.company.id, { clientId: office.client.id, title: "Meu lançamento" });
    await createTransaction(office.company.id, { clientId: otherClient.id, title: "Lançamento do outro" });
    await prisma.document.create({
      data: { name: "Meu contrato", category: "Societário", fileUrl: "db:x/y.pdf", clientId: office.client.id, companyId: office.company.id },
    });

    const res = await api().get("/api/privacy/export").set(authHeaders(portal));

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.body.user).toMatchObject({ email: portal.email, role: "CLIENT" });
    expect(res.body.client.fullName).toBe(office.client.fullName);
    expect(res.body.transactions.map((t) => t.title)).toEqual(["Meu lançamento"]);
    expect(res.body.documents.map((d) => d.name)).toEqual(["Meu contrato"]);

    const text = JSON.stringify(res.body);
    expect(text).not.toContain("Lançamento do outro");
    expect(text).not.toMatch(/\$2[aby]\$/); // nenhum hash de senha
    expect(res.body.user.password).toBeUndefined();
  });

  it("o gestor recebe os próprios dados e as empresas dele, não as de outro escritório", async () => {
    const res = await api().get("/api/privacy/export").set(authHeaders(office.admin));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(office.admin.email);
    expect(res.body.companies.map((c) => c.name)).toEqual([office.company.name]);
  });

  it("sem login é recusado", async () => {
    expect((await api().get("/api/privacy/export")).status).toBe(401);
  });
});

describe("aceite dos termos", () => {
  it("registra a versão e a data do aceite", async () => {
    const before = await api().get("/api/privacy/terms").set(authHeaders(portal));
    expect(before.body.upToDate).toBe(false);

    const accepted = await api().post("/api/privacy/terms/accept").set(authHeaders(portal));
    expect(accepted.status).toBe(200);

    const after = await api().get("/api/privacy/terms").set(authHeaders(portal));
    expect(after.body).toMatchObject({ upToDate: true, acceptedVersion: before.body.currentVersion });
    expect(after.body.acceptedAt).not.toBeNull();
  });
});

describe("apagar o próprio acesso (cliente do portal)", () => {
  it("recusa senha errada e mantém o acesso", async () => {
    const res = await api().delete("/api/privacy/account").set(authHeaders(otherPortal)).send({ password: "errada" });
    expect(res.status).toBe(400);
    expect(await prisma.user.findUnique({ where: { id: otherPortal.id } })).not.toBeNull();
  });

  it("com a senha certa apaga só o acesso; o cadastro do cliente fica com o escritório", async () => {
    const res = await api().delete("/api/privacy/account").set(authHeaders(otherPortal)).send({ password: "senha123" });

    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: otherPortal.id } })).toBeNull();
    expect(await prisma.client.findUnique({ where: { id: otherClient.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: portal.id } })).not.toBeNull();
  });

  it("a conta do gestor não é apagada por essa rota", async () => {
    const res = await api().delete("/api/privacy/account").set(authHeaders(other.admin)).send({ password: "senha123" });
    expect(res.status).toBe(403);
    expect(await prisma.user.findUnique({ where: { id: other.admin.id } })).not.toBeNull();
  });
});
