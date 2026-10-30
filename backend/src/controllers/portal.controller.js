import path from "path";
import prisma from "../config/prisma.js";
import { saveUploadedFile } from "../services/file.service.js";
import { registerLog } from "../services/audit.service.js";

export const CLIENT_UPLOAD_CATEGORY = "Enviado pelo cliente";

// Só tipos de arquivo comuns de contabilidade (nada que rode script, como HTML ou SVG).
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".xml", ".ofx", ".csv", ".xlsx", ".xls", ".docx", ".doc", ".txt"];

// O cliente do portal envia um documento para o escritório. O dono do documento
// (cliente) e a categoria são definidos pelo servidor, não pelo que veio na requisição.
export async function uploadDocument(req, res) {
  try {
    if (!req.portal?.clientId) {
      return res.status(403).json({ error: "Seu acesso não está vinculado a um cadastro de cliente." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Ficheiro não recebido pelo servidor." });
    }

    const extension = path.extname(req.file.originalname || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return res.status(400).json({ error: `Tipo de arquivo não aceito. Envie: ${ALLOWED_EXTENSIONS.join(", ")}.` });
    }

    const name = String(req.body.name || "").trim() || req.file.originalname;
    const fileUrl = await saveUploadedFile(req.companyId, req.file);

    const document = await prisma.document.create({
      data: {
        name: name.slice(0, 120),
        category: CLIENT_UPLOAD_CATEGORY,
        fileUrl,
        clientId: req.portal.clientId,
        companyId: req.companyId,
      },
    });

    registerLog(req.companyId, req.actor, "CREATE", "DOCUMENTOS", `Enviou um documento pelo portal: ${document.name}`);
    return res.status(201).json(document);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// O que está pendente para o cliente do portal: cobranças, documentos para assinar ou
// ler, chamados com resposta nova e tarefas em aberto. Só dados do próprio cliente.
export async function pending(req, res) {
  try {
    if (!req.portal?.clientId) {
      return res.json({ unpaidTransactions: [], documentsToSign: [], unreadDocuments: 0, ticketsWithReply: 0, openTasks: [] });
    }

    const where = { companyId: req.companyId, clientId: req.portal.clientId };
    const [unpaid, toSign, unreadDocuments, ticketsWithReply, openTasks] = await Promise.all([
      prisma.transaction.findMany({
        where: { ...where, status: { not: "PAGO" }, type: { in: ["entrada", "income"] } },
        select: { id: true, title: true, amount: true, date: true },
        orderBy: { date: "asc" },
      }),
      prisma.document.findMany({
        where: { ...where, isSigned: false, category: { not: CLIENT_UPLOAD_CATEGORY } },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where: { ...where, readAt: null, category: { not: CLIENT_UPLOAD_CATEGORY } } }),
      prisma.ticket.count({ where: { ...where, hasUnreadClient: true } }),
      prisma.task.findMany({
        where: { ...where, status: { not: "CONCLUIDO" } },
        select: { id: true, title: true, dueDate: true },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
    ]);

    return res.json({
      unpaidTransactions: unpaid,
      documentsToSign: toSign,
      unreadDocuments,
      ticketsWithReply,
      openTasks,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar as pendências." });
  }
}
