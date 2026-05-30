import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// 1. Aplica a segurança em TODAS as rotas do painel
router.use(authMiddleware);
router.use(companyMiddleware);

// 🔥 2. INTERCEPTOR ZERO TRUST (Prova de Balas)
router.use(async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;

    const loggedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!loggedUser)
      return res.status(401).json({ error: "Utilizador não encontrado." });

    // Gestores passam direto para ver a "Visão Geral"
    if (loggedUser.role !== "CLIENT") return next();

    // Clientes são filtrados rigorosamente pelo e-mail do banco
    const client = await prisma.client.findFirst({
      where: { email: loggedUser.email, companyId: req.companyId },
    });

    if (!client) {
      return res.json({
        entradas: 0,
        saidas: 0,
        saldo: 0,
        inadimplentes: [],
        distribuicao: [],
      });
    }

    req.query.clientId = client.id;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Falha de segurança ao carregar métricas." });
  }
});

router.get("/summary", dashboardController.getSummary);
router.get("/by-category", dashboardController.byCategory);
router.get("/daily", dashboardController.daily);
router.get("/monthly", dashboardController.monthly);
router.get("/top-clients", dashboardController.topClients);
router.get("/recent", dashboardController.recent);

export default router;
