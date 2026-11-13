# QA do BusinessFlow

Material de qualidade sobre a **demonstração pública** (dados fictícios, somente leitura): plano de testes, casos de teste manuais, relatos de bug, testes de API no Postman e testes E2E com Playwright.

| Pasta / arquivo | O que é |
|---|---|
| [`plano-de-testes.md`](plano-de-testes.md) | Escopo, riscos, tipos de teste, critérios de entrada e saída |
| [`casos-de-teste.md`](casos-de-teste.md) | 26 casos de teste (passos, resultado esperado, prioridade e status) |
| [`relatos-de-bug/`](relatos-de-bug) | Modelo de relato e bugs encontrados (BUG-001) |
| [`postman/`](postman) | Coleção de testes de API (21 requisições, 38 verificações) |
| [`e2e/`](e2e) | 3 testes E2E com Playwright contra a demonstração |

## Como rodar

**API (Postman / Newman)**
```bash
cd qa/postman
npx newman run BusinessFlow-demo.postman_collection.json --timeout-request 90000
```
A primeira chamada pode levar cerca de 1 minuto: o servidor gratuito "dorme" e acorda sob demanda.

**E2E (Playwright)**
```bash
cd qa/e2e
npm install
npx playwright install chromium   # ou use o Edge instalado: PW_CHANNEL=msedge
npx playwright test
```

## Resultado da última execução (13/11/2026)
- Postman/Newman: 21 requisições, 38 verificações, 37 passaram. A falha restante era o **BUG-001** (rota inexistente devolvia HTML em vez de JSON), corrigido na API com teste de regressão no back-end (`backend/tests/not-found.test.js`).
- Playwright: 3 de 3 passaram (Edge).

## Limites (para ser honesto)
- É QA de **caixa-preta** sobre a demonstração: somente leitura, então não valida criação, edição e exclusão. Isso é coberto pelos testes automatizados do back-end (Vitest + PostgreSQL real, rodando no CI).
- Os casos manuais marcados "A executar" ainda não foram rodados passo a passo.
