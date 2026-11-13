// Gera a coleção do Postman. Uso: node build.mjs
import { writeFileSync } from "node:fs";

const req = (name, method, path, { auth, body, headers = [], tests = [], pre } = {}) => ({
  name,
  event: [
    ...(pre ? [{ listen: "prerequest", script: { type: "text/javascript", exec: pre } }] : []),
    { listen: "test", script: { type: "text/javascript", exec: tests } },
  ],
  request: {
    method,
    header: [
      ...(body ? [{ key: "Content-Type", value: "application/json" }] : []),
      ...(auth ? [{ key: "Authorization", value: `Bearer {{${auth}}}` }, { key: "x-company-id", value: "{{companyId}}" }] : []),
      ...headers,
    ],
    ...(body ? { body: { mode: "raw", raw: JSON.stringify(body) } } : {}),
    url: { raw: `{{baseUrl}}${path}`, host: ["{{baseUrl}}"], path: path.split("?")[0].split("/").filter(Boolean), ...(path.includes("?") ? { query: path.split("?")[1].split("&").map((p) => { const [key, value] = p.split("="); return { key, value }; }) } : {}) },
  },
});

const status = (code) => [`pm.test("status ${code}", () => pm.response.to.have.status(${code}));`];

const collection = {
  info: {
    name: "BusinessFlow: demonstração (QA)",
    description: "Testes de API contra a demonstração pública (somente leitura, dados fictícios). Rode as pastas em ordem: 1 (login) preenche token e companyId. O servidor é gratuito e pode levar cerca de 1 minuto para acordar na primeira chamada.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "https://businessflow-api.onrender.com" },
    { key: "token", value: "" },
    { key: "tokenCliente", value: "" },
    { key: "companyId", value: "" },
    { key: "totalLancamentosGestor", value: "" },
  ],
  item: [
    { name: "1. Entrada na demonstração", item: [
      req("Configuração pública", "GET", "/api/auth/config", { tests: [...status(200), `pm.test("informa se a demonstração está ligada", () => pm.expect(pm.response.json()).to.have.property("demoEnabled"));`] }),
      req("Login demo como gestor", "POST", "/api/auth/demo-login", { body: { profile: "gestor" }, tests: [...status(200), `const j = pm.response.json();`, `pm.test("devolve token e perfil ADMIN", () => { pm.expect(j.token).to.be.a("string"); pm.expect(j.user.role).to.eql("ADMIN"); });`, `pm.collectionVariables.set("token", j.token);`] }),
      req("Login demo como cliente (portal)", "POST", "/api/auth/demo-login", { body: { profile: "cliente" }, tests: [...status(200), `const j = pm.response.json();`, `pm.test("perfil CLIENT", () => pm.expect(j.user.role).to.eql("CLIENT"));`, `pm.collectionVariables.set("tokenCliente", j.token);`] }),
      req("Empresas do gestor", "GET", "/api/companies", { auth: "token", tests: [...status(200), `const j = pm.response.json();`, `pm.test("só o escritório fictício", () => { pm.expect(j).to.have.lengthOf(1); pm.expect(j[0].name).to.include("DEMONSTRAÇÃO"); });`, `pm.collectionVariables.set("companyId", j[0].id);`] }),
    ] },
    { name: "2. Leitura como gestor", item: [
      req("Resumo do painel", "GET", "/api/dashboard/summary", { auth: "token", tests: [...status(200), `const j = pm.response.json();`, `pm.test("traz entradas, saídas e saldo", () => { pm.expect(j).to.have.keys("entradas", "saidas", "saldo", "growthEntradas", "growthSaidas", "inadimplentes", "distribuicao"); });`, `pm.test("saldo = entradas - saídas", () => pm.expect(Number(j.saldo)).to.be.closeTo(Number(j.entradas) - Number(j.saidas), 0.01));`] }),
      req("Lista de clientes", "GET", "/api/clients", { auth: "token", tests: [...status(200), `pm.test("12 clientes fictícios", () => pm.expect(pm.response.json()).to.have.lengthOf(12));`] }),
      req("Lançamentos financeiros", "GET", "/api/transactions", { auth: "token", tests: [...status(200), `const j = pm.response.json();`, `pm.test("tem mais de 80 lançamentos", () => pm.expect(j.length).to.be.above(80));`, `pm.test("cada lançamento tem tipo e valor", () => j.slice(0, 10).forEach((t) => { pm.expect(t).to.have.property("type"); pm.expect(t).to.have.property("amount"); }));`, `pm.collectionVariables.set("totalLancamentosGestor", j.length);`] }),
      req("Tarefas", "GET", "/api/tasks", { auth: "token", tests: status(200) }),
      req("Documentos", "GET", "/api/documents", { auth: "token", tests: [...status(200), `pm.test("5 documentos", () => pm.expect(pm.response.json()).to.have.lengthOf(5));`] }),
      req("Chamados", "GET", "/api/tickets", { auth: "token", tests: status(200) }),
      req("Auditoria", "GET", "/api/audit", { auth: "token", tests: status(200) }),
    ] },
    { name: "3. Segurança e permissões", item: [
      req("Sem token: recusa", "GET", "/api/clients", { tests: status(401) }),
      req("Token inválido: recusa", "GET", "/api/clients", { headers: [{ key: "Authorization", value: "Bearer abc" }], tests: status(401) }),
      req("Demo é somente leitura (POST cliente)", "POST", "/api/clients", { auth: "token", body: { name: "QA teste" }, tests: [...status(403), `pm.test("mensagem clara", () => pm.expect(pm.response.json().error).to.include("somente leitura"));`] }),
      req("Cliente não lista clientes do escritório", "GET", "/api/clients", { auth: "tokenCliente", tests: status(403) }),
      req("Cliente não vê a auditoria", "GET", "/api/audit", { auth: "tokenCliente", tests: status(403) }),
      req("Cliente não vê a equipe", "GET", "/api/team", { auth: "tokenCliente", tests: status(403) }),
      req("Cliente vê só os próprios lançamentos", "GET", "/api/transactions?role=ADMIN", { auth: "tokenCliente", tests: [...status(200), `const j = pm.response.json();`, `const doGestor = Number(pm.collectionVariables.get("totalLancamentosGestor"));`, `pm.test("menos lançamentos que o gestor (isolamento do portal)", () => pm.expect(j.length).to.be.below(doGestor));`, `pm.test("todos de um único cliente", () => pm.expect(new Set(j.map((t) => t.clientId)).size).to.eql(1));`, `pm.test("o parâmetro role=ADMIN na URL não amplia o acesso", () => pm.expect(j.length).to.be.above(0));`] }),
    ] },
    { name: "4. Erros e validação", item: [
      req("Login com senha errada", "POST", "/api/auth/login", { body: { email: "naoexiste@teste.com", password: "errada" }, tests: [...status(401), `pm.test("mensagem em JSON", () => pm.expect(pm.response.json().error).to.be.a("string"));`] }),
      req("Login com corpo vazio", "POST", "/api/auth/login", { body: {}, tests: [...status(400), `pm.test("lista os campos inválidos", () => pm.expect(pm.response.json().details).to.be.an("array"));`] }),
      req("Rota inexistente deve responder em JSON (BUG-001)", "GET", "/api/rota-que-nao-existe", { tests: [`pm.test("status 404", () => pm.response.to.have.status(404));`, `pm.test("resposta em JSON, como os demais erros da API", () => pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json"));`] }),
    ] },
  ],
};

writeFileSync("BusinessFlow-demo.postman_collection.json", JSON.stringify(collection, null, 2) + "\n");
console.log("coleção gerada");
