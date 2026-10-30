import { Router } from "express";
import prisma from "../config/prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { requireManager } from "../middlewares/roles.js";

// Importamos a inteligência do Controller
import * as TaskController from "../controllers/task.controller.js";

const router = Router();

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
// Cliente do portal só consulta; criar, alterar e apagar tarefas é do gestor.
router.get("/", TaskController.getTasks);
router.get("/alerts", TaskController.getAlerts);
router.post("/", requireManager, TaskController.createTask);
router.put("/:id", requireManager, TaskController.updateTask);
router.delete("/:id", requireManager, TaskController.deleteTask);
router.post("/auto-scan", requireManager, TaskController.autoScan);

export default router;
