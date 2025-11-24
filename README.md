<h1 align="center">
  BusinessFlow 🚀
</h1>

<p align="center">
  <strong>Plataforma SaaS Full Stack de Gestão Inteligente</strong>
</p>

<p align="center">
  <a href="#-sobre">Sobre</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-layout">Layout</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-como-rodar">Como Rodar</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/static/v1?label=license&message=MIT&color=3182ce&labelColor=1a202c">
  <img alt="React" src="https://img.shields.io/static/v1?label=frontend&message=React&color=3182ce&labelColor=1a202c">
  <img alt="Node" src="https://img.shields.io/static/v1?label=backend&message=Node.js&color=33cc95&labelColor=1a202c">
</p>

<br>

<div align="center">
  <img src="https://github.com/user-attachments/assets/ce77fd99-d429-48e5-b887-285d3a764090" alt="Dashboard BusinessFlow" width="100%">
</div>

---

## 💻 Sobre

O **BusinessFlow** é uma plataforma Full Stack projetada para facilitar a gestão de micro e pequenas empresas.  
Ele centraliza:

- **Gestão Financeira:** Controle de fluxo de caixa com relatórios.
- **CRM:** Gestão de clientes com histórico e tags.
- **Agenda:** Organização visual de compromissos.
- **Serviços:** Catálogo de produtos/serviços com precificação.

Tudo em um **painel moderno, responsivo e intuitivo**.

Este projeto demonstra domínio em arquitetura de software, integração entre frontend e backend, UX/UI e boas práticas de desenvolvimento.

---

## 🚀 Tecnologias

### **Frontend**
- React.js (Hooks, Context API)
- Styled Components (CSS-in-JS)
- Recharts (Gráficos interativos)
- Axios (Interceptors e tratamento de erros)
- React Hot Toast (Notificações)
- JSPDF + AutoTable (Geração de PDF)
- Lucide React (Ícones)

### **Backend**
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon.tech)
- JWT (Autenticação segura)
- Bcrypt (Hash de senha)
- Multer (Upload de arquivos)
- Zod (Validação de dados)

---

## 📸 Demonstração Visual

Uma visão geral das principais funcionalidades do sistema.

### 🔐 Tela de Login
<div align="center">
  <img src="https://github.com/user-attachments/assets/78dfd409-c374-4797-91e9-d5c741125919" width="100%">
</div>

### 📊 Dashboard & KPIs
<div align="center">
  <img src="https://github.com/user-attachments/assets/ce77fd99-d429-48e5-b887-285d3a764090" width="100%">
</div>

### 💰 Controle Financeiro (Entradas/Saídas)
<div align="center">
  <img src="https://github.com/user-attachments/assets/92e035fd-28f2-4ed6-8a45-ddd30177ff1a" width="100%">
</div>

### 📅 Agenda Inteligente
<div align="center">
  <img src="https://github.com/user-attachments/assets/25b14f10-f135-4e58-92c0-018a2b51e90c" width="100%">
</div>

### 🛠️ Catálogo de Serviços
<div align="center">
  <img src="https://github.com/user-attachments/assets/80f36548-c2c4-4dc0-b5a1-beca62376e53" width="100%">
</div>

### 👥 Gestão de Clientes
<div align="center">
  <img src="https://github.com/user-attachments/assets/e998500b-87ca-4235-aebb-ada5fa6afde0" width="100%">
</div>

### 📄 Relatórios em PDF
<div style="display: flex; justify-content: center; gap: 20px;">
  <img src="https://github.com/user-attachments/assets/5f28c81b-ce6c-453a-a47e-011bfa6f9134" width="45%">
  <img src="https://github.com/user-attachments/assets/70939222-0d5f-45ee-831c-2e5d670adcee" width="45%">
</div>

---

## 🔧 Como Rodar

### Pré-requisitos
- Node.js instalado
- PostgreSQL rodando

```bash
# 1. Clone o repositório
git clone [https://github.com/MatheusFranciscoLS/BusinessFlow.git](https://github.com/MatheusFranciscoLS/BusinessFlow.git)
cd BusinessFlow

# 2. Configurando o Backend
cd backend
npm install

# Crie o arquivo .env na pasta backend com suas credenciais:
# DATABASE_URL="..."
# JWT_SECRET="..."

# Execute migrações e seed
npx prisma migrate dev
npx prisma db seed

# Inicie o servidor backend
npm run dev

# 3. Configurando o Frontend
cd ../frontend
npm install
npm start

--- 

## 🔑 Acesso ao Sistema
O seed cria automaticamente um usuário administrador:

E-mail: admin@admin.com

Senha: 123456

## 📝 Licença
Este projeto está sob a licença MIT.