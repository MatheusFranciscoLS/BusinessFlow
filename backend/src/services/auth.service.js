import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "./email.service.js";

if (!process.env.JWT_SECRET) {
  throw new Error("ERRO CRÍTICO: JWT_SECRET não definido no .env");
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
  token: z.string().min(1, "Código de redefinição inválido"),
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// O token carrega a identidade do usuário e a empresa a que ele tem acesso.
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "USER",
      clientId: user.clientId,
      companyAccessId: user.companyAccessId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

function generateRefreshToken(userId) {
  return {
    token: uuidv4(),
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 dias
  };
}

// O cadastro de escritórios é fechado por padrão: só abre com ALLOW_PUBLIC_REGISTRATION=true.
export const isRegistrationOpen = () => process.env.ALLOW_PUBLIC_REGISTRATION === "true";

export async function register(data) {
  if (!isRegistrationOpen()) {
    throw Object.assign(new Error("O cadastro está fechado. Peça o seu acesso ao escritório."), { status: 403 });
  }

  const validated = registerSchema.parse(data);

  const emailExists = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (emailExists) throw new Error("Este e-mail já está em uso.");

  const hashedPassword = await bcrypt.hash(validated.password, 10);

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
    },
  });

  return {
    message: "Usuário registrado com sucesso",
    user: { id: user.id, name: user.name, email: user.email },
  };
}

export async function login(data) {
  const validated = loginSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) throw new Error("E-mail ou senha inválidos.");

  const passwordMatch = await bcrypt.compare(validated.password, user.password);

  if (!passwordMatch) throw new Error("E-mail ou senha inválidos.");

  const accessToken = generateAccessToken(user);
  const refreshTokenData = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: refreshTokenData,
  });

  return {
    message: "Login realizado com sucesso",
    token: accessToken,
    refreshToken: refreshTokenData.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      companyAccessId: user.companyAccessId,
    },
  };
}

export async function refreshToken(token) {
  if (!token) throw new Error("Refresh token não informado.");

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!stored) throw new Error("Refresh token inválido.");

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new Error("Refresh token expirado. Faça login novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
  });

  if (!user) throw new Error("Usuário não encontrado.");

  const newAccessToken = generateAccessToken(user);

  return { token: newAccessToken };
}

export async function logout(token) {
  if (!token) return;
  try {
    await prisma.refreshToken.delete({ where: { token } });
  } catch (err) {}
}

// Responde sempre igual, exista o e-mail ou não, para não revelar quem tem conta.
export async function sendForgotPasswordEmail(email) {
  const generic = {
    message: "Se o e-mail estiver cadastrado, enviamos o link de recuperação.",
  };
  if (typeof email !== "string" || !email) return generic;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return generic;

  const token = crypto.randomBytes(32).toString("hex");

  // Só o último pedido vale.
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  try {
    await sendPasswordResetEmail(user, token);
  } catch (err) {
    console.error("Erro ao enviar e-mail de recuperação:", err.message);
  }

  return generic;
}

export async function resetPassword(email, token, newPassword) {
  const data = resetPasswordSchema.parse({ email, token, newPassword });
  const invalid = new Error("Link de recuperação inválido ou expirado.");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(data.token) },
    include: { user: { select: { id: true, email: true } } },
  });

  if (
    !record ||
    record.usedAt ||
    record.expiresAt < new Date() ||
    record.user.email !== data.email
  ) {
    throw invalid;
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Quem estava logado com a senha antiga precisa entrar de novo.
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { message: "Senha alterada com sucesso!" };
}
