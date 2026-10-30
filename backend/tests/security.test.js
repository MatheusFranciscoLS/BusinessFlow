import { describe, it, expect, beforeAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  api,
  prisma,
  resetDatabase,
  createOffice,
  createPortalUser,
  createTransaction,
  createUser,
  authHeaders,
  uniqueEmail,
} from "./helpers.js";

// Os testes não mandam e-mail de verdade: capturamos o código que iria no link.
vi.mock("../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendDocumentNotification: vi.fn(async () => {}),
}));
import { sendPasswordResetEmail } from "../src/services/email.service.js";

const lastResetToken = () => sendPasswordResetEmail.mock.calls.at(-1)[1];

beforeAll(resetDatabase);

describe("recuperação de senha", () => {
  it("o link só funciona com o código enviado para o e-mail", async () => {
    const user = await createUser();
    await api().post("/api/auth/forgot-password").send({ email: user.email });
    const token = lastResetToken();

    const wrong = await api()
      .post("/api/auth/reset-password")
      .send({ email: user.email, token: "codigo-errado", newPassword: "nova-senha-1" });
    expect(wrong.status).toBe(400);

    const ok = await api()
      .post("/api/auth/reset-password")
      .send({ email: user.email, token, newPassword: "nova-senha-1" });
    expect(ok.status).toBe(200);

    const login = await api().post("/api/auth/login").send({ email: user.email, password: "nova-senha-1" });
    expect(login.status).toBe(200);
  });

  it("o código não troca a senha de outra pessoa", async () => {
    const dono = await createUser();
    const outro = await createUser();
    await api().post("/api/auth/forgot-password").send({ email: dono.email });
    const token = lastResetToken();

    const res = await api()
      .post("/api/auth/reset-password")
      .send({ email: outro.email, token, newPassword: "invadida-123" });
    expect(res.status).toBe(400);

    const login = await api().post("/api/auth/login").send({ email: outro.email, password: "senha123" });
    expect(login.status).toBe(200);
  });

  it("o código vale uma vez só", async () => {
    const user = await createUser();
    await api().post("/api/auth/forgot-password").send({ email: user.email });
    const token = lastResetToken();

    const body = { email: user.email, token, newPassword: "primeira-senha" };
    expect((await api().post("/api/auth/reset-password").send(body)).status).toBe(200);
    expect((await api().post("/api/auth/reset-password").send({ ...body, newPassword: "segunda-senha" })).status).toBe(400);
  });

  it("o código vencido é recusado", async () => {
    const user = await createUser();
    await api().post("/api/auth/forgot-password").send({ email: user.email });
    const token = lastResetToken();
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await api()
      .post("/api/auth/reset-password")
      .send({ email: user.email, token, newPassword: "nova-senha-1" });
    expect(res.status).toBe(400);
  });

  it("um novo pedido invalida o código anterior", async () => {
    const user = await createUser();
    await api().post("/api/auth/forgot-password").send({ email: user.email });
    const antigo = lastResetToken();
    await api().post("/api/auth/forgot-password").send({ email: user.email });

    const res = await api()
      .post("/api/auth/reset-password")
      .send({ email: user.email, token: antigo, newPassword: "nova-senha-1" });
    expect(res.status).toBe(400);
  });

  it("guarda só o hash do código e recusa senha curta", async () => {
    const user = await createUser();
    await api().post("/api/auth/forgot-password").send({ email: user.email });
    const token = lastResetToken();

    const saved = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
    expect(saved.tokenHash).not.toBe(token);

    const res = await api()
      .post("/api/auth/reset-password")
      .send({ email: user.email, token, newPassword: "123" });
    expect(res.status).toBe(400);
  });

  it("responde igual para e-mail que não existe, sem mandar mensagem", async () => {
    const calls = sendPasswordResetEmail.mock.calls.length;
    const known = await createUser();
    const a = await api().post("/api/auth/forgot-password").send({ email: known.email });
    const b = await api().post("/api/auth/forgot-password").send({ email: uniqueEmail("ninguem") });

    expect(b.status).toBe(a.status);
    expect(b.body).toEqual(a.body);
    expect(sendPasswordResetEmail.mock.calls.length).toBe(calls + 1);
  });

  it("trocar a senha encerra as sessões abertas", async () => {
    const user = await createUser();
    const login = await api().post("/api/auth/login").send({ email: user.email, password: "senha123" });
    await api().post("/api/auth/forgot-password").send({ email: user.email });
    await api()
      .post("/api/auth/reset-password")
      .send({ email: user.email, token: lastResetToken(), newPassword: "nova-senha-1" });

    const refresh = await api().post("/api/auth/refresh-token").send({ refreshToken: login.body.refreshToken });
    expect(refresh.status).toBe(401);
  });
});

describe("sessão", () => {
  it("renova o token pela rota e encerra no logout", async () => {
    const user = await createUser();
    const login = await api().post("/api/auth/login").send({ email: user.email, password: "senha123" });

    const refresh = await api().post("/api/auth/refresh-token").send({ refreshToken: login.body.refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body.token).toEqual(expect.any(String));

    const out = await api().post("/api/auth/logout").send({ refreshToken: login.body.refreshToken });
    expect(out.status).toBe(200);

    const again = await api().post("/api/auth/refresh-token").send({ refreshToken: login.body.refreshToken });
    expect(again.status).toBe(401);
  });

  it("dados inválidos no cadastro e no login voltam 400 com a lista de erros", async () => {
    const register = await api().post("/api/auth/register").send({ name: "Ma", email: "x", password: "1" });
    const login = await api().post("/api/auth/login").send({ email: "x", password: "" });

    expect(register.status).toBe(400);
    expect(register.body.details.length).toBeGreaterThan(0);
    expect(login.status).toBe(400);
    expect(login.body.details.length).toBeGreaterThan(0);
  });
});

describe("isolamento entre escritórios e no portal", () => {
  let a, b, portalA, otherPortalA, otherClientA;

  beforeAll(async () => {
    a = await createOffice("SA");
    b = await createOffice("SB");
    portalA = await createPortalUser(a.company, a.client);
    otherClientA = await prisma.client.create({
      data: { fullName: "Outro cliente A", email: uniqueEmail("outro"), companyId: a.company.id },
    });
    otherPortalA = await createPortalUser(a.company, otherClientA);
  });

  it("o log de auditoria traz só a empresa do gestor", async () => {
    await prisma.auditLog.create({
      data: { companyId: a.company.id, userName: "x", userRole: "ADMIN", action: "CREATE", module: "T", details: "log da empresa A" },
    });
    await prisma.auditLog.create({
      data: { companyId: b.company.id, userName: "x", userRole: "ADMIN", action: "CREATE", module: "T", details: "log da empresa B" },
    });

    const res = await api().get("/api/audit").set(authHeaders(a.admin, a.company.id));
    const details = res.body.map((l) => l.details);
    expect(res.status).toBe(200);
    expect(details).toContain("log da empresa A");
    expect(details).not.toContain("log da empresa B");

    const semEmpresa = await api().get("/api/audit").set(authHeaders(a.admin));
    expect(semEmpresa.status).toBe(400);
  });

  it("o cliente do portal vê só os próprios lançamentos", async () => {
    await createTransaction(a.company.id, { title: "Do cliente 1", clientId: a.client.id });
    await createTransaction(a.company.id, { title: "Do cliente 2", clientId: otherClientA.id });
    await createTransaction(a.company.id, { title: "Sem cliente" });

    const res = await api().get("/api/transactions").set(authHeaders(portalA));
    const titles = res.body.map((t) => t.title);
    expect(res.status).toBe(200);
    expect(titles).toContain("Do cliente 1");
    expect(titles).not.toContain("Do cliente 2");
    expect(titles).not.toContain("Sem cliente");

    // mandar role/clientId na URL não amplia o acesso
    const forged = await api()
      .get(`/api/transactions?role=ADMIN&clientId=${otherClientA.id}`)
      .set(authHeaders(portalA));
    expect(forged.body.map((t) => t.title)).not.toContain("Do cliente 2");
  });

  it("o cliente do portal não cria, altera nem apaga lançamentos", async () => {
    const tx = await createTransaction(a.company.id, { clientId: a.client.id });
    const headers = authHeaders(portalA);

    const create = await api().post("/api/transactions").set(headers).send({ title: "x", amount: 1, type: "ENTRADA", category: "c", date: "2026-01-01" });
    const update = await api().put(`/api/transactions/${tx.id}`).set(headers).send({ title: "alterado" });
    const remove = await api().delete(`/api/transactions/${tx.id}`).set(headers);

    expect([create.status, update.status, remove.status]).toEqual([403, 403, 403]);
    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).not.toBeNull();
  });

  it("o cliente do portal não abre lançamento de outro cliente", async () => {
    const tx = await createTransaction(a.company.id, { clientId: otherClientA.id });
    const res = await api().get(`/api/transactions/${tx.id}`).set(authHeaders(portalA));
    expect(res.status).toBe(404);
  });

  it("marcar documento como lido respeita a empresa", async () => {
    const docB = await prisma.document.create({
      data: { name: "doc B", category: "Contrato", fileUrl: "/uploads/documents/nao-existe.pdf", clientId: b.client.id, companyId: b.company.id },
    });

    const res = await api().put(`/api/documents/${docB.id}/read`).set(authHeaders(a.admin, a.company.id));
    expect(res.status).toBe(404);
    expect((await prisma.document.findUnique({ where: { id: docB.id } })).readAt).toBeNull();
  });
});

describe("acessos do portal (client-account)", () => {
  let a, b, portalA;

  beforeAll(async () => {
    a = await createOffice("CA");
    b = await createOffice("CB");
    portalA = await createPortalUser(a.company, a.client);
  });

  const novo = (companyId) => ({ name: "Cliente Novo", email: uniqueEmail("novo-acesso"), password: "senha-forte-1", companyId });

  it("o gestor cria, lista e revoga acesso da própria empresa, sem devolver a senha", async () => {
    const headers = authHeaders(a.admin);
    const created = await api().post("/api/auth/client-account").set(headers).send(novo(a.company.id));
    expect(created.status).toBe(201);
    expect(created.body.password).toBeUndefined();

    const list = await api().get(`/api/auth/client-account/${a.company.id}`).set(headers);
    expect(list.body.map((u) => u.id)).toContain(created.body.id);

    const revoked = await api().delete(`/api/auth/client-account/${created.body.id}`).set(headers);
    expect(revoked.status).toBe(200);
  });

  it("o gestor não mexe em acessos de outra empresa", async () => {
    const headers = authHeaders(a.admin);
    const create = await api().post("/api/auth/client-account").set(headers).send(novo(b.company.id));
    const list = await api().get(`/api/auth/client-account/${b.company.id}`).set(headers);

    const portalB = await createPortalUser(b.company, b.client);
    const remove = await api().delete(`/api/auth/client-account/${portalB.id}`).set(headers);

    expect(create.status).toBe(403);
    expect(list.status).toBe(403);
    expect(remove.status).toBe(404);
    expect(await prisma.user.findUnique({ where: { id: portalB.id } })).not.toBeNull();
  });

  it("o cliente do portal não gerencia acessos", async () => {
    const headers = authHeaders(portalA);
    const create = await api().post("/api/auth/client-account").set(headers).send(novo(a.company.id));
    const list = await api().get(`/api/auth/client-account/${a.company.id}`).set(headers);
    expect([create.status, list.status]).toEqual([403, 403]);
  });

  it("não dá para apagar um gestor por essa rota", async () => {
    const res = await api().delete(`/api/auth/client-account/${b.admin.id}`).set(authHeaders(a.admin));
    expect(res.status).toBe(404);
    expect(await prisma.user.findUnique({ where: { id: b.admin.id } })).not.toBeNull();
  });
});

describe("arquivos", () => {
  let a, b, portalA, doc, tx;
  const folder = path.resolve("uploads", "documents");
  const filename = `teste-${Date.now()}.txt`;

  beforeAll(async () => {
    a = await createOffice("FA");
    b = await createOffice("FB");
    portalA = await createPortalUser(a.company, a.client);

    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, filename), "conteúdo secreto");

    doc = await prisma.document.create({
      data: { name: "Contrato", category: "Contrato", fileUrl: `/uploads/documents/${filename}`, clientId: a.client.id, companyId: a.company.id },
    });
    tx = await createTransaction(a.company.id, { clientId: a.client.id, fileUrl: `/uploads/transactions/${filename}` });
  });

  it("a pasta de uploads não é mais pública", async () => {
    const res = await api().get(`/uploads/documents/${filename}`);
    expect(res.status).toBe(404);
  });

  it("sem login não baixa", async () => {
    expect((await api().get(`/api/documents/${doc.id}/file`)).status).toBe(401);
    expect((await api().get(`/api/transactions/${tx.id}/file`)).status).toBe(401);
  });

  it("o gestor e o cliente dono baixam", async () => {
    const asManager = await api().get(`/api/documents/${doc.id}/file`).set(authHeaders(a.admin, a.company.id));
    const asPortal = await api().get(`/api/documents/${doc.id}/file`).set(authHeaders(portalA));
    const attachment = await api().get(`/api/transactions/${tx.id}/file`).set(authHeaders(a.admin, a.company.id));

    expect(asManager.status).toBe(200);
    expect(asManager.text).toContain("conteúdo secreto");
    expect(asPortal.status).toBe(200);
    expect(attachment.status).toBe(200);
  });

  it("outra empresa e outro cliente do portal não baixam", async () => {
    const otherOffice = await api().get(`/api/documents/${doc.id}/file`).set(authHeaders(b.admin, b.company.id));
    const tryingOtherCompany = await api().get(`/api/documents/${doc.id}/file`).set(authHeaders(b.admin, a.company.id));

    const outroCliente = await prisma.client.create({
      data: { fullName: "Outro", email: uniqueEmail("outro-f"), companyId: a.company.id },
    });
    const outroPortal = await createPortalUser(a.company, outroCliente);
    const asOtherPortal = await api().get(`/api/documents/${doc.id}/file`).set(authHeaders(outroPortal));

    expect(otherOffice.status).toBe(404);
    expect(tryingOtherCompany.status).toBe(403);
    expect(asOtherPortal.status).toBe(404);
  });

  it("arquivo que pode rodar script (HTML) sai como download, não como página", async () => {
    const htmlName = `teste-${Date.now()}.html`;
    fs.writeFileSync(path.join(folder, htmlName), "<script>alert(1)</script>");
    const htmlDoc = await prisma.document.create({
      data: { name: "pagina", category: "Outros", fileUrl: `/uploads/documents/${htmlName}`, clientId: a.client.id, companyId: a.company.id },
    });

    const res = await api().get(`/api/documents/${htmlDoc.id}/file`).set(authHeaders(portalA));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/octet-stream/);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
  });

  it("o cliente do portal não envia nem apaga documentos", async () => {
    const upload = await api()
      .post("/api/documents")
      .set(authHeaders(portalA))
      .field("name", "x")
      .field("category", "c")
      .field("clientId", a.client.id)
      .attach("file", Buffer.from("x"), "x.txt");
    const remove = await api().delete(`/api/documents/${doc.id}`).set(authHeaders(portalA));

    expect([upload.status, remove.status]).toEqual([403, 403]);
  });

  it("o gestor não vincula documento a cliente de outra empresa", async () => {
    const res = await api()
      .post("/api/documents")
      .set(authHeaders(a.admin, a.company.id))
      .field("name", "x")
      .field("category", "c")
      .field("clientId", b.client.id)
      .attach("file", Buffer.from("x"), "x.txt");
    expect(res.status).toBe(400);
  });
});
