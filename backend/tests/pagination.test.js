import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, authHeaders } from "./helpers.js";

let office, headers;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("PAG");
  headers = authHeaders(office.admin, office.company.id);

  // 120 lançamentos em outubro de 2026
  await prisma.transaction.createMany({
    data: Array.from({ length: 120 }, (_, i) => ({
      title: `Lançamento ${i + 1}`,
      amount: 10,
      type: "entrada",
      category: "Serviços",
      date: new Date(Date.UTC(2026, 9, 1 + (i % 28), 12)),
      companyId: office.company.id,
    })),
  });
  await prisma.task.createMany({
    data: Array.from({ length: 70 }, (_, i) => ({
      title: `Tarefa ${i + 1}`,
      dueDate: new Date(Date.UTC(2026, 9, 1 + (i % 28), 12)),
      companyId: office.company.id,
    })),
  });
});

describe("listas completas (sem corte em 50)", () => {
  it("o mês inteiro vem de uma vez, então o total fecha", async () => {
    const res = await api().get("/api/transactions?month=10&year=2026").set(headers);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(120);
    expect(res.headers["x-total-count"]).toBe("120");
    expect(res.body.reduce((sum, t) => sum + t.amount, 0)).toBe(1200);
  });

  it("com limit na URL, a paginação continua funcionando", async () => {
    const page1 = await api().get("/api/transactions?month=10&year=2026&limit=50&page=1").set(headers);
    const page3 = await api().get("/api/transactions?month=10&year=2026&limit=50&page=3").set(headers);

    expect(page1.body).toHaveLength(50);
    expect(page3.body).toHaveLength(20);
    expect(page1.headers["x-total-pages"]).toBe("3");
  });

  it("todas as tarefas vêm para o quadro Kanban", async () => {
    const res = await api().get("/api/tasks").set(headers);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(70);
  });
});
