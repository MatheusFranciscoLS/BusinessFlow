import { Router } from "express";
import * as reconciliationController from "../controllers/reconciliation.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireManager } from "../middlewares/roles.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

// Conciliação é trabalho do gestor do escritório.
router.use(authMiddleware, requireManager, companyMiddleware);

router.post("/suggest", reconciliationController.suggest);
router.post("/confirm", reconciliationController.confirm);
router.post("/from-bank", reconciliationController.createFromBank);
router.post("/undo", reconciliationController.undo);

export default router;
