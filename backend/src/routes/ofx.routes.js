import { Router } from "express";
import multer from "multer";
import fs from "fs";
import ofxParser from "node-ofx-parser";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// Usamos a pasta de uploads temporária
const upload = multer({ dest: "uploads/" });

// 🔥 ROTA MÁGICA: Recebe o OFX e traduz para JSON
router.post(
  "/parse",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Ficheiro OFX não enviado." });

      // 1. Lê o conteúdo do ficheiro que o Front-end enviou
      const fileContent = fs.readFileSync(req.file.path, "utf-8");

      // 2. O Parser traduz o código do banco
      const ofxData = ofxParser.parse(fileContent);

      // 3. Apaga o ficheiro temporário para não encher o servidor
      fs.unlinkSync(req.file.path);

      // 4. Navega na árvore de dados do OFX (Padrão Bancário Internacional)
      let transactions = [];
      try {
        const statement =
          ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
        // O banco pode mandar 1 transação (objeto) ou várias (array)
        transactions = Array.isArray(statement) ? statement : [statement];
      } catch (e) {
        return res
          .status(400)
          .json({ error: "O ficheiro OFX não contém transações válidas." });
      }

      // 5. Limpa os dados e prepara para o Front-end
      const parsedData = transactions.map((t) => {
        const amount = parseFloat(t.TRNAMT); // Valor original (Positivo ou Negativo)

        // O OFX manda a data assim: 20260528100000. Precisamos de a cortar.
        const rawDate = t.DTPOSTED || "";
        const year = rawDate.substring(0, 4);
        const month = rawDate.substring(4, 6);
        const day = rawDate.substring(6, 8);

        return {
          id: t.FITID, // ID único da transação no Banco
          description: t.MEMO || t.NAME || "Transação Bancária",
          amount: Math.abs(amount), // Passa para positivo
          type: amount > 0 ? "entrada" : "saida", // Define se é receita ou despesa
          date: `${year}-${month}-${day}T12:00:00Z`, // Formato de data ISO
        };
      });

      return res.json(parsedData);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Erro interno ao processar o Extrato OFX." });
    }
  },
);

export default router;
