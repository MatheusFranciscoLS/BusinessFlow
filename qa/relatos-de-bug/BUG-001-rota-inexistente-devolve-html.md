# BUG-001: rota inexistente da API devolve HTML em vez de JSON

| Campo | Valor |
|---|---|
| Ambiente | API de demonstração (`businessflow-api.onrender.com`), 13/11/2026 |
| Severidade | Baixa |
| Prioridade sugerida | Média (barato de corrigir e torna a API consistente) |
| Caso de teste | CT-24 |
| Status | **Corrigido** (teste de regressão em `backend/tests/not-found.test.js`) |

## Passos para reproduzir
1. Rodar `curl -i https://businessflow-api.onrender.com/api/rota-que-nao-existe`.
2. Conferir o status e o cabeçalho `Content-Type`.

## Resultado esperado
`404` com `Content-Type: application/json` e corpo no mesmo formato dos outros erros da API, por exemplo `{"error":"Rota não encontrada."}`.

## Resultado obtido
`404` com `Content-Type: text/html` e a página padrão do Express (`Cannot GET /api/rota-que-nao-existe`).

## Por que importa
Todos os outros erros da API (401, 403, 400) são JSON com o campo `error`. Quem consome a API (o próprio front-end ou uma integração com chave de API) tenta ler JSON e quebra ao receber HTML. A página padrão também revela que o servidor é Express.

## Evidência
- Coleção Postman: pasta "4. Erros e validação", requisição "Rota inexistente deve responder em JSON (BUG-001)". Falhou com `expected 'text/html; charset=utf-8' to include 'application/json'`.
- Causa: `backend/src/app.js` não tem um tratador de 404 antes do tratador global de erros.

## Correção
Adicionado, depois das rotas e antes do tratador de erros, um middleware que responde `404` em JSON. Regressão coberta por `backend/tests/not-found.test.js`.
