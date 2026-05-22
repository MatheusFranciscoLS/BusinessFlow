import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import nodemailer from 'nodemailer';

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

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || "USER" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } 
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

  return {
    message: "Login realizado com sucesso",
    token: accessToken, 
    refreshToken: refreshTokenData.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"BusinessFlow" <noreply@businessflow.com>', 
    to: email, 
    subject: "Recuperação de Senha - BusinessFlow", 
    text: `Olá ${user.name}, acesse http://localhost:5173/reset-password para redefinir sua senha.`, 
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Olá, ${user.name}!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha no painel administrativo.</p>
        <p>Clique no botão abaixo para prosseguir:</p>
        <a href="http://localhost:5173/reset-password" style="background: #3182ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Redefinir Senha</a>
      </div>
    `,
  });

  console.log("🔗 Caixa de Entrada de Teste Ethereal disponível em:", nodemailer.getTestMessageUrl(info));
  return { message: "Email enviado com sucesso" };
}

export async function resetPassword(email, token, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  return { message: "Senha alterada com sucesso!" };
}