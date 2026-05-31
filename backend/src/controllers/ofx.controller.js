import fs from "fs";

export async function parse(req, res) {
  try {
    // 1. Verifica se o ficheiro chegou
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum ficheiro enviado." });
    }

    // 2. Lê o conteúdo do ficheiro OFX
    const content = fs.readFileSync(req.file.path, "utf8");

    const transactions = [];

    // 3. Expressão Regular para capturar os blocos <STMTTRN> ... </STMTTRN>
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    // 4. Varre cada transação bancária dentro do ficheiro
    while ((match = regex.exec(content)) !== null) {
      const block = match[1];

      const typeMatch = block.match(/<TRNTYPE>(.*)/);
      const dateMatch = block.match(/<DTPOSTED>(\d{8})/); // Pega apenas YYYYMMDD
      const amountMatch = block.match(/<TRNAMT>(.*)/);
      const memoMatch = block.match(/<MEMO>(.*)/);

      if (dateMatch && amountMatch) {
        // Formata a Data (Ex: 20260528 -> Ano: 2026, Mês: 05, Dia: 28)
        const rawDate = dateMatch[1];
        const year = rawDate.substring(0, 4);
        const month = rawDate.substring(4, 6);
        const day = rawDate.substring(6, 8);

        const amount = parseFloat(amountMatch[1].trim());

        transactions.push({
          id: Math.random().toString(36).substring(7), // ID temporário para o Front-end
          type: amount >= 0 ? "entrada" : "saida",
          date: new Date(`${year}-${month}-${day}T12:00:00Z`), // Força o Meio-dia (UTC)
          amount: Math.abs(amount), // Remove o sinal de negativo
          description: memoMatch ? memoMatch[1].trim() : "Transação Bancária",
        });
      }
    }

    // 5. Apaga o ficheiro do servidor para não gastar espaço em disco
    fs.unlinkSync(req.file.path);

    // 6. Devolve os dados traduzidos para o Robô do Front-end
    return res.json(transactions);
  } catch (error) {
    console.error("Erro ao ler OFX:", error);
    // Tenta apagar o ficheiro caso tenha dado erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res
      .status(500)
      .json({ error: "Falha ao processar o ficheiro OFX." });
  }
}
