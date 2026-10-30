import prisma from "../config/prisma.js";

// Calendário de obrigações: gera, para cada cliente, as tarefas das obrigações do
// regime tributário dele que vencem em um mês.
//
// SÓ ENTRAM OBRIGAÇÕES COM PRAZO CONFERIDO EM FONTE OFICIAL (campos `source` e
// `checkedAt`). Prazo muda (prorrogações, novas regras): antes de adicionar ou mudar
// uma obrigação aqui, confira na Receita Federal e atualize `source` e `checkedAt`.
// Ficaram de fora, por falta de conferência: ECD, EFD-Contribuições, EFD ICMS/IPI,
// quotas de IRPJ/CSLL do Lucro Presumido e as guias de folha (FGTS Digital, eSocial).

// ---------- dias úteis ----------

const utcNoon = (year, month, day) => new Date(Date.UTC(year, month - 1, day, 12));

// Páscoa (algoritmo gregoriano), base dos feriados móveis.
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcNoon(year, month, day);
}

const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
const iso = (date) => date.toISOString().slice(0, 10);

// Dias sem expediente bancário no país: feriados nacionais fixos, Carnaval (segunda e
// terça), Sexta-feira Santa e Corpus Christi. Feriados estaduais e municipais não entram.
export function nationalNonBusinessDays(year) {
  const fixed = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"].map((md) => `${year}-${md}`);
  const pascoa = easter(year);
  const movable = [-48, -47, -2, 60].map((offset) => iso(addDays(pascoa, offset)));
  return new Set([...fixed, ...movable]);
}

export function isBusinessDay(date) {
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  return !nationalNonBusinessDays(date.getUTCFullYear()).has(iso(date));
}

export function nextBusinessDay(date) {
  let day = date;
  while (!isBusinessDay(day)) day = addDays(day, 1);
  return day;
}

export function lastBusinessDayOfMonth(year, month) {
  let day = new Date(Date.UTC(year, month, 0, 12)); // dia 0 do mês seguinte = último dia deste
  while (!isBusinessDay(day)) day = addDays(day, -1);
  return day;
}

// ---------- regimes ----------

const normalize = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function regimeKey(taxRegime) {
  const text = normalize(taxRegime);
  if (text === "mei" || text.includes("microempreendedor")) return "MEI";
  if (text.includes("simples")) return "SIMPLES";
  if (text.includes("presumido")) return "PRESUMIDO";
  if (text.includes("lucro real")) return "REAL";
  return null;
}

// ---------- obrigações ----------

const MONTH_NAMES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const previousMonth = (year, month) => (month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });
const competence = ({ year, month }) => `${MONTH_NAMES[month - 1]}/${year}`;

export const OBLIGATIONS = [
  {
    key: "das",
    regimes: ["SIMPLES"],
    dueMonths: "todos",
    title: (y, m) => `DAS e PGDAS-D do Simples Nacional (competência ${competence(previousMonth(y, m))})`,
    dueDate: (y, m) => nextBusinessDay(utcNoon(y, m, 20)),
    rule: "Dia 20 do mês seguinte à competência; se não houver expediente bancário, vai para o dia útil seguinte.",
    source: "https://www.gov.br/pt-br/servicos/declarar-apuracoes-mensais-do-simples-nacional",
    checkedAt: "2026-10-30",
  },
  {
    key: "defis",
    regimes: ["SIMPLES"],
    dueMonths: [3],
    title: (y) => `DEFIS do Simples Nacional (ano-calendário ${y - 1})`,
    dueDate: (y) => utcNoon(y, 3, 31),
    rule: "Até 31 de março do ano seguinte ao ano-calendário.",
    source: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2025/dezembro/receita-federal-orienta-contribuintes-sobre-a-entrega-do-pgdas-d-e-da-defis-antes-da-entrada-em-vigor-das-novas-regras-de-multa-por-atraso",
    checkedAt: "2026-10-30",
  },
  {
    key: "dasn-simei",
    regimes: ["MEI"],
    dueMonths: [5],
    title: (y) => `DASN-SIMEI do MEI (ano-calendário ${y - 1})`,
    dueDate: (y) => utcNoon(y, 5, 31),
    rule: "Até 31 de maio do ano seguinte ao ano-calendário.",
    source: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/maio/microempreendedor-individual-mei-tem-ate-31-de-maio-para-entregar-declaracao-anual",
    checkedAt: "2026-10-30",
  },
  {
    key: "dctfweb",
    regimes: ["PRESUMIDO", "REAL"],
    dueMonths: "todos",
    title: (y, m) => `DCTFWeb mensal (competência ${competence(previousMonth(y, m))})`,
    dueDate: (y, m) => lastBusinessDayOfMonth(y, m),
    rule: "Último dia útil do mês seguinte ao dos fatos geradores (IN RFB 2.237/2024). Só há o que declarar se houver fatos geradores (folha, retenções).",
    source: "https://www.gov.br/receitafederal/pt-br/assuntos/agenda-tributaria",
    checkedAt: "2026-10-30",
  },
  {
    key: "ecf",
    regimes: ["PRESUMIDO", "REAL"],
    dueMonths: [7],
    title: (y) => `ECF - Escrituração Contábil Fiscal (ano-calendário ${y - 1})`,
    dueDate: (y) => lastBusinessDayOfMonth(y, 7),
    rule: "Último dia útil de julho do ano seguinte ao ano-calendário.",
    source: "https://www.gov.br/pt-br/servicos/entregar-escrituracao-contabil-fiscal",
    checkedAt: "2026-10-30",
  },
];

const dueInMonth = (obligation, month) => obligation.dueMonths === "todos" || obligation.dueMonths.includes(month);

function validateMonth(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new Error("Informe um mês (1 a 12) e um ano válidos.");
  }
  return { m, y };
}

// Gera as tarefas das obrigações que VENCEM no mês informado. Rodar de novo não duplica.
export async function generateObligations(companyId, month, year) {
  const { m, y } = validateMonth(month, year);

  const clients = await prisma.client.findMany({
    where: { companyId, status: { in: ["ATIVO", "INADIMPLENTE"] } },
    select: { id: true, fullName: true, taxRegime: true },
  });

  const planned = [];
  const withoutRegime = [];
  for (const client of clients) {
    const regime = regimeKey(client.taxRegime);
    if (!regime) {
      withoutRegime.push(client.fullName);
      continue;
    }
    for (const obligation of OBLIGATIONS) {
      if (!obligation.regimes.includes(regime) || !dueInMonth(obligation, m)) continue;
      planned.push({
        client,
        obligation,
        key: `${obligation.key}:${y}-${String(m).padStart(2, "0")}`,
      });
    }
  }

  const existing = await prisma.task.findMany({
    where: { companyId, obligationKey: { in: [...new Set(planned.map((p) => p.key))] } },
    select: { clientId: true, obligationKey: true },
  });
  const done = new Set(existing.map((t) => `${t.clientId}|${t.obligationKey}`));
  const toCreate = planned.filter((p) => !done.has(`${p.client.id}|${p.key}`));

  if (toCreate.length > 0) {
    await prisma.task.createMany({
      data: toCreate.map(({ client, obligation, key }) => ({
        title: `${obligation.title(y, m)} - ${client.fullName}`,
        description: `${obligation.rule} Prazo conferido na Receita Federal em ${obligation.checkedAt}; confirme no calendário oficial antes de depender dele (podem existir prorrogações). Fonte: ${obligation.source}`,
        status: "A_FAZER",
        priority: "ALTA",
        dueDate: obligation.dueDate(y, m),
        obligationKey: key,
        clientId: client.id,
        companyId,
      })),
    });
  }

  return {
    created: toCreate.length,
    skipped: planned.length - toCreate.length,
    clientsWithoutRegime: withoutRegime,
  };
}

// Regras em uso, com a fonte de cada uma (para a tela mostrar de onde vem o prazo).
export function listRules() {
  return OBLIGATIONS.map(({ key, regimes, dueMonths, rule, source, checkedAt }) => ({ key, regimes, dueMonths, rule, source, checkedAt }));
}
