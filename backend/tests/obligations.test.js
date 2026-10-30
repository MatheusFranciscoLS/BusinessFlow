import { describe, it, expect, beforeAll } from "vitest";
import { api, prisma, resetDatabase, createOffice, createPortalUser, authHeaders, uniqueEmail } from "./helpers.js";
import { isBusinessDay, nextBusinessDay, lastBusinessDayOfMonth, regimeKey, nationalNonBusinessDays } from "../src/services/obligations.service.js";

const day = (iso) => new Date(`${iso}T12:00:00Z`);
const isoOf = (date) => date.toISOString().slice(0, 10);

describe("dias úteis", () => {
  it("feriados móveis de 2026 (Páscoa em 05/04)", () => {
    const holidays = nationalNonBusinessDays(2026);
    expect(holidays.has("2026-02-16")).toBe(true); // segunda de Carnaval
    expect(holidays.has("2026-02-17")).toBe(true); // terça de Carnaval
    expect(holidays.has("2026-04-03")).toBe(true); // Sexta-feira Santa
    expect(holidays.has("2026-06-04")).toBe(true); // Corpus Christi
  });

  it("20/11/2026 é feriado nacional (sexta): o vencimento vai para segunda, 23/11", () => {
    expect(isBusinessDay(day("2026-11-20"))).toBe(false);
    expect(isoOf(nextBusinessDay(day("2026-11-20")))).toBe("2026-11-23");
  });

  it("último dia útil: out/2026 é sexta 30 (31 é sábado); jul/2026 é sexta 31", () => {
    expect(isoOf(lastBusinessDayOfMonth(2026, 10))).toBe("2026-10-30");
    expect(isoOf(lastBusinessDayOfMonth(2026, 7))).toBe("2026-07-31");
  });

  it("reconhece o regime pelo texto do cadastro", () => {
    expect(regimeKey("Simples Nacional")).toBe("SIMPLES");
    expect(regimeKey("MEI")).toBe("MEI");
    expect(regimeKey("Lucro Presumido")).toBe("PRESUMIDO");
    expect(regimeKey("lucro real")).toBe("REAL");
    expect(regimeKey("Microempreendedor Individual")).toBe("MEI");
    expect(regimeKey(null)).toBeNull();
    expect(regimeKey("Imune")).toBeNull();
  });
});

describe("gerar obrigações do mês", () => {
  let office, other, headers;

  const newClient = (companyId, fullName, taxRegime, status = "ATIVO") =>
    prisma.client.create({ data: { fullName, taxRegime, status, email: uniqueEmail("obr"), companyId } });

  beforeAll(async () => {
    await resetDatabase();
    office = await createOffice("OBR");
    other = await createOffice("OBR2");
    headers = authHeaders(office.admin, office.company.id);
  });

  it("novembro: DAS do Simples vence 23/11/2026; DCTFWeb do Presumido no último dia útil; MEI sem nada", async () => {
    const simples = await newClient(office.company.id, "Padaria Simples", "Simples Nacional");
    const presumido = await newClient(office.company.id, "Indústria Presumido", "Lucro Presumido");
    const mei = await newClient(office.company.id, "João MEI", "MEI");
    await newClient(office.company.id, "Sem regime", null);
    await newClient(office.company.id, "Suspenso", "Simples Nacional", "SUSPENSO");
    await newClient(other.company.id, "De outra empresa", "Simples Nacional");

    const res = await api().post("/api/obligations/generate").set(headers).send({ month: 11, year: 2026 });
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(2);
    expect(res.body.clientsWithoutRegime).toContain("Sem regime");

    const tasks = await prisma.task.findMany({ where: { companyId: office.company.id, obligationKey: { not: null } } });
    const of = (client) => tasks.filter((t) => t.clientId === client.id);

    expect(of(simples)).toHaveLength(1);
    expect(of(simples)[0].title).toContain("DAS e PGDAS-D");
    expect(of(simples)[0].title).toContain("outubro/2026");
    expect(isoOf(of(simples)[0].dueDate)).toBe("2026-11-23");
    expect(of(simples)[0].obligationKey).toBe("das:2026-11");
    expect(of(simples)[0].description).toContain("gov.br");

    expect(of(presumido)).toHaveLength(1);
    expect(of(presumido)[0].title).toContain("DCTFWeb");
    expect(isoOf(of(presumido)[0].dueDate)).toBe("2026-11-30");

    expect(of(mei)).toHaveLength(0); // sem DAS mensal do MEI: prazo ainda não conferido
  });

  it("rodar de novo no mesmo mês não duplica", async () => {
    const again = await api().post("/api/obligations/generate").set(headers).send({ month: 11, year: 2026 });
    expect(again.body.created).toBe(0);
    expect(again.body.skipped).toBe(2);
  });

  it("março traz a DEFIS do Simples (31/03); maio, a DASN-SIMEI do MEI (31/05); julho, a ECF do Presumido", async () => {
    const march = await api().post("/api/obligations/generate").set(headers).send({ month: 3, year: 2027 });
    const may = await api().post("/api/obligations/generate").set(headers).send({ month: 5, year: 2027 });
    const july = await api().post("/api/obligations/generate").set(headers).send({ month: 7, year: 2027 });

    const keys = (await prisma.task.findMany({ where: { companyId: office.company.id }, select: { obligationKey: true, dueDate: true } }))
      .filter((t) => t.obligationKey)
      .map((t) => `${t.obligationKey}=${isoOf(t.dueDate)}`);

    expect(keys).toContain("defis:2027-03=2027-03-31");
    expect(keys).toContain("dasn-simei:2027-05=2027-05-31");
    expect(keys).toContain("ecf:2027-07=2027-07-30"); // 31/07/2027 é sábado
    expect(march.body.created).toBeGreaterThanOrEqual(2); // DAS + DEFIS do Simples; DCTFWeb do Presumido
    expect(may.body.created).toBeGreaterThanOrEqual(3);
    expect(july.body.created).toBeGreaterThanOrEqual(3);
  });

  it("cada regra mostra a fonte oficial e a data da conferência", async () => {
    const res = await api().get("/api/obligations/rules").set(headers);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const rule of res.body) {
      expect(rule.source).toMatch(/^https:\/\/www\.gov\.br\//);
      expect(rule.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("mês inválido volta 400; o cliente do portal e quem não tem login não geram", async () => {
    const portal = await createPortalUser(office.company, office.client);
    const invalid = await api().post("/api/obligations/generate").set(headers).send({ month: 13, year: 2026 });
    const asPortal = await api().post("/api/obligations/generate").set(authHeaders(portal)).send({ month: 11, year: 2026 });
    const anonymous = await api().post("/api/obligations/generate").send({ month: 11, year: 2026 });

    expect([invalid.status, asPortal.status, anonymous.status]).toEqual([400, 403, 401]);
  });
});
