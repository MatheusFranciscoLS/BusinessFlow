import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 1. Criar um Cartão
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      clientId,
      companyId,
    } = req.body;
    if (!title || !dueDate || !companyId)
      return res
        .status(400)
        .json({ error: "Preencha o título e o prazo limite." });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: new Date(dueDate),
        clientId,
        companyId,
      },
    });
    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar a tarefa." });
  }
});

// 🔥 2. LISTAR TAREFAS (BLINDAGEM DE SEGURANÇA TOTAL)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json([]);

    let where = { companyId };

    // SE FOR CLIENTE: O Servidor barra qualquer dado que não seja dele
    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId, email: userEmail },
      });

      // Se não achar o cliente no CRM, devolve um array vazio (Proteção Máxima)
      if (!clientRecord) return res.json([]);

      where.clientId = clientRecord.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { client: { select: { fullName: true } } },
      orderBy: { dueDate: "asc" },
    });
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar as tarefas." });
  }
});

// 3. Atualizar Cartão
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, dueDate, description } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(description && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar a tarefa." });
  }
});

// 4. Excluir Cartão
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    return res.json({ message: "Tarefa excluída." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir a tarefa." });
  }
});

// 5. Varredura Automática
router.post("/auto-scan", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId)
      return res.status(400).json({ error: "ID da Agência obrigatório." });

    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const clients = await prisma.client.findMany({
      where: { companyId, certificateExpiry: { not: null } },
    });
    let newTasksCount = 0;

    for (const client of clients) {
      const expiryDate = new Date(client.certificateExpiry);
      if (expiryDate <= nextMonth) {
        const taskTitle = `⚠️ Renovar e-CNPJ: ${client.fullName}`;
        const taskExists = await prisma.task.findFirst({
          where: {
            companyId,
            clientId: client.id,
            title: taskTitle,
            status: { not: "CONCLUIDO" },
          },
        });

        if (!taskExists) {
          await prisma.task.create({
            data: {
              title: taskTitle,
              description: `O certificado digital desta empresa vence no dia ${expiryDate.toLocaleDateString("pt-BR")}. Contacte o cliente urgentemente para a renovação!`,
              status: "A_FAZER",
              priority: "URGENTE",
              dueDate: expiryDate,
              clientId: client.id,
              companyId,
            },
          });
          newTasksCount++;
        }
      }
    }
    return res.json({
      message: "Varredura concluída",
      newTasksGenerated: newTasksCount,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erro ao executar a automação de robô." });
  }
});

// 6. Alertas Globais (Para o Menu)
router.get("/alerts", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json({ total: 0 });

    let clientIdFilter = undefined;
    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId, email: userEmail },
      });
      if (!clientRecord) return res.json({ total: 0 });
      clientIdFilter = clientRecord.id;
    }

    const pendingBpo = await prisma.transaction.count({
      where: { companyId, clientId: clientIdFilter, status: { not: "PAGO" } },
    });
    const overdueTasks = await prisma.task.count({
      where: {
        companyId,
        clientId: clientIdFilter,
        status: { not: "CONCLUIDO" },
        dueDate: { lt: new Date() },
      },
    });

    return res.json({ total: pendingBpo + overdueTasks });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar alertas globais." });
  }
});

export default router;
