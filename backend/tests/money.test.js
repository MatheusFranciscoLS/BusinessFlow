import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createTransaction, authHeaders } from "./helpers.js";
import { parseMoney, sumMoney } from "../src/utils/money.js";

describe("dinheiro (funções)", () => {
  it("soma em centavos, sem o erro do ponto flutuante", () => {
    expect(0.1 + 0.2).not.toBe(0.3); // o problema que a função resolve
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney(Array(10).fill(0.1))).toBe(1);
    expect(sumMoney([19.99, 5.01, 0.1])).toBe(25.1);
  });

  it("aceita número, texto com ponto ou com vírgula, e arredonda em 2 casas", () => {
    expect(parseMoney("10,50")).toBe(10.5);
    expect(parseMoney("10.5")).toBe(10.5);
    expect(parseMoney(10.555)).toBe(10.56);
    expect(parseMoney(" 7 ")).toBe(7);
  });

  it("recusa o que não é valor", () => {
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("")).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
    expect(parseMoney(NaN)).toBeNull();
    expect(parseMoney("Infinity")).toBeNull();
  });
});

describe("dinheiro (rotas)", () => {
  let office, headers;

  beforeAll(async () => {
    await resetDatabase();
    office = await createOffice("MONEY");
    headers = authHeaders(office.admin, office.company.id);
  });

  const create = (amount) =>
    api()
      .post("/api/transactions")
      .set(headers)
      .field("title", "Teste")
      .field("amount", amount)
      .field("type", "entrada")
      .field("category", "Serviços")
      .field("status", "PAGO")
      .field("date", new Date().toISOString());

  it("recusa valor inválido ao criar e ao editar", async () => {
    const created = await create("abc");
    expect(created.status).toBe(400);

    const tx = await createTransaction(office.company.id, { amount: 100 });
    const edited = await api().put(`/api/transactions/${tx.id}`).set(headers).field("amount", "xyz");
    expect(edited.status).toBe(400);
    expect((await prisma.transaction.findUnique({ where: { id: tx.id } })).amount).toBe(100);
  });

  it("aceita vírgula e guarda com 2 casas", async () => {
    const res = await create("10,505");
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(10.51);
  });

  it("o resumo do painel fecha no centavo (0,10 + 0,20 = 0,30)", async () => {
    await prisma.transaction.deleteMany({ where: { companyId: office.company.id } });
    await create("0.1");
    await create("0.2");

    const res = await api().get("/api/dashboard/summary").set(headers);
    expect(res.status).toBe(200);
    expect(res.body.entradas).toBe(0.3);
    expect(res.body.saldo).toBe(0.3);
  });

  it("editar sem mandar o valor mantém o valor antigo", async () => {
    const tx = await createTransaction(office.company.id, { amount: 42.42 });
    const res = await api().put(`/api/transactions/${tx.id}`).set(headers).field("title", "Novo título");

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(42.42);
  });
});
