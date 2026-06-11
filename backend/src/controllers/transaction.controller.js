import * as transactionService from "../services/transaction.service.js";
import { addMonths } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { registerLog } from "../services/audit.service.js";

const prisma = new PrismaClient();

export async function create(req, res) {
  try {
    const {
      title,
      amount,
      category,
      type,
      date,
      status,
      paymentMethod,
      clientId,
      installments,
    } = req.body;
    const companyId = req.companyId;

    const numInstallments = parseInt(installments) || 1;
    const baseDate = new Date(date);
    const parsedAmount = parseFloat(amount);

    const fileUrl = req.file
      ? `/uploads/transactions/${req.file.filename}`
      : null;

    // Objeto genérico para o log (se o seu middleware de Auth enviar o 'req.user', podemos substituir no futuro)
    const currentUser = { name: "Usuário do Sistema", role: "ADMIN" };

    if (numInstallments === 1) {
      const transaction = await prisma.transaction.create({
        data: {
          title,
          amount: parsedAmount,
          category,
          type,
          date: baseDate,
          status,
          paymentMethod,
          clientId: clientId || null,
          companyId,
          fileUrl,
          installments: 1,
        },
      });

      // 🔥 2. ESPIÃO: Alarme disparado na criação simples
      registerLog(
        companyId,
        currentUser,
        "CREATE",
        "FINANCEIRO",
        `Registou o lançamento: ${title} no valor de R$ ${parsedAmount}`,
      );

      return res.status(201).json(transaction);
    } else {
      const transactionsData = [];

      for (let i = 0; i < numInstallments; i++) {
        const nextDate = addMonths(baseDate, i);
        transactionsData.push({
          title: `${title} (${i + 1}/${numInstallments})`,
          amount: parsedAmount,
          category,
          type,
          date: nextDate,
          status: i === 0 ? status : "PENDENTE",
          paymentMethod,
          clientId: clientId || null,
          companyId,
          fileUrl: i === 0 ? fileUrl : null,
          installments: numInstallments,
        });
      }

      await prisma.transaction.createMany({ data: transactionsData });

      // 🔥 2. ESPIÃO: Alarme disparado na criação do contrato em lote
      registerLog(
        companyId,
        currentUser,
        "CREATE",
        "FINANCEIRO",
        `Gerou um contrato recorrente de ${numInstallments} parcelas: ${title}`,
      );

      return res.status(201).json({
        message: `${numInstallments} parcelas geradas no fluxo de caixa com sucesso!`,
      });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const { role, userEmail, month, year } = req.query;
    const companyId = req.companyId;

    let whereClause = { companyId: companyId };

    if (role === "CLIENT") {
      const client = await prisma.client.findFirst({
        where: { email: userEmail, companyId: companyId },
      });

      if (!client) return res.status(403).json({ error: "Acesso negado." });
      whereClause.clientId = client.id;
    }

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

      whereClause.date = { gte: startDate, lte: endDate };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { client: { select: { fullName: true } } },
      orderBy: { date: "desc" },
    });

    return res.status(200).json(transactions);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const transactionId = req.params.id;
    const companyId = req.companyId;

    const existingTx = await prisma.transaction.findFirst({
      where: { id: transactionId, companyId: companyId },
    });

    if (!existingTx)
      return res.status(404).json({ error: "Transação não encontrada." });

    const fileUrl = req.file
      ? `/uploads/transactions/${req.file.filename}`
      : existingTx.fileUrl;
    const {
      title,
      amount,
      category,
      type,
      date,
      status,
      paymentMethod,
      clientId,
    } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        type,
        date: date ? new Date(date) : undefined,
        status,
        paymentMethod,
        clientId: clientId || null,
        fileUrl,
      },
    });

    // 🔥 3. ESPIÃO: Regista quem alterou e qual era o título antigo
    registerLog(
      companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "UPDATE",
      "FINANCEIRO",
      `Alterou os dados ou status da fatura: ${existingTx.title}`,
    );

    return res.status(200).json(transaction);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const transactionId = req.params.id;
    const companyId = req.companyId;

    const existingTx = await prisma.transaction.findFirst({
      where: { id: transactionId, companyId: companyId },
    });

    if (!existingTx)
      return res
        .status(403)
        .json({
          error: "Tentativa de exclusão bloqueada por violação de segurança.",
        });

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // 🔥 4. ESPIÃO: A ação mais perigosa do sistema está agora totalmente blindada!
    registerLog(
      companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "DELETE",
      "FINANCEIRO",
      `Apagou permanentemente o lançamento: ${existingTx.title} (R$ ${existingTx.amount})`,
    );

    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getById(req, res) {
  try {
    const data = await transactionService.getTransactionById(
      req.companyId,
      req.params.id,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
