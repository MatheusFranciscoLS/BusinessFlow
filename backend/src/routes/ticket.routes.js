import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 1. Criar um Novo Chamado (Abertura inicial)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject, department, description, priority, clientId, companyId } =
      req.body;

    if (!subject || !department || !description || !clientId || !companyId) {
      return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }

    const ticket = await prisma.ticket.create({
      data: { subject, department, description, priority, clientId, companyId },
    });
    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao abrir chamado." });
  }
});

// 2. Listar Chamados com Histórico de Mensagens Incluído
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, clientId } = req.query;

    // Filtro de segurança: cliente só vê os seus chamados; escritório vê todos da empresa ativa
    const where = clientId ? { companyId, clientId } : { companyId };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: true,
        messages: {
          orderBy: { createdAt: "asc" }, // Traz a conversa em ordem cronológica correta
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar chamados." });
  }
});

// 3. Adicionar uma nova mensagem à Thread de Conversa
router.post("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, senderRole, senderName } = req.body;

    if (!message || !senderRole || !senderName) {
      return res.status(400).json({ error: "Conteúdo da mensagem inválido." });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        message,
        senderRole,
        senderName,
        ticketId: id,
      },
    });

    return res.status(201).json(newMessage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao enviar mensagem no chat." });
  }
});

// 4. Alterar o Status ou Prioridade do Chamado (Controle do Escritório)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
      },
    });
    return res.json(updatedTicket);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erro ao atualizar status do chamado." });
  }
});

export default router;
