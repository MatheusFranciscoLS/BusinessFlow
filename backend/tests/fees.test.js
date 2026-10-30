import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders, uniqueEmail } from "./helpers.js";

let office, other, headers;

const newClient = (companyId, fields) =>
  prisma.client.create({ data: { fullName: "Cliente", email: uniqueEmail("hon"), companyId, ...fields } });

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("HON");
  other = await createOffice("HON2");
  headers = authHeaders(office.admin, office.company.id);
});

describe("honorários mensais", () => {
  it("gera a cobrança do mês só para quem está ativo ou inadimplente e tem honorário", async () => {
    const ativo = await newClient(office.company.id, { fullName: "Ativo", monthlyFee: 1500, status: "ATIVO" });
    const semFee = await newClient(office.company.id, { fullName: "Sem valor", monthlyFee: 0 });
    const suspenso = await newClient(office.company.id, { fullName: "Suspenso", monthlyFee: 800, status: "SUSPENSO" });
    const foreign = await newClient(other.company.id, { fullName: "De outra empresa", monthlyFee: 999 });

    const res = await api().post("/api/fees/generate").set(headers).send({ month: 10, year: 2026 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ reference: "2026-10", created: 1 });

    const fees = await prisma.transaction.findMany({ where: { feeReference: "2026-10" } });
    expect(fees).toHaveLength(1);
    expect(fees[0]).toMatchObject({
      clientId: ativo.id,
      companyId: office.company.id,
      amount: 1500,
      type: "entrada",
      status: "PENDENTE",
      category: "Honorários",
    });
    expect(fees[0].date.toISOString()).toBe("2026-10-10T12:00:00.000Z");
    expect(fees.map((f) => f.clientId)).not.toContain(semFee.id);
    expect(fees.map((f) => f.clientId)).not.toContain(suspenso.id);
    expect(fees.map((f) => f.clientId)).not.toContain(foreign.id);
  });

  it("rodar de novo no mesmo mês não duplica", async () => {
    const again = await api().post("/api/fees/generate").set(headers).send({ month: 10, year: 2026 });
    expect(again.body).toMatchObject({ created: 0, skipped: 1 });
    expect(await prisma.transaction.count({ where: { companyId: office.company.id, feeReference: "2026-10" } })).toBe(1);
  });

  it("vencimento em dia 31 cai no último dia de meses mais curtos", async () => {
    const res = await api().post("/api/fees/generate").set(headers).send({ month: 2, year: 2027, dueDay: 31 });
    expect(res.body.created).toBe(1);
    const fee = await prisma.transaction.findFirst({ where: { feeReference: "2027-02" } });
    expect(fee.date.toISOString()).toBe("2027-02-28T12:00:00.000Z");
  });

  it("recusa mês ou ano inválido", async () => {
    const month = await api().post("/api/fees/generate").set(headers).send({ month: 13, year: 2026 });
    const year = await api().post("/api/fees/generate").set(headers).send({ month: 5 });
    expect([month.status, year.status]).toEqual([400, 400]);
  });
});

describe("inadimplência", () => {
  let devedor, emDia, suspenso;

  beforeAll(async () => {
    devedor = await newClient(office.company.id, { fullName: "Devedor", status: "ATIVO" });
    emDia = await newClient(office.company.id, { fullName: "Em dia", status: "INADIMPLENTE" });
    suspenso = await newClient(office.company.id, { fullName: "Suspenso 2", status: "SUSPENSO" });

    const past = new Date(Date.now() - 20 * 86400000);
    await createTransaction(office.company.id, { clientId: devedor.id, status: "PENDENTE", type: "entrada", amount: 100, date: past });
    await createTransaction(office.company.id, { clientId: devedor.id, status: "PENDENTE", type: "entrada", amount: 50.5, date: past });
    await createTransaction(office.company.id, { clientId: emDia.id, status: "PAGO", type: "entrada", amount: 70, date: past });
    await createTransaction(office.company.id, { clientId: suspenso.id, status: "PENDENTE", type: "entrada", amount: 10, date: past });
    await createTransaction(other.company.id, { clientId: other.client.id, status: "PENDENTE", type: "entrada", amount: 999, date: past });
  });

  it("lista os vencidos por cliente, com total em centavos e dias de atraso", async () => {
    const res = await api().get("/api/fees/overdue").set(headers);
    expect(res.status).toBe(200);

    const entry = res.body.find((o) => o.client.id === devedor.id);
    expect(entry.total).toBe(150.5);
    expect(entry.items).toHaveLength(2);
    expect(entry.items[0].daysLate).toBeGreaterThanOrEqual(19);
    expect(res.body.find((o) => o.client.id === emDia.id)).toBeUndefined();
    expect(res.body.find((o) => o.client.id === other.client.id)).toBeUndefined();
  });

  it("marca quem deve como inadimplente, libera quem quitou e não mexe em suspenso", async () => {
    const res = await api().post("/api/fees/sync-status").set(headers);
    expect(res.status).toBe(200);

    const status = async (c) => (await prisma.client.findUnique({ where: { id: c.id } })).status;
    expect(await status(devedor)).toBe("INADIMPLENTE");
    expect(await status(emDia)).toBe("ATIVO");
    expect(await status(suspenso)).toBe("SUSPENSO");
  });

  it("o cliente do portal e quem não tem login não acessam", async () => {
    const portal = await createPortalUser(office.company, office.client);
    const asPortal = await api().get("/api/fees/overdue").set(authHeaders(portal));
    const anonymous = await api().get("/api/fees/overdue");
    const generate = await api().post("/api/fees/generate").set(authHeaders(portal)).send({ month: 10, year: 2026 });

    expect([asPortal.status, anonymous.status, generate.status]).toEqual([403, 401, 403]);
  });
});
