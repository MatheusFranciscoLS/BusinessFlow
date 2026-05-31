export async function parse(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ error: "Ficheiro OFX não recebido na memória do servidor." });
    }

    // 🔥 Bancos no Brasil usam frequentemente o formato Latin1 (ISO-8859-1)
    const content = req.file.buffer.toString("latin1");
    const transactions = [];

    // A forma mais segura de ler OFX sem bibliotecas: Quebrar o texto por blocos brutos
    const blocks = content.split(/<STMTTRN>/i);

    // O índice 0 é o cabeçalho do banco, iteramos a partir do índice 1
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];

      // Função auxiliar super resiliente: extrai as tags independentemente da quebra de linha
      const extract = (tag) => {
        const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
        return match ? match[1].trim() : null;
      };

      const dateRaw = extract("DTPOSTED");
      const amountRaw = extract("TRNAMT");
      const memo = extract("MEMO");

      if (dateRaw && amountRaw) {
        const year = dateRaw.substring(0, 4);
        const month = dateRaw.substring(4, 6);
        const day = dateRaw.substring(6, 8);

        // Garante que a vírgula vira ponto antes de converter para número
        const amount = parseFloat(amountRaw.replace(",", "."));

        transactions.push({
          id: "tx-" + Math.random().toString(36).substr(2, 9),
          type: amount >= 0 ? "entrada" : "saida",
          date: new Date(`${year}-${month}-${day}T12:00:00Z`), // Meio-dia UTC para evitar bug de fuso
          amount: Math.abs(amount),
          description: memo || "Movimento Bancário",
        });
      }
    }

    if (transactions.length === 0) {
      return res
        .status(400)
        .json({
          error: "Nenhuma transação financeira encontrada neste ficheiro.",
        });
    }

    return res.json(transactions);
  } catch (error) {
    console.error("ERRO CRÍTICO NO OFX:", error);
    // 🔥 Devolve o erro EXATO para o Front-end para sabermos o que partiu
    return res
      .status(500)
      .json({ error: "Falha no motor de leitura: " + error.message });
  }
}
