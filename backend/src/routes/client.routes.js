import { Router } from "express";
import * as clientController from "../controllers/client.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js"; // 🔥 O novo Segurança!

const router = Router();

// Todas as rotas agora exigem o ID da empresa
router.post("/", authMiddleware, companyMiddleware, clientController.create);
router.get("/", authMiddleware, companyMiddleware, clientController.getAll);
router.get("/:id", authMiddleware, companyMiddleware, clientController.getById);
router.put("/:id", authMiddleware, companyMiddleware, clientController.update);
router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  clientController.remove,
);

export default router;
