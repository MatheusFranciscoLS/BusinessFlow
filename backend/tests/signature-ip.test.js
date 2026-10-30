import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, authHeaders } from "./helpers.js";

let office, portal;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("IP");
  portal = await createPortalUser(office.company, office.client);
});

const newDocument = () =>
  prisma.document.create({
    data: {
      name: "Contrato",
      category: "Contrato",
      fileUrl: "db:inexistente/contrato.pdf",
      clientId: office.client.id,
      companyId: office.company.id,
    },
  });

describe("IP gravado na assinatura (atrás do proxy)", () => {
  it("grava o IP que o proxy viu, ignorando o que o cliente colocou no início do cabeçalho", async () => {
    const doc = await newDocument();
    const res = await api()
      .put(`/api/documents/${doc.id}/sign`)
      .set(authHeaders(portal))
      .set("X-Forwarded-For", "1.1.1.1, 203.0.113.9");

    expect(res.status).toBe(200);
    expect(res.body.signedByIp).toBe("203.0.113.9");
  });
});
