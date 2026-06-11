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
    // 🔥 CORREÇÃO CRÍTICA: Agora o Controller capta o clientId que a Rota de Segurança injetou!
    const { month, year, clientId } = req.query;

    const data = await transactionService.getAllTransactions(
      req.companyId,
      month,
      year,
      clientId, // <- Repassamos isto para o Service filtrar no Banco de Dados
    );
    return res.status(200).json(data);
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

export async function update(req, res) {
  try {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const data = await transactionService.updateTransaction(
      req.companyId,
      req.params.id,
      req.body,
      fileUrl,
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    await transactionService.deleteTransaction(req.companyId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
