import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

if (!process.env.JWT_SECRET) {
  throw new Error("ERRO CRÍTICO: JWT_SECRET não definido no .env");
}

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// 🔥 MUDANÇA 1: O Token agora carrega a Identidade Blindada do Cliente
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "USER",
      clientId: user.clientId, // O Elo Físico inquebrável
      companyAccessId: user.companyAccessId, // A Empresa que ele tem acesso
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

export async function register(data) {
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

  // 🔥 MUDANÇA 2: Devolver os IDs também para o Front-end usar na interface
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

export async function sendForgotPasswordEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuário não encontrado.");

  // 🔥 Substituímos o "Ethereal" (falso) pelo seu Servidor Real (Gmail)
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const tokenDeSeguranca = "chaveultraseguraparajwt";
  
  const resetLink = `https://flowbusiness.vercel.app/#/reset-password?email=${encodeURIComponent(email)}&token=${tokenDeSeguranca}`;

  await transporter.sendMail({
    from: `"BusinessFlow Segurança" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Recuperação de Senha - BusinessFlow",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #2d3748; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #3182ce; margin-top: 0;">Olá, ${user.name}!</h2>
        <p>Recebemos uma solicitação para redefinir a sua senha de acesso à plataforma.</p>
        <p>Clique no botão abaixo para escolher uma nova senha segura:</p>
        <a href="${resetLink}" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px; font-weight: bold;">Redefinir Minha Senha</a>
        <p style="margin-top: 32px; font-size: 12px; color: #a0aec0;">Se não pediu esta alteração, ignore este e-mail.</p>
      </div>
    `,
  });

  return { message: "Email de recuperação enviado com sucesso!" };
}

export async function resetPassword(email, token, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  return { message: "Senha alterada com sucesso!" };
}
