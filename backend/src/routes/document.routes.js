import { Router } from "express";
import * as documentController from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve("uploads", "documents");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s/g, "_"));
  },
});

const upload = multer({ storage });

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { name, category, clientId, companyId } = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ error: "Ficheiro não recebido pelo servidor." });
    if (!name || !category || !clientId || !companyId)
      return res.status(400).json({ error: "Dados do documento incompletos." });

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const document = await prisma.document.create({
      data: { name, category, fileUrl, clientId, companyId },
    });
    return res.status(201).json(document);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao processar documento." });
  }
});

// 🔥 BLINDAGEM DE SEGURANÇA TOTAL (Zero Trust)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, role, userEmail } = req.query;
    if (!companyId) return res.json([]);

    let where = { companyId };

    if (role === "CLIENT") {
      const clientRecord = await prisma.client.findFirst({
        where: { companyId, email: userEmail },
      });
      if (!clientRecord) return res.json([]); // Bloqueio total se não achar
      where.clientId = clientRecord.id;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { fullName: true } } },
    });

    return res.json(documents);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({ where: { id } });
    return res.json({ message: "Documento excluído." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir o documento." });
  }
});

export default router;
