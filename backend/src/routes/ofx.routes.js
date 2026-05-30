import { Router } from "express";
import multer from "multer";
import fs from "fs";
import os from "os";
import ofxParser from "node-ofx-parser";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const upload = multer({ dest: os.tmpdir() });

router.post(
  "/parse",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: "Ficheiro OFX não enviado." });

    try {
      const fileContent = fs.readFileSync(req.file.path, "utf-8");
      const ofxData = ofxParser.parse(fileContent);

      let transactions = [];
      const statement =
        ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
      transactions = Array.isArray(statement) ? statement : [statement];

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
          date: new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString(),
        };
      });

      return res.json(parsedData);
    } catch (e) {
      console.error("Erro no processamento OFX:", e);
      return res
        .status(400)
        .json({ error: "Ficheiro OFX inválido ou com formato não suportado." });
    } finally {
      // 🔥 A VACINA: O ficheiro será APAGADO independentemente de dar erro ou não!
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  },
);

export default router;
