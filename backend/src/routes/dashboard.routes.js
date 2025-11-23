import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

// Rotas que já existiam
router.get("/summary", authMiddleware, dashboardController.getSummary);
router.get("/daily", authMiddleware, dashboardController.daily);
router.get("/monthly", authMiddleware, dashboardController.monthly);
router.get("/categories", authMiddleware, dashboardController.byCategory);
router.get("/top-clients", authMiddleware, dashboardController.topClients);
router.get("/recent", authMiddleware, dashboardController.recent); 
// ----------------------------------------------------

export default router;