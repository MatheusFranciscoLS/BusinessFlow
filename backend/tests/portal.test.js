import { describe, it, expect, beforeAll, vi } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders, uniqueEmail } from "./helpers.js";

vi.mock("../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendDocumentNotification: vi.fn(async () => {}),
}));

let office, other, portal, otherClient, otherPortal;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("POR");
  other = await createOffice("POR2");
  portal = await createPortalUser(office.company, office.client);
  otherClient = await prisma.client.create({
    data: { fullName: "Outro cliente", email: uniqueEmail("outro-p"), companyId: office.company.id },
  });
  otherPortal = await createPortalUser(office.company, otherClient);
});

const send = (user, filename = "extrato.pdf", fields = {}) => {
  let req = api().post("/api/portal/documents").set(authHeaders(user));
  for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
  return req.attach("file", Buffer.from("conteúdo"), filename);
};

describe("cliente envia documento ao escritório", () => {
  it("o documento fica no cofre do próprio cliente, na pasta 'Enviado pelo cliente'", async () => {
    const res = await send(portal, "informe-rendimentos.pdf", { name: "Informe de rendimentos" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Informe de rendimentos",
      category: "Enviado pelo cliente",
      clientId: office.client.id,
      companyId: office.company.id,
    });
    expect(res.body.fileUrl).toMatch(/^db:/);

    // o gestor vê o documento e baixa o arquivo
    const manager = authHeaders(office.admin, office.company.id);
    const list = await api().get("/api/documents").set(manager);
    expect(list.body.map((d) => d.id)).toContain(res.body.id);
    const file = await api().get(`/api/documents/${res.body.id}/file`).set(manager);
    expect(file.status).toBe(200);
  });

  it("o dono e a pasta vêm do servidor, mesmo que o cliente mande outros valores", async () => {
    const res = await send(portal, "nota.pdf", {
      name: "Nota",
      clientId: otherClient.id,
      companyId: other.company.id,
      category: "Fiscal e Tributário",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ clientId: office.client.id, companyId: office.company.id, category: "Enviado pelo cliente" });
  });

  it("outro cliente do portal não vê nem baixa o documento", async () => {
    const sent = await send(portal, "privado.pdf", { name: "Privado" });
    const list = await api().get("/api/documents").set(authHeaders(otherPortal));
    const file = await api().get(`/api/documents/${sent.body.id}/file`).set(authHeaders(otherPortal));

    expect(list.body.map((d) => d.id)).not.toContain(sent.body.id);
    expect(file.status).toBe(404);
  });

  it("recusa arquivo que pode rodar script e o que passa de 5 MB", async () => {
    const html = await send(portal, "pagina.html");
    const svg = await send(portal, "imagem.svg");
    const big = await api()
      .post("/api/portal/documents")
      .set(authHeaders(portal))
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1024), "grande.pdf");

    expect([html.status, svg.status, big.status]).toEqual([400, 400, 400]);
  });

  it("o gestor não usa a rota do portal, e sem login é recusado", async () => {
    const asManager = await api()
      .post("/api/portal/documents")
      .set(authHeaders(office.admin, office.company.id))
      .attach("file", Buffer.from("x"), "x.pdf");
    const anonymous = await api().post("/api/portal/documents").attach("file", Buffer.from("x"), "x.pdf");

    expect([asManager.status, anonymous.status]).toEqual([403, 401]);
  });
});

describe("o que falta resolver (portal)", () => {
  it("lista só o que é do próprio cliente", async () => {
    await createTransaction(office.company.id, { clientId: office.client.id, status: "PENDENTE", type: "entrada", title: "Minha cobrança" });
    await createTransaction(office.company.id, { clientId: otherClient.id, status: "PENDENTE", type: "entrada", title: "Cobrança do outro" });
    await createTransaction(office.company.id, { clientId: office.client.id, status: "PAGO", type: "entrada", title: "Já paga" });
    await prisma.document.create({
      data: { name: "Para assinar", category: "Societário", fileUrl: "db:x/y.pdf", clientId: office.client.id, companyId: office.company.id },
    });
    await prisma.document.create({
      data: { name: "Do outro", category: "Societário", fileUrl: "db:x/z.pdf", clientId: otherClient.id, companyId: office.company.id },
    });
    await prisma.task.create({ data: { title: "Minha tarefa", dueDate: new Date(), clientId: office.client.id, companyId: office.company.id } });
    await prisma.ticket.create({
      data: { subject: "Dúvida", department: "Fiscal", description: "d", clientId: office.client.id, companyId: office.company.id, hasUnreadClient: true },
    });

    const res = await api().get("/api/portal/pending").set(authHeaders(portal));

    expect(res.status).toBe(200);
    expect(res.body.unpaidTransactions.map((t) => t.title)).toEqual(["Minha cobrança"]);
    expect(res.body.documentsToSign.map((d) => d.name)).toContain("Para assinar");
    expect(res.body.documentsToSign.map((d) => d.name)).not.toContain("Do outro");
    expect(res.body.openTasks.map((t) => t.title)).toEqual(["Minha tarefa"]);
    expect(res.body.ticketsWithReply).toBe(1);
  });

  it("o gestor não usa a rota do portal", async () => {
    const res = await api().get("/api/portal/pending").set(authHeaders(office.admin, office.company.id));
    expect(res.status).toBe(403);
  });
});
