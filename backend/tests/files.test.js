import { describe, it, expect, beforeAll, vi } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, authHeaders } from "./helpers.js";

vi.mock("../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendDocumentNotification: vi.fn(async () => {}),
}));

let a, b, portalA;

// Para ler o corpo de arquivos (PDF etc.) como bytes.
const binary = (res, callback) => {
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
};

beforeAll(async () => {
  await resetDatabase();
  a = await createOffice("QA");
  b = await createOffice("QB");
  portalA = await createPortalUser(a.company, a.client);
});

const upload = (office, filename = "contrato.pdf", content = "conteúdo do contrato") =>
  api()
    .post("/api/documents")
    .set(authHeaders(office.admin, office.company.id))
    .field("name", "Contrato")
    .field("category", "Contrato")
    .field("clientId", office.client.id)
    .attach("file", Buffer.from(content), filename);

describe("arquivos guardados no banco", () => {
  it("o documento enviado fica no banco e volta igual no download", async () => {
    const res = await upload(a);
    expect(res.status).toBe(201);
    expect(res.body.fileUrl).toMatch(/^db:[0-9a-f-]{36}\/contrato\.pdf$/);

    const stored = await prisma.storedFile.findMany({ where: { companyId: a.company.id } });
    expect(stored).toHaveLength(1);
    expect(stored[0].size).toBe(Buffer.byteLength("conteúdo do contrato"));

    const asManager = await api()
      .get(`/api/documents/${res.body.id}/file`)
      .set(authHeaders(a.admin, a.company.id))
      .buffer(true)
      .parse(binary);
    const asPortal = await api().get(`/api/documents/${res.body.id}/file`).set(authHeaders(portalA));
    expect(asManager.status).toBe(200);
    expect(asManager.headers["content-type"]).toMatch(/application\/pdf/);
    expect(asManager.body.toString()).toBe("conteúdo do contrato");
    expect(asPortal.status).toBe(200);
  });

  it("outra empresa não baixa, nem trocando o cabeçalho de empresa", async () => {
    const res = await upload(a, "segredo.pdf");
    const otherOffice = await api().get(`/api/documents/${res.body.id}/file`).set(authHeaders(b.admin, b.company.id));
    const forged = await api().get(`/api/documents/${res.body.id}/file`).set(authHeaders(b.admin, a.company.id));

    expect(otherOffice.status).toBe(404);
    expect(forged.status).toBe(403);
  });

  it("arquivo HTML sai como download genérico", async () => {
    const res = await upload(a, "pagina.html", "<script>alert(1)</script>");
    const download = await api().get(`/api/documents/${res.body.id}/file`).set(authHeaders(portalA));

    expect(download.headers["content-type"]).toMatch(/application\/octet-stream/);
    expect(download.headers["content-disposition"]).toMatch(/attachment/);
  });

  it("apagar o documento apaga o arquivo do banco", async () => {
    const res = await upload(a, "temporario.pdf");
    const id = res.body.fileUrl.slice(3).split("/")[0];
    expect(await prisma.storedFile.findUnique({ where: { id } })).not.toBeNull();

    const removed = await api().delete(`/api/documents/${res.body.id}`).set(authHeaders(a.admin, a.company.id));
    expect(removed.status).toBe(204);
    expect(await prisma.storedFile.findUnique({ where: { id } })).toBeNull();
  });

  it("recusa arquivo maior que 5 MB", async () => {
    const res = await upload(a, "grande.pdf", Buffer.alloc(5 * 1024 * 1024 + 1024));
    expect(res.status).toBe(400);
  });

  it("o anexo de um lançamento fica no banco e só baixa com acesso", async () => {
    const created = await api()
      .post("/api/transactions")
      .set(authHeaders(a.admin, a.company.id))
      .field("title", "Com anexo")
      .field("amount", "100")
      .field("type", "ENTRADA")
      .field("category", "Serviços")
      .field("date", "2026-10-01")
      .field("clientId", a.client.id)
      .attach("file", Buffer.from("comprovante"), "comprovante.png");
    expect(created.status).toBe(201);
    expect(created.body.fileUrl).toMatch(/^db:/);

    const ok = await api().get(`/api/transactions/${created.body.id}/file`).set(authHeaders(a.admin, a.company.id));
    const semLogin = await api().get(`/api/transactions/${created.body.id}/file`);
    const outra = await api().get(`/api/transactions/${created.body.id}/file`).set(authHeaders(b.admin, b.company.id));

    expect(ok.status).toBe(200);
    expect(semLogin.status).toBe(401);
    expect(outra.status).toBe(404);
  });
});
