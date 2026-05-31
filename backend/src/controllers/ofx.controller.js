export async function parse(req, res) {
  try {
    // 1. Verifica se o ficheiro chegou
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Nenhum ficheiro recebido pelo servidor." });
    }

    // 🔥 A MÁGICA CLOUD-FRIENDLY: Lemos diretamente da Memória RAM (Buffer)
    const content = req.file.buffer.toString("utf8");

    const transactions = [];

    // Expressão Regular para capturar os blocos <STMTTRN> ... </STMTTRN>
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const block = match[1];

      const typeMatch = block.match(/<TRNTYPE>(.*)/);
      const dateMatch = block.match(/<DTPOSTED>(\d{8})/); // Pega apenas YYYYMMDD
      const amountMatch = block.match(/<TRNAMT>(.*)/);
      const memoMatch = block.match(/<MEMO>(.*)/);

      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[1];
        const year = rawDate.substring(0, 4);
        const month = rawDate.substring(4, 6);
        const day = rawDate.substring(6, 8);

        const amount = parseFloat(amountMatch[1].trim());

        transactions.push({
          id: Math.random().toString(36).substring(7),
          type: amount >= 0 ? "entrada" : "saida",
          date: new Date(`${year}-${month}-${day}T12:00:00Z`), // Trava o Fuso Horário
          amount: Math.abs(amount),
          description: memoMatch ? memoMatch[1].trim() : "Transação Bancária",
        });
      }
    }

    // Devolve os dados instantaneamente para o Front-end
    return res.json(transactions);
  } catch (error) {
    console.error("Erro interno ao ler OFX:", error);
    return res
      .status(500)
      .json({ error: "Falha crítica ao processar o ficheiro OFX." });
  }
}
