import { parseOfx } from "../services/ofx.service.js";

// Lê o extrato OFX enviado (em memória, nada vai para o disco) e devolve os movimentos.
export async function parse(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ficheiro OFX não recebido." });
    }

    const transactions = parseOfx(req.file.buffer);

    if (transactions.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma transação encontrada neste ficheiro." });
    }

    return res.json(transactions);
  } catch (error) {
    if (error.message.startsWith("Este arquivo")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Erro ao ler o OFX:", error.message);
    return res.status(500).json({ error: "Falha na leitura do extrato OFX." });
  }
}
