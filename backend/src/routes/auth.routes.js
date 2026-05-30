import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// ---------------------------------------------------------
// 1. LOGIN (Com mensagens de erro detalhadas)
// ---------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica se preencheu tudo
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Por favor, preencha o e-mail e a senha." });
    }

    // Procura o utilizador
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ error: "E-mail não encontrado no nosso sistema." });
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Senha incorreta. Tente novamente." });
    }

    // Gera o Token de Segurança
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_businessflow",
      { expiresIn: "7d" },
    );

    // Esconde a senha antes de enviar os dados para o Front-end
    const { password: _, ...userWithoutPassword } = user;

    return res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// ---------------------------------------------------------
// 2. REGISTRO (Cria a Agência de Contabilidade)
// ---------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, agencyName } = req.body;

    if (!name || !email || !password || !agencyName) {
      return res
        .status(400)
        .json({ error: "Preencha todos os campos obrigatórios." });
    }

    // Verifica se o e-mail já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .json({ error: "Este e-mail já está em uso por outro escritório." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o Utilizador e a Primeira Empresa dele de uma só vez!
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        agencyName,
        role: "ADMIN",
        companies: {
          create: {
            name: agencyName, // Cria a empresa com o nome da Agência
          },
        },
      },
    });

    return res
      .status(201)
      .json({ message: "Escritório registado com sucesso!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erro ao criar a conta do escritório." });
  }
});

// ---------------------------------------------------------
// 3. RECUPERAÇÃO DE SENHA (Mockup Funcional)
// ---------------------------------------------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ error: "Usuário não encontrado." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return res.json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao redefinir a senha." });
  }
});

// ---------------------------------------------------------
// 4. GESTÃO DE ACESSOS DO PORTAL DO CLIENTE
// ---------------------------------------------------------
router.post("/client-account", authMiddleware, async (req, res) => { // 🔥 TRAVADO
  try {
    const { name, email, password, companyId } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ error: "E-mail já tem acesso." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "CLIENT", companyAccessId: companyId },
    });
    return res.status(201).json(clientUser);
  } catch (error) { return res.status(500).json({ error: "Erro." }); }
});

router.get("/client-account/:companyId", authMiddleware, async (req, res) => { // 🔥 TRAVADO
  try {
    const { companyId } = req.params;
    const clients = await prisma.user.findMany({
      where: { companyAccessId: companyId, role: "CLIENT" },
      select: { id: true, name: true, email: true },
    });
    return res.json(clients);
  } catch (error) { return res.status(500).json({ error: "Erro." }); }
});

router.delete("/client-account/:userId", authMiddleware, async (req, res) => { // 🔥 TRAVADO
  try {
    await prisma.user.delete({ where: { id: req.params.userId } });
    return res.json({ message: "Acesso revogado." });
  } catch (error) { return res.status(500).json({ error: "Erro." }); }
});

export default router;