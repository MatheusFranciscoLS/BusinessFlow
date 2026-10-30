import { describe, it, expect, beforeAll, vi } from "vitest";
import { api, prisma, resetDatabase, createOffice, authHeaders } from "./helpers.js";

let office, headers;

beforeAll(async () => {
  await resetDatabase();
  office = await createOffice("A");
  headers = authHeaders(office.admin, office.company.id);
});

describe("lançamentos financeiros", () => {
  const base = { title: "Mensalidade", amount: "250.50", category: "Honorários", type: "entrada", date: "2026-03-10", status: "PAGO" };

  it("cria um lançamento simples na empresa logada", async () => {
    const res = await api().post("/api/transactions").set(headers).send(base);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Mensalidade", amount: 250.5, installments: 1, companyId: office.company.id });
  });

  it("parcelado em 3x gera 3 lançamentos, um por mês, só o primeiro com o status informado", async () => {
    const res = await api()
      .post("/api/transactions")
      .set(headers)
      .send({ ...base, title: "Contrato anual", installments: 3, date: "2026-01-15" });

    expect(res.status).toBe(201);

    const parcelas = await prisma.transaction.findMany({
      where: { companyId: office.company.id, title: { startsWith: "Contrato anual" } },
      orderBy: { date: "asc" },
    });
    expect(parcelas.map((p) => p.title)).toEqual([
      "Contrato anual (1/3)",
      "Contrato anual (2/3)",
      "Contrato anual (3/3)",
    ]);
    expect(parcelas.map((p) => p.date.getUTCMonth())).toEqual([0, 1, 2]);
    expect(parcelas.map((p) => p.status)).toEqual(["PAGO", "PENDENTE", "PENDENTE"]);
    expect(parcelas.every((p) => p.installments === 3)).toBe(true);
  });

  it("filtra por mês e ano", async () => {
    await api().post("/api/transactions").set(headers).send({ ...base, title: "Só em junho", date: "2026-06-20" });

    const res = await api().get("/api/transactions?month=6&year=2026").set(headers);
    const titles = res.body.map((t) => t.title);

    expect(titles).toContain("Só em junho");
    expect(titles).not.toContain("Mensalidade");
  });

  it("pagina e informa o total nos cabeçalhos", async () => {
    const res = await api().get("/api/transactions?page=1&limit=2").set(headers);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(Number(res.headers["x-total-count"])).toBeGreaterThan(2);
    expect(res.headers["x-total-pages"]).toBe(String(Math.ceil(Number(res.headers["x-total-count"]) / 2)));
  });

  it("o resumo do painel calcula entradas, saídas e saldo só com lançamentos pagos", async () => {
    const hoje = new Date();
    const dados = [
      { type: "entrada", status: "PAGO", amount: 1000 },
      { type: "entrada", status: "PAGO", amount: 500 },
      { type: "saida", status: "PAGO", amount: 400 },
      { type: "entrada", status: "PENDENTE", amount: 9999 }, // não conta
    ];
    const other = await createOffice("Resumo");
    for (const d of dados) {
      await prisma.transaction.create({
        data: { title: "x", category: "Geral", date: hoje, companyId: other.company.id, ...d },
      });
    }

    const res = await api().get("/api/dashboard/summary").set(authHeaders(other.admin, other.company.id));

    expect(res.body).toMatchObject({ entradas: 1500, saidas: 400, saldo: 1100 });
  });
});

describe("clientes", () => {
  it("cadastra com status ATIVO por padrão e converte os honorários para número", async () => {
    const res = await api()
      .post("/api/clients")
      .set(headers)
      .send({ fullName: "Padaria do Zé", monthlyFee: "350.75" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ fullName: "Padaria do Zé", status: "ATIVO", monthlyFee: 350.75, companyId: office.company.id });
  });

  it("o cliente apagado leva junto os lançamentos dele (exclusão em cascata)", async () => {
    const created = await api().post("/api/clients").set(headers).send({ fullName: "Cliente temporário" });
    await prisma.transaction.create({
      data: { title: "Do temporário", amount: 10, type: "entrada", category: "x", date: new Date(), companyId: office.company.id, clientId: created.body.id },
    });

    const res = await api().delete(`/api/clients/${created.body.id}`).set(headers);

    expect(res.status).toBe(204);
    expect(await prisma.transaction.count({ where: { clientId: created.body.id } })).toBe(0);
  });
});

describe("empresas", () => {
  it("o gestor cria, edita e apaga a própria empresa", async () => {
    const auth = { Authorization: headers.Authorization };
    const created = await api().post("/api/companies").set(auth).send({ name: "Nova Ltda" });
    expect(created.status).toBe(201);
    expect(created.body.userId).toBe(office.admin.id);

    const updated = await api().put(`/api/companies/${created.body.id}`).set(auth).send({ name: "Nova S/A" });
    expect(updated.body.name).toBe("Nova S/A");

    const removed = await api().delete(`/api/companies/${created.body.id}`).set(auth);
    expect(removed.status).toBe(204);
  });
});

describe("auditoria", () => {
  it("criar, alterar e apagar registram uma linha no log da empresa", async () => {
    const created = await api().post("/api/clients").set(headers).send({ fullName: "Cliente do log" });
    await api().put(`/api/clients/${created.body.id}`).set(headers).send({ fullName: "Cliente do log 2" });
    await api().delete(`/api/clients/${created.body.id}`).set(headers);

    // o registro é gravado em segundo plano, então esperamos ele aparecer
    await vi.waitFor(async () => {
      const logs = await prisma.auditLog.findMany({
        where: { companyId: office.company.id, module: "CLIENTES", details: { contains: "Cliente do log" } },
      });
      expect(logs.map((l) => l.action).sort()).toEqual(["CREATE", "DELETE", "UPDATE"]);
    });
  });

  it("o gestor consegue ler o log", async () => {
    const res = await api().get("/api/audit").set(headers);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
