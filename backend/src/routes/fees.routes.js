import { Router } from "express";
import * as feesController from "../controllers/fees.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireManager } from "../middlewares/roles.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

// Honorários e inadimplência são do gestor do escritório.
router.use(authMiddleware, requireManager, companyMiddleware);

router.post("/generate", feesController.generate);
router.get("/overdue", feesController.overdue);
router.post("/sync-status", feesController.syncStatus);

export default router;
