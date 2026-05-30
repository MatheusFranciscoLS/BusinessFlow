import * as transactionService from "../services/transaction.service.js";

export async function create(req, res) {
  try {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // 🔥 Passamos o clientId se ele vier no body
    const data = await transactionService.createTransaction(
      req.companyId,
      req.body,
      fileUrl,
    );
    return res.status(201).json(data);
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
