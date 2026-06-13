import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

// Importamos a inteligência do Controller
import * as TaskController from "../controllers/task.controller.js";

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(companyMiddleware);

// 🔥 INTERCEPTOR ZERO TRUST
router.use(async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;
    const loggedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!loggedUser)
      return res.status(401).json({ error: "Utilizador inválido." });

    req.query.role = loggedUser.role;
    req.query.userEmail = loggedUser.email;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança da rota." });
  }
});

// Rotas limpas e apontadas ao Controller!
router.post("/", TaskController.createTask);
router.get("/", TaskController.getTasks);
router.get("/alerts", TaskController.getAlerts);
router.put("/:id", TaskController.updateTask);
router.delete("/:id", TaskController.deleteTask);
router.post("/auto-scan", TaskController.autoScan);

export default router;
