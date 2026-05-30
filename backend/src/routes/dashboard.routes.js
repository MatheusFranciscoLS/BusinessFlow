import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// 🔥 INTERCEPTOR DE SEGURANÇA MÁXIMA PARA O DASHBOARD
router.use(async (req, res, next) => {
  try {
    const { role, userEmail, companyId } = req.query;

    // Se for Administrador (Escritório), está autorizado a ver os dados consolidados
    if (role !== "CLIENT") return next();

    // Se for Cliente, localiza o ID do dossiê dele no CRM pelo e-mail
    const client = await prisma.client.findFirst({
      where: { email: userEmail, companyId: companyId },
    });

    if (!client)
      return res.json({
        entradas: 0,
        saidas: 0,
        saldo: 0,
        inadimplentes: [],
        distribuicao: [],
      });

    // Injeta de forma oculta o ID do cliente na requisição
    req.query.clientId = client.id;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança do painel." });
  }
});

// Rotas protegidas e monitorizadas
router.get(
  "/summary",
  authMiddleware,
  companyMiddleware,
  dashboardController.getSummary,
);
router.get(
  "/by-category",
  authMiddleware,
  companyMiddleware,
  dashboardController.byCategory,
);
router.get(
  "/daily",
  authMiddleware,
  companyMiddleware,
  dashboardController.daily,
);
router.get(
  "/monthly",
  authMiddleware,
  companyMiddleware,
  dashboardController.monthly,
);
router.get(
  "/top-clients",
  authMiddleware,
  companyMiddleware,
  dashboardController.topClients,
);
router.get(
  "/recent",
  authMiddleware,
  companyMiddleware,
  dashboardController.recent,
);

export default router;
