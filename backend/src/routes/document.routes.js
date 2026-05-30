import { Router } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.js";
import path from "path";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// 1. O "CARTEIRO" (Multer): Configuração de onde e como guardar os ficheiros físicos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Cria a pasta uploads/documents se ela não existir
    const dir = path.resolve("uploads", "documents");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Dá um nome único ao ficheiro para evitar substituições (Ex: 16234234-Contrato_Social.pdf)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s/g, "_"));
  },
});

const upload = multer({ storage });

// =======================================================
// ROTAS DA API
// =======================================================

// 2. UPLOAD: A agência envia um documento para a pasta do cliente
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { name, category, clientId, companyId } = req.body;

    if (!req.file)
      return res
        .status(400)
        .json({ error: "Ficheiro não recebido pelo servidor." });
    if (!name || !category || !clientId || !companyId) {
      return res.status(400).json({ error: "Dados do documento incompletos." });
    }

    // Cria a URL relativa que o Front-end vai usar para visualizar/baixar
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const document = await prisma.document.create({
      data: { name, category, fileUrl, clientId, companyId },
    });

    return res.status(201).json(document);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao processar e salvar o documento." });
  }
});

// 3. LISTAR: Mostrar os documentos
// (O cliente vê apenas os dele; O escritório vê todos da empresa para poder gerir)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { companyId, clientId } = req.query;
    const where = clientId ? { companyId, clientId } : { companyId };

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { fullName: true } } }, // Traz o nome do cliente para a tabela do escritório
    });

    return res.json(documents);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erro ao buscar a lista de documentos." });
  }
});

// 4. ELIMINAR: Remover o documento do sistema
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Deleta o registo do banco de dados (o ficheiro físico pode continuar na pasta ou podemos criar lógica para o apagar depois)
    await prisma.document.delete({ where: { id } });

    return res.json({ message: "Documento excluído com sucesso." });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao excluir o documento." });
  }
});

export default router;
