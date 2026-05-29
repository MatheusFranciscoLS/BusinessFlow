import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 🔥 NOVA ROTA: Contar chamados com mensagens não lidas (Para o Menu Lateral)
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const { companyId, clientId, role } = req.query;
    if (!companyId) return res.json({ count: 0 });

    const where =
      role === "CLIENT"
        ? { companyId, clientId, hasUnreadClient: true }
        : { companyId, hasUnreadAdmin: true };

    const count = await prisma.ticket.count({ where });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar notificações." });
  }
});

// 1. Criar um Novo Chamado
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

    // Se o cliente abrir, acende a notificação do Escritório. E vice-versa.
    const hasUnreadAdmin = role === "CLIENT";
    const hasUnreadClient = role === "ADMIN";

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        department,
        description,
        priority,
        clientId,
        companyId,
        hasUnreadAdmin,
        hasUnreadClient,
      },
    });
    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao abrir chamado." });
  }
});

// 2. Listar Chamados
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, clientId } = req.query;
    const where = clientId ? { companyId, clientId } : { companyId };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" }, // Mostra os que tiveram respostas mais recentes no topo
    });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar chamados." });
  }
});

// 3. Adicionar Nova Mensagem ao Chat
router.post("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, senderRole, senderName } = req.body;

    const newMessage = await prisma.ticketMessage.create({
      data: { message, senderRole, senderName, ticketId: id },
    });

    // 🔥 ACENDE A NOTIFICAÇÃO DO OUTRO LADO!
    await prisma.ticket.update({
      where: { id },
      data: {
        hasUnreadAdmin: senderRole === "CLIENT",
        hasUnreadClient: senderRole === "ADMIN",
        status: senderRole === "CLIENT" ? "ABERTO" : "EM_ANDAMENTO", // Se o cliente responde, volta a ficar Aberto pro escritório ver
      },
    });

    return res.status(201).json(newMessage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
});

// 🔥 NOVA ROTA: Marcar Ticket como Lido
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await prisma.ticket.update({
      where: { id },
      data:
        role === "CLIENT"
          ? { hasUnreadClient: false }
          : { hasUnreadAdmin: false },
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao marcar como lido." });
  }
});

// 4. Alterar Status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { ...(status && { status }), ...(priority && { priority }) },
    });
    return res.json(updatedTicket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status." });
  }
});

export default router;
