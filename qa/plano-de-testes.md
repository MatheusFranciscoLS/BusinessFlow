# Plano de testes: BusinessFlow (demonstração pública)

## 1. Objetivo
Verificar que a demonstração do BusinessFlow funciona como prometido: entra sem senha, mostra dados coerentes, respeita permissões por perfil e **não altera nada** (somente leitura).

## 2. Escopo
**Dentro:** entrada na demonstração (gestor e cliente), painel, clientes, financeiro e DRE, documentos, chamados, tarefas, auditoria, permissões por perfil, respostas de erro da API.
**Fora:** criar, editar e excluir dados (a demonstração bloqueia; isso é coberto pelos ~25 arquivos de teste do back-end, que rodam no CI contra PostgreSQL), envio de e-mails, desempenho sob carga.

## 3. Ambientes
| Ambiente | Endereço | Observação |
|---|---|---|
| Front-end | https://flowbusiness.vercel.app | Vercel |
| API | https://businessflow-api.onrender.com | Hospedagem gratuita: 1ª chamada pode levar ~1 min |
| Navegadores | Edge/Chrome atuais; celular via emulação | |

## 4. Estratégia
| Tipo | Como | Onde |
|---|---|---|
| Manual exploratório | Percorrer cada módulo como gestor e como cliente, anotando o que parece estranho | `casos-de-teste.md` |
| API | Coleção Postman com verificações automáticas (status, formato, regra de negócio) | `postman/` |
| E2E | Playwright nos 3 fluxos mais importantes | `e2e/` |
| Regressão | Cada bug corrigido ganha um teste que o pegaria de novo | `backend/tests/` |

## 5. Riscos e prioridades
| Risco | Impacto | Cobertura |
|---|---|---|
| Cliente ver dados de outro cliente ou do escritório | Alto (privacidade) | CT-06 a CT-10, Postman pasta 3 |
| Demonstração gravar dados | Alto (a demo é pública) | CT-05, Postman |
| Servidor "dormindo" e a demo parecer quebrada | Médio (primeira impressão) | CT-02 |
| Valores financeiros incoerentes (saldo ≠ entradas − saídas) | Alto | CT-11, Postman |
| Erros da API fora do padrão (HTML em vez de JSON) | Baixo/médio | CT-24, BUG-001 |

## 6. Critérios
**Entrada:** demonstração no ar e API respondendo em `/api/auth/config`.
**Saída:** casos de prioridade Alta executados sem falha aberta; bugs conhecidos documentados com severidade; coleção Postman sem falhas inesperadas.

## 7. Severidade e prioridade
- **Severidade** = tamanho do estrago (Crítica: vaza dados ou grava na demo; Alta: função principal quebrada; Média: função secundária ou contorno fácil; Baixa: cosmético ou padrão).
- **Prioridade** = urgência de corrigir (Alta/Média/Baixa), definida com quem decide o produto.

## 8. Ferramentas
Postman/Newman, Playwright, DevTools do navegador, Git/GitHub (relatos como arquivos Markdown versionados; em um time real, Jira).
