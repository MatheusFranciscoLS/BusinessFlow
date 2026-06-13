import fs from "fs";

export async function parse(req, res) {
  try {
    // 🔥 Agora ele verifica o path (caminho no disco) em vez do buffer!
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "Ficheiro OFX não recebido." });
    }

    // Lê o ficheiro do disco
    const content = fs.readFileSync(req.file.path, "latin1");
    const transactions = [];
    const blocks = content.split(/<STMTTRN>/i);

    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
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
        const amount = parseFloat(amountRaw.replace(",", "."));

        transactions.push({
          id: "tx-" + Math.random().toString(36).substr(2, 9),
          type: amount >= 0 ? "entrada" : "saida",
          date: new Date(`${year}-${month}-${day}T12:00:00Z`),
          amount: Math.abs(amount),
          description: memo || "Movimento Bancário",
        });
      }
    }

    // 🔥 HIGIENE DO SERVIDOR: Apaga o ficheiro OFX do disco porque já não precisamos dele!
    fs.unlinkSync(req.file.path);

    if (transactions.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma transação encontrada neste ficheiro." });
    }

    return res.json(transactions);
  } catch (error) {
    console.error("ERRO CRÍTICO NO OFX:", error);

    // 🔥 Se der erro, garante que o ficheiro é apagado na mesma para não fazer lixo!
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res
      .status(500)
      .json({ error: "Falha no motor de leitura: " + error.message });
  }
}
