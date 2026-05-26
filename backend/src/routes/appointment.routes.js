import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js"; // 🔥 O Segurança
import * as controller from "../controllers/appointment.controller.js";

const router = Router();

router.post("/", authMiddleware, companyMiddleware, controller.create);
router.get("/", authMiddleware, companyMiddleware, controller.getAll);
router.get("/:id", authMiddleware, companyMiddleware, controller.getById);
router.put("/:id", authMiddleware, companyMiddleware, controller.update);
router.delete("/:id", authMiddleware, companyMiddleware, controller.remove);

export default router;
