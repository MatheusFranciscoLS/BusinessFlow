import { Router } from "express";
import * as privacyController from "../controllers/privacy.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// Qualquer pessoa logada, sobre os próprios dados.
router.use(authMiddleware);

router.get("/export", privacyController.exportData);
router.get("/terms", privacyController.termsStatus);
router.post("/terms/accept", privacyController.acceptTerms);
router.delete("/account", privacyController.revokeOwnAccess);

export default router;
