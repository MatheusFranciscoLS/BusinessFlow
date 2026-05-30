import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json({ count: 0 });

    let where = { companyId };
    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId, email: userEmail },
      });
      if (!clientRecord) return res.json({ count: 0 });
      where = { companyId, clientId: clientRecord.id, hasUnreadClient: true };
    } else {
      where = { companyId, hasUnreadAdmin: true };
    }

    const count = await prisma.ticket.count({ where });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: "Erro." });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      subject,
      department,
      description,
      priority,
      clientId,
      companyId,
      role,
    } = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        department,
        description,
        priority,
        clientId,
        companyId,
        hasUnreadAdmin: role === "CLIENT",
        hasUnreadClient: role === "ADMIN",
      },
    });
    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(500).json({ error: "Erro." });
  }
});

// 🔥 BLINDAGEM DE SEGURANÇA TOTAL (Zero Trust)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json([]);

    let where = { companyId };

    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId, email: userEmail },
      });
      if (!clientRecord) return res.json([]); // Bloqueio total
      where.clientId = clientRecord.id;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: { client: true, messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Erro." });
  }
});

router.post("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, senderRole, senderName } = req.body;
    const newMessage = await prisma.ticketMessage.create({
      data: { message, senderRole, senderName, ticketId: id },
    });
    await prisma.ticket.update({
      where: { id },
      data: {
        hasUnreadAdmin: senderRole === "CLIENT",
        hasUnreadClient: senderRole === "ADMIN",
        status: senderRole === "CLIENT" ? "ABERTO" : "EM_ANDAMENTO",
      },
    });
    return res.status(201).json(newMessage);
  } catch (err) {
    return res.status(500).json({ error: "Erro." });
  }
});

router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    await prisma.ticket.update({
      where: { id: req.params.id },
      data:
        req.body.role === "CLIENT"
          ? { hasUnreadClient: false }
          : { hasUnreadAdmin: false },
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro." });
  }
});

router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status, priority } = req.body;
    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(priority && { priority }) },
    });
    return res.json(updatedTicket);
  } catch (err) {
    return res.status(500).json({ error: "Erro." });
  }
});

export default router;
