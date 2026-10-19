import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import prisma from "../src/config/prisma.js";
import app from "../src/app.js";

export { prisma };
export const api = () => request(app);

let counter = 0;
export const uniqueEmail = (prefix = "user") =>
  `${prefix}-${Date.now()}-${++counter}@teste.local`;

// Apaga tudo, na ordem que respeita as ligações entre as tabelas.
export async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
}

// Mesmo formato de token que o auth.service gera no login.
export function tokenFor(user, options = {}) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      companyAccessId: user.companyAccessId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h", ...options },
  );
}

export const authHeaders = (user, companyId) => ({
  Authorization: `Bearer ${tokenFor(user)}`,
  ...(companyId ? { "x-company-id": companyId } : {}),
});

export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      name: "Usuário de Teste",
      email: uniqueEmail(),
      password: await bcrypt.hash("senha123", 4),
      role: "ADMIN",
      ...overrides,
    },
  });
}

// Um escritório completo: gestor + empresa + um cliente cadastrado.
export async function createOffice(label) {
  const admin = await createUser({ name: `Gestor ${label}`, email: uniqueEmail(`gestor-${label}`) });
  const company = await prisma.company.create({
    data: { name: `Empresa ${label}`, userId: admin.id },
  });
  const client = await prisma.client.create({
    data: {
      fullName: `Cliente ${label}`,
      email: uniqueEmail(`cliente-${label}`),
      companyId: company.id,
    },
  });
  return { admin, company, client };
}

// Acesso de um cliente ao portal da empresa.
export async function createPortalUser(company, client) {
  return createUser({
    name: `Portal ${client.fullName}`,
    email: client.email,
    role: "CLIENT",
    companyAccessId: company.id,
    clientId: client.id,
  });
}

export function createTransaction(companyId, overrides = {}) {
  return prisma.transaction.create({
    data: {
      title: "Honorários",
      amount: 100,
      type: "ENTRADA",
      category: "Serviços",
      date: new Date(),
      companyId,
      ...overrides,
    },
  });
}
