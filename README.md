<h1 align="center">
  BusinessFlow 🚀
</h1>

<p align="center">
  <strong>Plataforma SaaS de Gestão Inteligente para Pequenos Negócios</strong>
</p>

<p align="center">
  <a href="#-sobre">Sobre</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-layout">Layout</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-demonstracao-visual">Demonstração Visual</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-como-rodar">Como Rodar</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/static/v1?label=license&message=MIT&color=3182ce&labelColor=1a202c">
  <img alt="React" src="https://img.shields.io/static/v1?label=frontend&message=React&color=3182ce&labelColor=1a202c">
  <img alt="Node" src="https://img.shields.io/static/v1?label=backend&message=Node.js&color=33cc95&labelColor=1a202c">
</p>

<br>

<div align="center">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/dashboard.png" alt="Dashboard BusinessFlow" width="100%">
</div>

---

## 💻 Sobre

O **BusinessFlow** é uma plataforma Full Stack projetada para facilitar a gestão de micro e pequenas empresas.  
Ele centraliza:

- Controle financeiro  
- Relacionamento com clientes (CRM)  
- Agenda de compromissos  
- Catálogo de serviços  

Tudo em um **painel moderno, responsivo e intuitivo**.

Este projeto demonstra domínio em arquitetura de software, integração entre frontend e backend, UX/UI e boas práticas de desenvolvimento.

---

## 🚀 Tecnologias

### **Frontend**
- React.js (Hooks, Context API)
- Styled Components (CSS-in-JS)
- Recharts
- Axios (Interceptors)
- React Hot Toast
- JSPDF + AutoTable
- Lucide React

### **Backend**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT
- Bcrypt
- Multer
- Zod

---

## ✨ Funcionalidades

### 📊 Dashboard Inteligente
- Entradas, saídas e saldo
- Gráfico anual interativo
- Top 5 clientes
- Histórico em tempo real

### 💰 Gestão Financeira
- Cadastro de entradas e saídas
- Filtros avançados
- Cores automáticas
- Exportação em PDF

### 👥 CRM de Clientes
- Busca automática de CEP (BrasilAPI)
- Tags coloridas
- Máscaras automáticas

### 📅 Agenda & Serviços
- Timeline
- Status (pendente, concluído, cancelado)
- Catálogo com imagens e preços

---

## 📸 Demonstração Visual

Uma prévia das principais telas do sistema BusinessFlow.

### 🔐 Tela de Login
<div align="center">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/login.png" width="100%">
</div>

### 👥 Clientes
<div align="center">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/clientes.png" width="100%">
</div>

### 🛠️ Serviços
<div align="center">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/servicos.png" width="100%">
</div>

### 📅 Agenda
<div align="center">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/agenda.png" width="100%">
</div>

### 💰 Financeiro
<div align="center">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/financeiro.png" width="100%">
</div>

### 📄 Relatórios PDF
<div style="display: flex; justify-content: space-between;">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/relatorio-financeiro.png" width="48%">
  <img src="https://raw.githubusercontent.com/MatheusFranciscoLS/BusinessFlow/main/screenshots/relatorio-clientes.png" width="48%">
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

# Crie o arquivo .env na pasta backend com suas credenciais do banco e JWT

# Execute migrações e seed
npx prisma migrate dev
npx prisma db seed

# Inicie o servidor backend
npm run dev

# 3. Configurando o Frontend
cd ../frontend
npm install
npm start

## 🔑 Acesso ao Sistema
O seed cria automaticamente um usuário administrador:

E-mail: admin@admin.com

Senha: 123456

## 📝 Licença
Este projeto está sob a licença MIT.