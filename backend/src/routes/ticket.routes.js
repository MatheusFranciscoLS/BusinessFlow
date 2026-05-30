import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { PrismaClient } from "@prisma/client";

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
      return res.status(401).json({ error: "Utilizador não encontrado." });

    // Sobrescreve a URL com a verdade
    req.query.role = loggedUser.role;
    req.query.userEmail = loggedUser.email;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança da rota." });
  }
});

router.get("/unread-count", ticketController.getUnreadCount);
router.post("/", ticketController.create);
router.get("/", ticketController.getAll);
router.post("/:id/messages", ticketController.addMessage);
router.put("/:id/read", ticketController.markAsRead);
router.put("/:id/status", ticketController.updateStatus);

export default router;
