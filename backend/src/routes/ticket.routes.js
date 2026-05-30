import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

router.get(
  "/unread-count",
  authMiddleware,
  companyMiddleware,
  ticketController.getUnreadCount,
);
router.post("/", authMiddleware, companyMiddleware, ticketController.create);
router.get("/", authMiddleware, companyMiddleware, ticketController.getAll);
router.post(
  "/:id/messages",
  authMiddleware,
  companyMiddleware,
  ticketController.addMessage,
);
router.put(
  "/:id/read",
  authMiddleware,
  companyMiddleware,
  ticketController.markAsRead,
);
router.put(
  "/:id/status",
  authMiddleware,
  companyMiddleware,
  ticketController.updateStatus,
);

export default router;
