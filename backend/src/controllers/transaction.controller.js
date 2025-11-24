import * as transactionService from "../services/transaction.service.js";

export async function create(req, res) {
  try {
    // O userId geralmente vem do authMiddleware (verifique se é req.userId ou req.user.id)
    const userId = req.userId; 
    const transaction = await transactionService.create(req.body, userId); // <--- Passa o ID aqui
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const userId = req.userId; // <--- Pega o ID do usuário logado
    const transactions = await transactionService.getAll(userId); // <--- Passa o ID aqui
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
