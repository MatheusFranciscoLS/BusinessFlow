import * as transactionService from "../services/transaction.service.js";
import { addMonths } from "date-fns";

export async function create(req, res) {
  try {
    // 1. Recebemos todos os dados do Front-end
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

    // O upload do comprovante (se houver)
    const fileUrl = req.file
      ? `/uploads/transactions/${req.file.filename}`
      : null;

    if (numInstallments === 1) {
      // 🔥 CENÁRIO A: Criação Normal (1 única transação)
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
      return res.status(201).json(transaction);
    } else {
      // 🔥 CENÁRIO B: A MÁQUINA DE MENSALIDADES (Em Lote)
      const transactionsData = [];

      for (let i = 0; i < numInstallments; i++) {
        // O date-fns soma os meses inteligentemente (foge de anos bissextos e fim de mês sozinhos!)
        const nextDate = addMonths(baseDate, i);

        transactionsData.push({
          // Adiciona o contador no título: Ex: "Honorários (1/12)"
          title: `${title} (${i + 1}/${numInstallments})`,
          amount: parsedAmount,
          category,
          type,
          date: nextDate,
          // Apenas a 1ª parcela herda o status do Front (ex: PAGO). As faturas do futuro nascem como PENDENTE.
          status: i === 0 ? status : "PENDENTE",
          paymentMethod,
          clientId: clientId || null,
          companyId,
          // Não clonamos o arquivo PDF (comprovante) para as faturas do futuro!
          fileUrl: i === 0 ? fileUrl : null,
          installments: numInstallments,
        });
      }

      // O Prisma cria todas as 12 (ou mais) faturas numa única viagem ao banco de dados (Alta Performance)
      await prisma.transaction.createMany({
        data: transactionsData,
      });

      return res
        .status(201)
        .json({
          message: `${numInstallments} parcelas geradas no fluxo de caixa com sucesso!`,
        });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    // 🔥 Agora o servidor lê o mês e o ano enviados pelo Front-end!
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

    // 🔥 O MOTOR DE PERFORMANCE: Filtra o tempo diretamente no Banco de Dados
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);

      // Define o primeiro milissegundo do dia 1º do mês
      const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      // Define o último milissegundo do último dia do mês
      const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

      whereClause.date = {
        gte: startDate, // gte = Greater than or equal (Maior ou igual)
        lte: endDate, // lte = Less than or equal (Menor ou igual)
      };
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
    const companyId = req.companyId; // Pego diretamente do Token JWT, impossível de falsificar

    // 🛡️ VERIFICAÇÃO DE PROPRIEDADE: A transação existe e pertence a esta Agência?
    const existingTx = await prisma.transaction.findFirst({
      where: { id: transactionId, companyId: companyId },
    });

    if (!existingTx)
      return res
        .status(404)
        .json({
          error: "Transação não encontrada ou pertence a outra agência.",
        });

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

    return res.status(200).json(transaction);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const transactionId = req.params.id;
    const companyId = req.companyId;

    // 🛡️ VERIFICAÇÃO DE PROPRIEDADE PARA EXCLUSÃO
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