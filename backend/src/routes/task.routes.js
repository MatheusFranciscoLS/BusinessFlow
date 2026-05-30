import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 1. Criar um Cartão Manualmente (Ex: "Apurar Folha de Pagamento")
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

    if (!title || !dueDate || !companyId) {
      return res
        .status(400)
        .json({ error: "Preencha o título e o prazo limite." });
    }

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

// 2. Listar todas as Tarefas (Para montar o quadro Kanban)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.json([]);

    const tasks = await prisma.task.findMany({
      where: { companyId },
      include: { client: { select: { fullName: true } } }, // Traz o nome do cliente para mostrar no cartão
      orderBy: { dueDate: "asc" }, // Ordena pelas que vencem primeiro
    });
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar as tarefas." });
  }
});

// 3. Atualizar Cartão (Usado principalmente quando você arrastar o cartão para outra coluna)
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
    return res.status(500).json({ error: "Erro ao mover/atualizar a tarefa." });
  }
});

// 4. Excluir um Cartão
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    return res.json({ message: "Tarefa excluída." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir a tarefa." });
  }
});

// =================================================================
// 🔥 5. A MÁGICA: Varredura Automática de Vencimentos (e-CNPJ)
// =================================================================
router.post("/auto-scan", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId)
      return res.status(400).json({ error: "ID da Agência obrigatório." });

    // Data limite: O sistema vai procurar tudo o que vence em até 30 dias
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    // Busca apenas os clientes que têm um Certificado Digital preenchido no CRM
    const clients = await prisma.client.findMany({
      where: { companyId, certificateExpiry: { not: null } },
    });

    let newTasksCount = 0;

    for (const client of clients) {
      const expiryDate = new Date(client.certificateExpiry);

      // Se a data de validade estiver dentro dos próximos 30 dias (ou se já tiver vencido)
      if (expiryDate <= nextMonth) {
        const taskTitle = `⚠️ Renovar e-CNPJ: ${client.fullName}`;

        // Verifica se nós já criámos este aviso antes (para não inundar o seu quadro com cartões repetidos)
        const taskExists = await prisma.task.findFirst({
          where: {
            companyId,
            clientId: client.id,
            title: taskTitle,
            status: { not: "CONCLUIDO" },
          },
        });

        if (!taskExists) {
          // Cria o cartão vermelho urgente na primeira coluna do Kanban!
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
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao executar a automação de robô." });
  }
});

// =================================================================
// 6. RADAR GLOBAL: Alertas para o Menu Lateral (Layout)
// =================================================================
router.get("/alerts", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json({ total: 0 });

    let clientIdFilter = undefined;

    // Se for cliente, descobre o ID do Dossiê dele para filtrar
    if (role === "CLIENT") {
       const clientRecord = await prisma.client.findFirst({ where: { companyId, email: userEmail } });
       if (!clientRecord) return res.json({ total: 0 });
       clientIdFilter = clientRecord.id;
    }

    // 1. Conta os Boletos Pendentes (BPO)
    const pendingBpo = await prisma.transaction.count({
      where: { companyId, clientId: clientIdFilter, status: { not: "PAGO" } }
    });

    // 2. Conta as Obrigações Atrasadas no Kanban (Ignora as que estão no prazo)
    const overdueTasks = await prisma.task.count({
      where: { 
        companyId, 
        clientId: clientIdFilter, 
        status: { not: "CONCLUIDO" }, 
        dueDate: { lt: new Date() } // Data menor que hoje (Atrasado)
      }
    });

    // Devolve a soma das duas urgências
    return res.json({ total: pendingBpo + overdueTasks });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar alertas globais." });
  }
});

export default router;
