import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import nodemailer from 'nodemailer';

// Garante que a chave secreta existe
if (!process.env.JWT_SECRET) {
  throw new Error("ERRO CRÍTICO: JWT_SECRET não definido no .env");
}

// ====================
// VALIDADORES
// ====================
const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// ====================
// FUNÇÕES AUXILIARES
// ====================
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || "USER" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // Aumentei para 1 dia para facilitar o desenvolvimento
  );
}

function generateRefreshToken(userId) {
  return {
    token: uuidv4(),
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 dias
  };
}

// ====================
// REGISTRO
// ====================
export async function register(data) {
  // Validação
  const validated = registerSchema.parse(data);

  // Verifica duplicidade
  const emailExists = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (emailExists) throw new Error("Este e-mail já está em uso.");

  // Hash da senha
  const hashedPassword = await bcrypt.hash(validated.password, 10);

  // Cria usuário
  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
    },
  });

  // Retorna sem a senha
  return {
    message: "Usuário registrado com sucesso",
    user: { id: user.id, name: user.name, email: user.email },
  };
}

// ====================
// ESQUECI A SENHA (ENVIO REAL DE TESTE)
// ====================
export async function sendForgotPasswordEmail(email) {
  // 1. Verifica usuário
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuário não encontrado.");

  // 2. Gera um token simples (para simular o link real)
  // Num cenário real seria um JWT com expiração, aqui vamos simular
  const resetLink = `http://localhost:3001/reset-password?email=${email}&token=simulacao123`;

  // 3. FORÇA O LOG NO TERMINAL (Sem depender de envio real)
  console.error("\n=======================================================");
  console.error("📧 [SIMULAÇÃO DE EMAIL] PARA:", email);
  console.error("🔗 LINK DE RECUPERAÇÃO:", resetLink);
  console.error("=======================================================\n");
  
  if (!user) {
    console.log("❌ SERVICE: Usuário NÃO encontrado no banco!"); // <--- LOG DE ERRO
    throw new Error("Usuário não encontrado.");
  }

  console.log("✅ SERVICE: Usuário encontrado:", user.name); // <--- LOG DE SUCESSO
  console.log("⏳ SERVICE: Criando conta de teste no Ethereal...");
  // 1. Verifica se o usuário existe
  if (!user) throw new Error("Usuário não encontrado.");

  // 2. Cria uma conta de teste no Ethereal (Serviço fake de email)
  const testAccount = await nodemailer.createTestAccount();

  // 3. Configura o transportador (quem envia)
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // 4. Envia o email
  const info = await transporter.sendMail({
    from: '"BusinessFlow" <noreply@businessflow.com>', // Quem enviou
    to: email, // Para quem (o email do usuário)
    subject: "Recuperação de Senha - BusinessFlow", // Assunto
    text: `Olá ${user.name}, você solicitou a recuperação de senha.`, // Corpo texto
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Olá, ${user.name}!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha no <strong>BusinessFlow</strong>.</p>
        <p>Se foi você, clique no botão abaixo:</p>
        <a href="http://localhost:5173/reset-password" style="background: #3182ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
        <p>Se não foi você, ignore este email.</p>
      </div>
    `, // Corpo HTML bonito
  });

  // Mudei de console.log para console.error só para garantir que apareça agora
  console.error("\n=======================================================");
  console.error("📨 EMAIL ENVIADO COM SUCESSO!");
  console.error("🔗 LINK PARA VER O EMAIL:", nodemailer.getTestMessageUrl(info));
  console.error("=======================================================\n");

  return { message: "Email enviado com sucesso" };
}

// ====================
// LOGIN
// ====================
export async function login(data) {
  const validated = loginSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) throw new Error("E-mail ou senha inválidos.");

  const passwordMatch = await bcrypt.compare(validated.password, user.password);

  if (!passwordMatch) throw new Error("E-mail ou senha inválidos.");

  // Gera Tokens
  const accessToken = generateAccessToken(user);
  const refreshTokenData = generateRefreshToken(user.id);

  // Salva Refresh Token no Banco
  await prisma.refreshToken.create({
    data: refreshTokenData,
  });

  return {
    message: "Login realizado com sucesso",
    token: accessToken, // MANTIDO 'token' PARA COMPATIBILIDADE COM O FRONTEND
    refreshToken: refreshTokenData.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

// ====================
// REFRESH TOKEN
// ====================
export async function refreshToken(token) {
  if (!token) throw new Error("Refresh token não informado.");

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!stored) throw new Error("Refresh token inválido.");

  // Verifica expiração
  if (stored.expiresAt < new Date()) {
    // Opcional: deletar o token expirado
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new Error("Refresh token expirado. Faça login novamente.");
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
  });

  if (!user) throw new Error("Usuário não encontrado.");

  const newAccessToken = generateAccessToken(user);

  return {
    token: newAccessToken, // Padronizado como 'token'
  };
}

// ====================
// LOGOUT
// ====================
export async function logout(token) {
  if (!token) return;
  
  // Tenta deletar, se não achar, ignora erro (pode já ter sido deletado)
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
  } catch (err) {
    // Token já não existia, segue o jogo
  }
}

export async function resetPassword(email, token, newPassword) {
  // 1. Verifica se o token é válido (Na nossa simulação, aceitamos qualquer um para testar)
  // Num caso real, você verificaria se o token bate com o salvo no banco ou JWT
  if (!token || token !== 'simulacao123') {
     // Aqui você poderia validar um token real
     // throw new Error("Token inválido ou expirado.");
  }

  // 2. Criptografa a nova senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 3. Atualiza no banco
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { message: "Senha alterada com sucesso!" };
}