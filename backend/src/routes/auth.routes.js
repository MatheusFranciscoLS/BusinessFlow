import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

// =========================================================
// 🔒 ROTAS DE AUTENTICAÇÃO LIMPAS (Padrão MVC)
// =========================================================

// Agora as rotas chamam o Controller (que faz as validações do Zod e chama o Service)
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// =========================================================
// 🏢 GESTÃO DE ACESSOS DO PORTAL DO CLIENTE
// =========================================================
router.post("/client-account", authMiddleware, async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists)
      return res.status(400).json({ error: "E-mail já tem acesso." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
        companyAccessId: companyId,
      },
    });
    return res.status(201).json(clientUser);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar acesso." });
  }
});

router.get("/client-account/:companyId", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.params;
    const clients = await prisma.user.findMany({
      where: { companyAccessId: companyId, role: "CLIENT" },
      select: { id: true, name: true, email: true },
    });
    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar acessos." });
  }
});

router.delete("/client-account/:userId", authMiddleware, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.userId } });
    return res.json({ message: "Acesso revogado." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao revogar acesso." });
  }
});

export default router;
