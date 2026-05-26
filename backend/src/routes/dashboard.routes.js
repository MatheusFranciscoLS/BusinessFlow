import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js"; // 🔥 O Segurança
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/summary",
  authMiddleware,
  companyMiddleware,
  dashboardController.getSummary,
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
  "/categories",
  authMiddleware,
  companyMiddleware,
  dashboardController.byCategory,
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
