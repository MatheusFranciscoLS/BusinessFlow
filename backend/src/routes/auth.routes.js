import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireManager } from "../middlewares/roles.js";
import prisma from "../config/prisma.js";

const router = Router();

// Limite mais apertado nas rotas que testam senha ou disparam e-mail.
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
});

router.get("/config", authController.publicConfig);
router.post("/login", sensitiveLimiter, authController.login);
// Limite maior: uma apresentação para uma turma sai quase toda do mesmo IP.
const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Muitas entradas na demonstração. Tente novamente em 15 minutos." },
});
router.post("/demo-login", demoLimiter, authController.demoLogin);
router.post("/register", sensitiveLimiter, authController.register);
router.post("/forgot-password", sensitiveLimiter, authController.forgotPassword);
router.post("/reset-password", sensitiveLimiter, authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

// =========================================================
// GESTÃO DE ACESSOS DO PORTAL DO CLIENTE
// Só o gestor dono da empresa mexe nos acessos dela.
// =========================================================
const clientAccountSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  companyId: z.string().min(1, "Empresa não informada"),
});

const ownsCompany = (userId, companyId) =>
  prisma.company.count({ where: { id: companyId, userId } });

router.use("/client-account", authMiddleware, requireManager);

router.post("/client-account", async (req, res) => {
  try {
    const parsed = clientAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: parsed.error.issues.map((issue) => issue.message),
      });
    }
    const { name, email, password, companyId } = parsed.data;

    if (!(await ownsCompany(req.user.id, companyId))) {
      return res.status(403).json({ error: "Acesso negado a esta empresa." });
    }

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
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(201).json(clientUser);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar acesso." });
  }
});

router.get("/client-account/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!(await ownsCompany(req.user.id, companyId))) {
      return res.status(403).json({ error: "Acesso negado a esta empresa." });
    }

    const clients = await prisma.user.findMany({
      where: { companyAccessId: companyId, role: "CLIENT" },
      select: { id: true, name: true, email: true },
    });
    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar acessos." });
  }
});

router.delete("/client-account/:userId", async (req, res) => {
  try {
    const access = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        role: "CLIENT",
        companyAccessId: { not: null },
      },
      select: { id: true, companyAccessId: true },
    });

    if (
      !access ||
      !(await ownsCompany(req.user.id, access.companyAccessId))
    ) {
      return res.status(404).json({ error: "Acesso não encontrado." });
    }

    await prisma.user.delete({ where: { id: access.id } });
    return res.json({ message: "Acesso revogado." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao revogar acesso." });
  }
});

export default router;
