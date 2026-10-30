import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createTransaction, authHeaders } from "./helpers.js";

let office, headers;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("GRW");
  headers = authHeaders(office.admin, office.company.id);
});

const thisMonth = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 15, 12));
const lastMonth = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 15, 12));

describe("variação do painel contra o mês anterior", () => {
  it("sem mês anterior para comparar, não inventa variação", async () => {
    await createTransaction(office.company.id, { type: "entrada", status: "PAGO", amount: 100, date: thisMonth() });

    const res = await api().get("/api/dashboard/summary").set(headers);
    expect(res.status).toBe(200);
    expect(res.body.entradas).toBe(100);
    expect(res.body.growthEntradas).toBeNull();
    expect(res.body.growthSaidas).toBeNull();
  });

  it("com mês anterior, calcula a variação real", async () => {
    await createTransaction(office.company.id, { type: "entrada", status: "PAGO", amount: 80, date: lastMonth() });
    await createTransaction(office.company.id, { type: "saida", status: "PAGO", amount: 50, date: lastMonth() });
    await createTransaction(office.company.id, { type: "saida", status: "PAGO", amount: 25, date: thisMonth() });

    const res = await api().get("/api/dashboard/summary").set(headers);
    expect(res.body.growthEntradas).toBe(25); // de 80 para 100
    expect(res.body.growthSaidas).toBe(-50); // de 50 para 25
  });
});
