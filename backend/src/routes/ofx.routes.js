import { Router } from "express";
import multer from "multer";
import fs from "fs";
import os from "os"; // 🔥 Biblioteca nativa do Node.js para aceder à pasta temporária
import ofxParser from "node-ofx-parser";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// 🔥 Truque Sênior: Salva na pasta temporária da Render (100% seguro contra erros de permissão)
const upload = multer({ dest: os.tmpdir() });

router.post(
  "/parse",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Ficheiro OFX não enviado." });

      // 1. Lê o ficheiro OFX
      const fileContent = fs.readFileSync(req.file.path, "utf-8");

      // 2. O Parser traduz a linguagem do banco
      const ofxData = ofxParser.parse(fileContent);

      // 3. Limpa o ficheiro temporário para não pesar o servidor
      fs.unlinkSync(req.file.path);

      // 4. Navega na árvore do OFX
      let transactions = [];
      try {
        const statement =
          ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
        transactions = Array.isArray(statement) ? statement : [statement];
      } catch (e) {
        return res
          .status(400)
          .json({ error: "Ficheiro OFX inválido ou sem transações." });
      }

      // 5. Limpa os dados para o formato do BusinessFlow
      const parsedData = transactions.map((t) => {
        const amount = parseFloat(t.TRNAMT);

        const rawDate = t.DTPOSTED || "";
        const year = rawDate.substring(0, 4);
        const month = rawDate.substring(4, 6);
        const day = rawDate.substring(6, 8);

        return {
          id: t.FITID,
          description: t.MEMO || t.NAME || "Transação Bancária",
          amount: Math.abs(amount),
          type: amount > 0 ? "entrada" : "saida",
          date: `${year}-${month}-${day}T12:00:00Z`,
        };
      });

      return res.json(parsedData);
    } catch (err) {
      console.error("Erro na rota OFX:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao processar o Extrato OFX." });
    }
  },
);

export default router;
