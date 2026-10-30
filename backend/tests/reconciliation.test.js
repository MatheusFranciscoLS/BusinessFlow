import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, createTransaction, authHeaders } from "./helpers.js";
import { suggestMatches } from "../src/services/reconciliation.service.js";

const day = (n) => new Date(Date.UTC(2026, 9, n, 12));
const pending = (id, amount, d, type = "entrada") => ({ id, amount, date: day(d), type });
const bankMove = (id, amount, d, type = "entrada") => ({ id, amount, date: day(d), type });

describe("sugestão de conciliação (regras)", () => {
  it("valor exato com data até 3 dias de diferença", () => {
    const { suggestions } = suggestMatches([bankMove("b1", 100, 10)], [pending("t1", 100, 12), pending("t2", 100, 20)]);
    expect(suggestions).toEqual([{ bankId: "b1", kind: "exata", transactionIds: ["t1"], difference: 0 }]);
  });

  it("não casa data distante nem tipo diferente", () => {
    const { suggestions, unmatched } = suggestMatches(
      [bankMove("b1", 100, 10)],
      [pending("t1", 100, 20), pending("t2", 100, 10, "saida")],
    );
    expect(suggestions).toEqual([]);
    expect(unmatched).toEqual(["b1"]);
  });

  it("prefere a data mais próxima e usa cada lançamento uma vez só", () => {
    const { suggestions } = suggestMatches(
      [bankMove("b1", 50, 10), bankMove("b2", 50, 10)],
      [pending("t1", 50, 13), pending("t2", 50, 10)],
    );
    expect(suggestions.find((s) => s.bankId === "b1").transactionIds).toEqual(["t2"]);
    expect(suggestions.find((s) => s.bankId === "b2").transactionIds).toEqual(["t1"]);
  });

  it("soma de vários lançamentos que dão o valor do banco", () => {
    const { suggestions } = suggestMatches(
      [bankMove("b1", 300, 10)],
      [pending("t1", 100, 10), pending("t2", 150, 11), pending("t3", 50, 9), pending("t4", 999, 10)],
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe("soma");
    expect([...suggestions[0].transactionIds].sort()).toEqual(["t1", "t2", "t3"]);
  });

  it("valor aproximado, até 10% de diferença", () => {
    const near = suggestMatches([bankMove("b1", 100, 10)], [pending("t1", 95, 10)]);
    const far = suggestMatches([bankMove("b1", 100, 10)], [pending("t1", 80, 10)]);

    expect(near.suggestions[0]).toMatchObject({ kind: "aproximada", transactionIds: ["t1"], difference: 5 });
    expect(far.suggestions).toEqual([]);
  });

  it("centavos: 0,10 + 0,20 casa com 0,30", () => {
    const { suggestions } = suggestMatches([bankMove("b1", 0.3, 10)], [pending("t1", 0.1, 10), pending("t2", 0.2, 10)]);
    expect(suggestions[0].kind).toBe("soma");
  });
});

describe("rotas de conciliação", () => {
  let office, other, portal, headers;

  beforeAll(async () => {
    await resetDatabase();
    office = await createOffice("CONC");
    other = await createOffice("CONC2");
    portal = await createPortalUser(office.company, office.client);
    headers = authHeaders(office.admin, office.company.id);
  });

  const pend = (overrides = {}) =>
    createTransaction(office.company.id, { status: "PENDENTE", type: "entrada", amount: 200, date: day(10), ...overrides });
  const bank = (overrides = {}) => ({ id: "ofx-1", type: "entrada", amount: 200, date: day(10).toISOString(), description: "PIX", ...overrides });

  it("sugere, confirma e marca como pago com o identificador do banco", async () => {
    const tx = await pend();
    const suggestion = await api().post("/api/reconciliation/suggest").set(headers).send({ movements: [bank()] });
    expect(suggestion.status).toBe(200);
    expect(suggestion.body.suggestions[0]).toMatchObject({ kind: "exata", transactionIds: [tx.id] });

    const confirmed = await api()
      .post("/api/reconciliation/confirm")
      .set(headers)
      .send({ bank: bank(), transactionIds: [tx.id] });
    expect(confirmed.status).toBe(200);

    const saved = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(saved).toMatchObject({ status: "PAGO", bankFitId: "ofx-1" });
    expect(saved.reconciledAt).not.toBeNull();
  });

  it("reimportar o mesmo extrato não concilia de novo", async () => {
    const again = await api().post("/api/reconciliation/suggest").set(headers).send({ movements: [bank()] });
    expect(again.body.alreadyReconciled).toEqual(["ofx-1"]);
    expect(again.body.suggestions).toEqual([]);

    const tx = await pend({ title: "Outro" });
    const dup = await api()
      .post("/api/reconciliation/confirm")
      .set(headers)
      .send({ bank: bank(), transactionIds: [tx.id] });
    expect(dup.status).toBe(409);
    expect((await prisma.transaction.findUnique({ where: { id: tx.id } })).status).toBe("PENDENTE");
  });

  it("recusa valor diferente sem confirmação da diferença; aceita com ela", async () => {
    const tx = await pend({ amount: 190 });
    const body = { bank: bank({ id: "ofx-2" }), transactionIds: [tx.id] };

    const refused = await api().post("/api/reconciliation/confirm").set(headers).send(body);
    expect(refused.status).toBe(409);

    const accepted = await api().post("/api/reconciliation/confirm").set(headers).send({ ...body, allowDifference: true });
    expect(accepted.status).toBe(200);
    expect(accepted.body.difference).toBe(10);
  });

  it("recusa entrada do banco com lançamento de saída e lançamento de outra empresa", async () => {
    const saida = await pend({ type: "saida", amount: 75 });
    const foreign = await createTransaction(other.company.id, { status: "PENDENTE", type: "entrada", amount: 75, date: day(10) });

    const wrongType = await api()
      .post("/api/reconciliation/confirm")
      .set(headers)
      .send({ bank: bank({ id: "ofx-3", amount: 75 }), transactionIds: [saida.id] });
    const wrongCompany = await api()
      .post("/api/reconciliation/confirm")
      .set(headers)
      .send({ bank: bank({ id: "ofx-3", amount: 75 }), transactionIds: [foreign.id] });

    expect([wrongType.status, wrongCompany.status]).toEqual([400, 400]);
    expect((await prisma.transaction.findUnique({ where: { id: foreign.id } })).status).toBe("PENDENTE");
  });

  it("cria lançamento de tarifa a partir do extrato e desfaz (apaga)", async () => {
    const created = await api()
      .post("/api/reconciliation/from-bank")
      .set(headers)
      .send({ bank: bank({ id: "ofx-fee", type: "saida", amount: 12.9, description: "TARIFA" }) });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: "PAGO", type: "saida", category: "Tarifas bancárias", bankFitId: "ofx-fee" });

    const undone = await api().post("/api/reconciliation/undo").set(headers).send({ transactionId: created.body.id });
    expect(undone.body).toEqual({ restored: 0, removed: 1 });
    expect(await prisma.transaction.findUnique({ where: { id: created.body.id } })).toBeNull();
  });

  it("desfazer devolve o lançamento para pendente e libera o movimento do banco", async () => {
    const tx = await pend({ amount: 33 });
    await api().post("/api/reconciliation/confirm").set(headers).send({ bank: bank({ id: "ofx-undo", amount: 33 }), transactionIds: [tx.id] });

    const undone = await api().post("/api/reconciliation/undo").set(headers).send({ transactionId: tx.id });
    expect(undone.body).toEqual({ restored: 1, removed: 0 });

    const saved = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(saved).toMatchObject({ status: "PENDENTE", bankFitId: null, reconciledAt: null });
  });

  it("cliente do portal e usuário sem login não usam a conciliação", async () => {
    const asPortal = await api().post("/api/reconciliation/suggest").set(authHeaders(portal)).send({ movements: [bank()] });
    const anonymous = await api().post("/api/reconciliation/suggest").send({ movements: [bank()] });
    expect([asPortal.status, anonymous.status]).toEqual([403, 401]);
  });

  it("movimentos inválidos voltam 400", async () => {
    const res = await api().post("/api/reconciliation/suggest").set(headers).send({ movements: [{ id: "x", amount: "abc" }] });
    expect(res.status).toBe(400);
  });
});
