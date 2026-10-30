import { describe, it, expect, beforeAll, vi } from "vitest";
import { api, prisma, resetDatabase, createOffice, authHeaders } from "./helpers.js";

let office;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("AUD");
});

describe("auditoria com o nome de quem fez", () => {
  it("o log guarda o nome e o perfil reais do usuário logado", async () => {
    const headers = authHeaders(office.admin, office.company.id);
    await api().post("/api/clients").set(headers).send({ fullName: "Cliente auditado" });
    await api()
      .post("/api/transactions")
      .set(headers)
      .field("title", "Lançamento auditado")
      .field("amount", "10")
      .field("type", "ENTRADA")
      .field("category", "Serviços")
      .field("date", "2026-10-01");

    // o registro é gravado em segundo plano, então esperamos ele aparecer
    await vi.waitFor(async () => {
      const logs = await prisma.auditLog.findMany({
        where: { companyId: office.company.id, details: { contains: "auditad" } },
      });
      expect(logs.length).toBeGreaterThanOrEqual(2);
      for (const log of logs) {
        expect(log.userName).toBe(office.admin.name);
        expect(log.userRole).toBe("ADMIN");
      }
    });
  });

  it("nenhum log novo sai como 'Usuário do Sistema'", async () => {
    const generic = await prisma.auditLog.count({
      where: { companyId: office.company.id, userName: "Usuário do Sistema" },
    });
    expect(generic).toBe(0);
  });
});
