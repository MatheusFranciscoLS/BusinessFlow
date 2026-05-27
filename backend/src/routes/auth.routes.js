import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 1. ROTA PÚBLICA DE LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(400).json({ error: "Credenciais inválidas." });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(400).json({ error: "Credenciais inválidas." });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "1d",
    });

    const refreshToken = "simulated-refresh-token-123";

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        agencyName: user.agencyName,
        role: user.role 
      },
      token,
      refreshToken
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// 2. CRIAR ACESSO DO CLIENTE
router.post("/client-account", authMiddleware, async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    if (!name || !email || !password || !companyId) return res.status(400).json({ error: "Preencha todos os campos." });

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ error: "Este e-mail já está em uso." });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "CLIENT", companyAccessId: companyId }
    });

    return res.status(201).json({ message: "Acesso criado com sucesso!" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar acesso." });
  }
});

// 🔥 3. NOVA ROTA: LISTAR QUEM TEM ACESSO À EMPRESA
router.get("/client-account/:companyId", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.params;
    const users = await prisma.user.findMany({
      where: { role: "CLIENT", companyAccessId: companyId },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar acessos." });
  }
});

// 🔥 4. NOVA ROTA: REVOGAR (EXCLUIR) O ACESSO
router.delete("/client-account/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "Acesso revogado com sucesso." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao revogar acesso." });
  }
});

export default router;