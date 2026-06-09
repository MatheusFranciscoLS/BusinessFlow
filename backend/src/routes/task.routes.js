import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();
const prisma = new PrismaClient();

// Aplica a segurança base
router.use(authMiddleware);
router.use(companyMiddleware);

// 🔥 INTERCEPTOR ZERO TRUST: Extrai a identidade 100% segura do Token JWT
router.use(async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;
    const loggedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!loggedUser)
      return res.status(401).json({ error: "Utilizador inválido." });

    // Sobrescreve o que o Front-end mandou com a verdade absoluta do Banco de Dados
    req.query.role = loggedUser.role;
    req.query.userEmail = loggedUser.email;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança da rota." });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      clientId,
      installments = 1,
    } = req.body;
    if (!title || !dueDate)
      return res
        .status(400)
        .json({ error: "Preencha o título e o prazo limite." });

    const baseDate = new Date(dueDate);
    const tasks = [];
    const numInstallments = parseInt(installments) || 1;

    // 🔥 O LOOP DE CRIAÇÃO AUTOMÁTICA!
    for (let i = 0; i < numInstallments; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setMonth(currentDate.getMonth() + i); // Avança 1 mês por cada repetição

      let taskTitle = title;
      if (numInstallments > 1) {
        taskTitle = `${title} (Mês ${i + 1}/${numInstallments})`;
      }

      const t = await prisma.task.create({
        data: {
          title: taskTitle,
          description,
          status: i === 0 ? status || "A_FAZER" : "A_FAZER",
          priority,
          dueDate: currentDate,
          clientId: clientId || null,
          companyId: req.companyId,
        },
      });
      tasks.push(t);
    }
    return res.status(201).json(tasks[0]);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar a tarefa." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { role, userEmail } = req.query;
    let where = { companyId: req.companyId };

    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId: req.companyId, email: userEmail },
      });
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

// 🔥 O FIM DOS ALERTAS FANTASMAS E CONFUSOS
router.get("/alerts", async (req, res) => {
  try {
    const { role, userEmail } = req.query;
    let clientIdFilter = undefined;

    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId: req.companyId, email: userEmail },
      });
      if (!clientRecord) return res.json({ total: 0 });
      clientIdFilter = clientRecord.id;
    }

    // Conta tudo o que NÃO ESTÁ PAGO (Contas a Pagar + Receber)
    const pendingBpo = await prisma.transaction.count({
      where: {
        companyId: req.companyId,
        clientId: clientIdFilter,
        status: { not: "PAGO" },
      },
    });

    // Conta tudo o que NÃO ESTÁ CONCLUÍDO (Pendentes, que já inclui as Atrasadas)
    const pendingTasks = await prisma.task.count({
      where: {
        companyId: req.companyId,
        clientId: clientIdFilter,
        status: { not: "CONCLUIDO" },
      },
    });

    // A bolinha agora refletirá a soma exata dos Cards principais!
    return res.json({ total: pendingBpo + pendingTasks });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar alertas." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { status, priority, dueDate, description } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
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

router.delete("/:id", async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    return res.json({ message: "Tarefa excluída." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir a tarefa." });
  }
});

router.post("/auto-scan", async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const clients = await prisma.client.findMany({
      where: { companyId: req.companyId, certificateExpiry: { not: null } },
    });
    let newTasksCount = 0;

    for (const client of clients) {
      const expiryDate = new Date(client.certificateExpiry);
      if (expiryDate <= nextMonth) {
        const taskTitle = `⚠️ Renovar e-CNPJ: ${client.fullName}`;
        const taskExists = await prisma.task.findFirst({
          where: {
            companyId: req.companyId,
            clientId: client.id,
            title: taskTitle,
            status: { not: "CONCLUIDO" },
          },
        });

        if (!taskExists) {
          await prisma.task.create({
            data: {
              title: taskTitle,
              description: `O certificado digital desta empresa vence no dia ${expiryDate.toLocaleDateString("pt-BR")}.`,
              status: "A_FAZER",
              priority: "URGENTE",
              dueDate: expiryDate,
              clientId: client.id,
              companyId: req.companyId,
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
    return res.status(500).json({ error: "Erro na automação." });
  }
});

export default router;
