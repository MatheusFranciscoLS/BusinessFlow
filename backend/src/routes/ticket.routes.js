import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 1. Criar um Novo Chamado (Feito pelo Cliente)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject, department, description, priority, clientId, companyId } =
      req.body;
    const ticket = await prisma.ticket.create({
      data: { subject, department, description, priority, clientId, companyId },
    });
    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao abrir chamado." });
  }
});

// 2. Listar os Chamados (Filtra se é o Escritório a ver tudo, ou o Cliente a ver os dele)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, clientId } = req.query;

    // Se passar clientId, busca só os chamados daquele cliente. Se não, busca todos da empresa.
    const where = clientId ? { companyId, clientId } : { companyId };

    const tickets = await prisma.ticket.findMany({
      where,
      include: { client: true }, // Traz o nome do cliente junto
      orderBy: { createdAt: "desc" },
    });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar chamados." });
  }
});

// 3. O Contador responde e muda o status
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status, reply },
    });
    return res.json(updatedTicket);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar chamado." });
  }
});

export default router;
