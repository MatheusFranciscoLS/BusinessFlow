<h1 align="center">
  BusinessFlow 🚀
</h1>

<p align="center">
  <strong>Plataforma SaaS Full Stack de Gestão Inteligente</strong>
</p>

<p align="center">
  <a href="https://flowbusiness.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🟢_Acessar_Plataforma-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy na Vercel" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/MatheusFranciscoLS/BusinessFlow/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/MatheusFranciscoLS/BusinessFlow/actions/workflows/ci.yml/badge.svg">
  </a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/static/v1?label=frontend&message=React&color=3182ce&labelColor=1a202c">
  <img alt="Node" src="https://img.shields.io/static/v1?label=backend&message=Node.js&color=33cc95&labelColor=1a202c">
  <img alt="Prisma" src="https://img.shields.io/static/v1?label=ORM&message=Prisma&color=1B222D&labelColor=1a202c">
  <img alt="PostgreSQL" src="https://img.shields.io/static/v1?label=Database&message=PostgreSQL&color=316192&labelColor=1a202c">
</p>

<br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/ce77fd99-d429-48e5-b887-285d3a764090" alt="Dashboard BusinessFlow" width="100%">
</div>

---

## 💻 Sobre

O **BusinessFlow** é uma plataforma Full Stack projetada para facilitar a gestão de micro e pequenas empresas, substituindo planilhas desorganizadas por um painel moderno e unificado.

Ele centraliza:
- **Gestão Financeira:** Controle de fluxo de caixa com relatórios e validações.
- **CRM:** Gestão de clientes com histórico e categorização via tags.
- **Agenda:** Organização visual e inteligente de compromissos.
- **Serviços:** Catálogo de produtos/serviços com precificação.

Este projeto demonstra domínio na construção de **arquiteturas SaaS**, integração ponta a ponta, segurança com JWT e validação estrita de dados no backend.

---

## 🚀 Stack de Tecnologia

### **Frontend**
- **React.js** com Hooks e Context API
- **Styled Components** (CSS-in-JS)
- **Recharts** (Gráficos interativos e Dashboards)
- **Axios** (Interceptors HTTP e tratamento centralizado de erros)
- **JSPDF + AutoTable** (Geração de relatórios em PDF)

### **Backend**
- **Node.js + Express**
- **Prisma ORM** (Modelagem de dados e tipagem)
- **PostgreSQL** (Hospedado na Neon.tech)
- **JWT & Bcrypt** (Autenticação e segurança de senhas)
- **Zod** (Validação de schemas e regras de negócio)

---

## 🧭 O que o sistema faz

- **Financeiro:** lançamentos, faturas pendentes e atrasadas, e DRE. Uma rotina diária (meia-noite e um) marca como atrasadas as faturas pendentes vencidas.
- **Importação de extrato bancário** no formato OFX, e relatórios em PDF gerados no navegador.
- **CRM:** clientes por empresa, com status e documentos (upload de arquivos).
- **Agenda e tarefas** por cliente e por empresa.
- **Helpdesk:** chamados com troca de mensagens entre o escritório e o cliente.
- **Auditoria:** registro de quem fez o quê (criar, alterar, excluir) em cada módulo.
- **API pública com chave** (`x-api-key`), para integrações que precisam listar dados da empresa.
- **Dois perfis de acesso:** o gestor (ADMIN) e o cliente (CLIENT), que só enxerga o que é da sua empresa.

---

## ⚙️ Como rodar localmente

Pré-requisitos: Node.js 18 ou mais novo e um banco PostgreSQL (local ou na nuvem).

### 1. Back-end

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/businessflow"
JWT_SECRET="troque-por-uma-chave-longa-e-aleatoria"
PORT=3001
# Opcional, só para o envio de e-mails:
EMAIL_USER=""
EMAIL_PASS=""
```

Crie as tabelas, carregue os dados de exemplo e inicie:

```bash
npx prisma db push
npx prisma db seed
npm run dev
```

A API sobe em `http://localhost:3001/api`. O `seed` cria um gestor, uma empresa e clientes de exemplo (veja `backend/prisma/seed.js`). **Use só em ambiente local e troque as credenciais de exemplo se publicar o projeto.**

### 2. Front-end

```bash
cd frontend
npm install
npm start
```

O painel abre em `http://localhost:3000` e fala com a API em `http://localhost:3001/api`. Para apontar para outra API, defina `REACT_APP_API_URL`.

---

## 🧠 Decisões técnicas

| Decisão | Por quê |
| :--- | :--- |
| **Cada dado pertence a uma empresa** (`companyId` em clientes, faturas, documentos, tarefas, chamados e auditoria) | Um escritório nunca vê os dados de outro. O middleware de empresa restringe o perfil CLIENT ao que é dele. |
| **JWT de acesso + refresh token guardado no banco** | Dá para encerrar sessões e renovar o acesso sem pedir a senha de novo. |
| **Camadas de segurança na API:** `helmet`, limite de 300 requisições por 15 minutos, CORS restrito ao front-end e `nosniff` na pasta de uploads | Reduz abuso, ataques simples e arquivos disfarçados. |
| **Validação das entradas com Zod** (autenticação) | Recusa dados malformados antes de chegarem ao banco. |
| **Log de auditoria que grava o nome e o perfil de quem agiu** (não só o id) | O histórico continua legível mesmo se o usuário for apagado. |
| **Prisma + PostgreSQL** | Modelo de dados tipado, relações com exclusão em cascata e consultas seguras. |
| **API pública separada, protegida por chave** | Integrações recebem só o necessário (por exemplo, nome, documento e e-mail de clientes ativos). |

---

## 🗺️ Modelo de dados

```mermaid
erDiagram
    User ||--o{ Company : "possui"
    User ||--o{ RefreshToken : "tem"
    Company ||--o{ Client : "atende"
    Company ||--o{ Transaction : "registra"
    Company ||--o{ Document : "guarda"
    Company ||--o{ Task : "organiza"
    Company ||--o{ Ticket : "recebe"
    Company ||--o{ AuditLog : "audita"
    Company ||--o{ ApiKey : "emite"
    Client ||--o{ Transaction : "gera"
    Client ||--o{ Document : "tem"
    Client ||--o{ Task : "tem"
    Client ||--o{ Ticket : "abre"
    Client ||--o{ User : "acessa por"
    Ticket ||--o{ TicketMessage : "contém"
```

---

## ✅ Testes

O back-end tem testes automatizados que rodam **contra um PostgreSQL de verdade** (não um banco de mentira), porque o ponto mais importante do sistema é o isolamento entre empresas e isso só se prova com o banco real. O GitHub Actions roda tudo a cada push e pull request (`.github/workflows/ci.yml`), e também confere que o painel React compila.

**O que está coberto**

| Área | O que os testes garantem |
| :--- | :--- |
| Autenticação | Cadastro e login, senha criptografada e nunca devolvida, mesma resposta para e-mail desconhecido e senha errada, renovação e encerramento de sessão, token ausente, vencido ou com assinatura errada |
| Acesso por perfil | Gestor só entra na empresa dele; perfil CLIENT fica preso à própria empresa e não entra no CRM nem na auditoria |
| Isolamento entre empresas | Uma empresa não lê, altera nem apaga clientes, lançamentos, chaves de API ou empresas de outra |
| API pública | Exige chave, recusa chave inexistente ou revogada, devolve só clientes ativos e só os campos combinados |
| Regras de negócio | Parcelamento, filtro por mês, paginação, resumo do painel, exclusão em cascata e trilha de auditoria |

**Como rodar**

Use um banco **só de testes** (o nome precisa ter `test`; os testes apagam os dados e se recusam a rodar em outro banco):

```bash
cd backend
export DATABASE_URL="postgresql://usuario:senha@localhost:5432/businessflow_test"
npx prisma db push
npm test
```

---

## 🔭 Próximos passos

Pontos que eu melhoraria, olhando o código hoje:

- **Ampliar os testes** para tarefas, chamados, documentos e importação OFX, e criar testes do front-end.
- **Migrações versionadas do Prisma** no lugar do `db push`, para controlar as mudanças do banco com histórico.
- **Origens permitidas do CORS por variável de ambiente**, em vez de listadas no código.
- **Uma só biblioteca de hash de senha** (hoje há duas instaladas) e senhas de exemplo geradas, não fixas, no `seed`.

---

## 📸 Telas da Aplicação

### 🔐 Tela de Login
<div align="center">
  <img src="https://github.com/user-attachments/assets/78dfd409-c374-4797-91e9-d5c741125919" width="100%">
</div>

### 📊 Dashboard & KPIs
<div align="center">
  <img src="https://github.com/user-attachments/assets/ce77fd99-d429-48e5-b887-285d3a764090" width="100%">
</div>
