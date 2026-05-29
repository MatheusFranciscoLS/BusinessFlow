import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 🔥 NOVA ROTA CORRIGIDA: Contar chamados não lidos (Escritório e Cliente)
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json({ count: 0 });

    let where = { companyId };

    if (role === "CLIENT") {
      // Procura o ID do Dossiê do Cliente cruzando o e-mail
      const clientRecord = await prisma.client.findFirst({
        where: { companyId, email: userEmail },
      });

      if (!clientRecord) return res.json({ count: 0 });

      // Filtra apenas os chamados DESTE cliente que têm mensagens não lidas por ele
      where = { companyId, clientId: clientRecord.id, hasUnreadClient: true };
    } else {
      // O escritório vê as notificações de todos os clientes
      where = { companyId, hasUnreadAdmin: true };
    }

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
      orderBy: { updatedAt: "desc" },
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
    return res.status(500).json({ error: "Erro ao enviar mensagem." });
  }
});

// 4. Marcar Ticket como Lido
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

// 5. Alterar Status
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
