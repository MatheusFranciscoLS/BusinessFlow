import { Router } from "express";
import * as apiKeyController from "../controllers/apiKey.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

// Apenas usuários logados e pertencentes a uma empresa podem gerir chaves
router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", apiKeyController.createKey);
router.get("/", apiKeyController.listKeys);
router.delete("/:id", apiKeyController.revokeKey);

export default router;