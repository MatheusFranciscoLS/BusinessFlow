# Casos de teste: BusinessFlow (demonstração)

Prioridade: **A** alta, **M** média, **B** baixa.
Status: **Passou** (executado e conferido em 13/11/2026), **Falhou**, **A executar** (manual, ainda não rodado passo a passo).
"Automação" indica onde há teste automático: `PM` = Postman, `E2E` = Playwright.

## Entrada e sessão
| ID | Caso | Passos | Esperado | Prior. | Automação | Status |
|---|---|---|---|---|---|---|
| CT-01 | Página de entrada oferece a demonstração | Abrir `/` sem sessão | Aparece "Quer só conhecer o sistema?" com 2 botões (gestor, cliente) | A | E2E-01 | Passou |
| CT-02 | Primeira entrada com o servidor dormindo | Abrir a demo após ~15 min sem uso; clicar em "Como gestor" | Mostra aviso de espera, tenta de novo e abre em até ~1 min, sem tela quebrada | A | - | A executar |
| CT-03 | Entrar como gestor | Clicar "Como gestor do escritório" | Aviso "Modo demonstração…", usuário "Ana Souza (demo)", menu completo | A | E2E-01, PM | Passou |
| CT-04 | Entrar como cliente | Clicar "Como cliente (portal)" | Portal do cliente, sem menus de gestão | A | E2E-03, PM | Passou |
| CT-05 | Demonstração não grava | Como gestor, tentar criar/editar/excluir cliente, lançamento ou tarefa | Mensagem "somente leitura" e nada muda após recarregar (API devolve 403) | A | PM | Passou só na API (POST devolve 403 "somente leitura"); a parte pela interface fica **A executar** |

## Permissões e isolamento
| ID | Caso | Passos | Esperado | Prior. | Automação | Status |
|---|---|---|---|---|---|---|
| CT-06 | Sem token | Chamar `GET /api/clients` sem login | 401 | A | PM | Passou |
| CT-07 | Token inválido | Chamar com `Bearer abc` | 401 | A | PM | Passou |
| CT-08 | Cliente não lista clientes do escritório | Login cliente; `GET /api/clients` | 403 | A | PM | Passou |
| CT-09 | Cliente não vê auditoria nem equipe | Login cliente; `GET /api/audit` e `/api/team` | 403 nos dois | A | PM | Passou |
| CT-10 | Cliente vê só os próprios lançamentos | Login cliente; `GET /api/transactions` (também com `?role=ADMIN`) | Só lançamentos de um cliente (6 de 93); o parâmetro na URL não amplia o acesso | A | PM | Passou |

## Painel, financeiro e DRE
| ID | Caso | Passos | Esperado | Prior. | Automação | Status |
|---|---|---|---|---|---|---|
| CT-11 | Coerência do painel | Como gestor, abrir Início | Saldo = entradas − saídas | A | PM | Passou |
| CT-12 | Lista de lançamentos | Abrir Financeiro | Mais de 80 lançamentos, cada um com tipo, valor, categoria e data | M | PM | Passou |
| CT-13 | Navegar até o DRE | Menu "Resultados (DRE)" | Abre "Análise de Dados e DRE" | M | E2E-02 | Passou |
| CT-14 | DRE bate com o Financeiro | Comparar totais por categoria no DRE com a lista do Financeiro | Mesmos totais | A | - | A executar |
| CT-15 | Filtros e paginação do Financeiro | Filtrar por tipo e período; mudar de página | Resultados coerentes, sem repetir nem pular itens; `page=0&limit=-5` não quebra | M | - | A executar |

## CRM, documentos, chamados, tarefas, auditoria
| ID | Caso | Passos | Esperado | Prior. | Automação | Status |
|---|---|---|---|---|---|---|
| CT-16 | Lista de clientes | Abrir Clientes (CRM) | 12 clientes fictícios com status | M | PM | Passou |
| CT-17 | Busca de cliente | Buscar por parte do nome, com e sem acento | Encontra; sem resultado mostra mensagem amigável | M | - | A executar |
| CT-18 | Documentos abrem | Abrir cada um dos 5 documentos | PDF abre, sem erro | M | PM (lista) | A executar |
| CT-19 | Chamados | Abrir um chamado e ler as mensagens | Conversa em ordem cronológica, autor identificado | M | PM (lista) | A executar |
| CT-20 | Tarefas e prazos | Abrir Tarefas e Prazos | Prazos fiscais coerentes; atrasadas destacadas | M | PM (lista) | A executar |
| CT-21 | Auditoria | Abrir Segurança (Logs) | Registros com quem, o quê e quando | M | PM (lista) | A executar |

## Interface
| ID | Caso | Passos | Esperado | Prior. | Automação | Status |
|---|---|---|---|---|---|---|
| CT-22 | Celular (375 px) | Abrir a demo em tela estreita | Menu acessível, sem rolagem horizontal, textos legíveis | M | - | A executar |
| CT-23 | Sair do sistema | "Sair do Sistema" e tentar voltar | Volta à entrada; voltar no navegador não reabre área logada | A | - | A executar |

## Erros da API
| ID | Caso | Passos | Esperado | Prior. | Automação | Status |
|---|---|---|---|---|---|---|
| CT-24 | Rota inexistente | `GET /api/rota-que-nao-existe` | 404 em JSON (`{"error": …}`), como os outros erros | B | PM | **Falhou** (BUG-001), corrigido |
| CT-25 | Login com senha errada | `POST /api/auth/login` com dados falsos | 401 com mensagem em JSON | A | PM | Passou |
| CT-26 | Login com corpo vazio | `POST /api/auth/login` com `{}` | 400 com lista de campos inválidos | M | PM | Passou |

## Observações (não são bugs, mas valem registro)
- **OBS-01:** a página de DRE usa a rota `#/app/servicos` (nome herdado de outra tela). Funciona, mas o nome confunde quem lê a URL ou o código.
- **OBS-02:** o front-end envia `role` e `userEmail` na URL. A API ignora esses valores (CT-10 confirma), mas o ideal é nem enviá-los, para não sugerir que o perfil vem do navegador.
- **OBS-03:** o painel do perfil cliente devolve zeros (`200`), enquanto outros recursos devolvem 403. Pode ser intencional; vale confirmar com quem decide o produto.
