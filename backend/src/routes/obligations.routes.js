import { Router } from "express";
import * as obligationsController from "../controllers/obligations.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { requireManager } from "../middlewares/roles.js";

const router = Router();

// Calendário de obrigações é do gestor do escritório (dono, sócio e analista).
router.use(authMiddleware, requireManager, companyMiddleware);

router.get("/rules", obligationsController.rules);
router.post("/generate", obligationsController.generate);

export default router;
