import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

// 🔥 ROTA DO SUPER PAINEL: Resumo panorâmico do escritório
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user.id;
    
    // Busca todas as empresas do escritório e cruza com Clientes e Finanças
    const companies = await prisma.company.findMany({
      where: { userId },
      include: {
        clients: true,
        transactions: {
          where: { status: { in: ["PENDENTE", "ATRASADO"] } }
        }
      }
    });

    let totalMRR = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    const list = companies.map(comp => {
      let mrr = 0;
      // Soma os honorários de clientes ATIVOS vinculados a esta empresa
      comp.clients.forEach(c => { if (c.status === 'ATIVO') mrr += (c.monthlyFee || 0); });
      
      const pending = comp.transactions.filter(t => t.status === 'PENDENTE').length;
      const overdue = comp.transactions.filter(t => t.status === 'ATRASADO').length;
      
      totalMRR += mrr;
      totalPending += pending;
      totalOverdue += overdue;

      return { id: comp.id, name: comp.name, mrr, pending, overdue };
    });

    // Ordena as empresas: As que têm mais problemas (atrasos + pendências) aparecem no topo!
    list.sort((a, b) => (b.overdue + b.pending) - (a.overdue + a.pending));

    return res.json({ totalMRR, totalPending, totalOverdue, companies: list });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao gerar a Central de Comando." });
  }
});

export default router;