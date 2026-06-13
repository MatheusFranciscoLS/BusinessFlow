import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createTask = async (req, res) => {
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

    for (let i = 0; i < numInstallments; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setMonth(currentDate.getMonth() + i);

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
};

export const getTasks = async (req, res) => {
  try {
    const { role, userEmail, page = 1, limit = 50 } = req.query;
    let where = { companyId: req.companyId };

    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId: req.companyId, email: userEmail },
      });
      if (!clientRecord) return res.json([]);
      where.clientId = clientRecord.id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { client: { select: { fullName: true } } },
        orderBy: { dueDate: "asc" },
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    res.set("X-Total-Count", total);
    res.set("X-Total-Pages", Math.ceil(total / take));
    res.set("X-Current-Page", page);
    res.set(
      "Access-Control-Expose-Headers",
      "X-Total-Count, X-Total-Pages, X-Current-Page",
    );

    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar as tarefas." });
  }
};

export const getAlerts = async (req, res) => {
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

    const pendingBpo = await prisma.transaction.count({
      where: {
        companyId: req.companyId,
        clientId: clientIdFilter,
        status: { not: "PAGO" },
      },
    });

    const pendingTasks = await prisma.task.count({
      where: {
        companyId: req.companyId,
        clientId: clientIdFilter,
        status: { not: "CONCLUIDO" },
      },
    });

    return res.json({ total: pendingBpo + pendingTasks });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar alertas." });
  }
};

export const updateTask = async (req, res) => {
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
};

export const deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    return res.json({ message: "Tarefa excluída." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir a tarefa." });
  }
};

export const autoScan = async (req, res) => {
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
              description: `Vence no dia ${expiryDate.toLocaleDateString("pt-BR")}.`,
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
};
