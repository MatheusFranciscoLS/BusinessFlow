import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/auth.js"; // 🔥 Importamos o segurança

const router = Router();
const prisma = new PrismaClient();

// ROTA PÚBLICA DE LOGIN (A sua rota atual)
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

    // Gera um refreshToken falso/simples apenas para manter a estrutura do seu Front-end a funcionar
    const refreshToken = "simulated-refresh-token-123";

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        agencyName: user.agencyName,
        role: user.role // 🔥 Agora o Front-end sabe se é ADMIN ou CLIENT
      },
      token,
      refreshToken
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// 🔥 NOVA ROTA PROTEGIDA: O CONTADOR GERA O LOGIN DO CLIENTE
router.post("/client-account", authMiddleware, async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    if (!name || !email || !password || !companyId) {
      return res.status(400).json({ error: "Preencha todos os campos." });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ error: "Este e-mail já está em uso." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const clientUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT", // Garante que ele é restrito!
        companyAccessId: companyId
      }
    });

    return res.status(201).json({ message: "Acesso criado com sucesso!" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar acesso." });
  }
});

export default router;