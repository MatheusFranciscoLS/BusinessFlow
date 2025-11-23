import * as transactionService from "../services/transaction.service.js";

export async function create(req, res) {
  try {
    const transaction = await transactionService.create(req.body);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  const transactions = await transactionService.getAll();
  res.json(transactions);
}

export async function getById(req, res) {
  try {
    const transaction = await transactionService.getById(req.params.id);
    res.json(transaction);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    await transactionService.remove(req.params.id);
    res.json({ message: "Transação removida." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
export async function update(req, res) {
  try {
    const transaction = await transactionService.update(req.params.id, req.body);
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
