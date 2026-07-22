import * as documentService from "../services/document.service.js";
import { sendDocumentNotification } from "../services/email.service.js";
import { PrismaClient } from "@prisma/client";
import { registerLog } from "../services/audit.service.js"; // 🔥 1. Importamos a Caixa Preta

const prisma = new PrismaClient();

export async function create(req, res) {
  try {
    const fileUrl = req.file ? `/uploads/documents/${req.file.filename}` : null;
    if (!fileUrl)
      return res
        .status(400)
        .json({ error: "Ficheiro não recebido pelo servidor." });

    // 1. Grava o documento no banco de dados primeiro
    const document = await documentService.createDocument(
      req.companyId,
      req.body,
      fileUrl,
    );

    // 🔥 2. ESPIÃO: Alarme disparado no Upload!
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "CREATE",
      "DOCUMENTOS",
      `Fez o upload de um novo documento: ${document.name} (Categoria: ${document.category})`,
    );

    // Gatilho de E-mail em Background
    if (req.body.clientId) {
      Promise.all([
        prisma.client.findUnique({ where: { id: req.body.clientId } }),
        prisma.company.findUnique({ where: { id: req.companyId } }),
      ])
        .then(([client, company]) => {
          if (client && client.email && company) {
            const primeiroNome = client.fullName.split(" ")[0];
            sendDocumentNotification(
              client.email,
              primeiroNome,
              document.name,
              company.name,
            );
          }
        })
        .catch((err) =>
          console.error("Erro ao buscar dados para o e-mail:", err),
        );
    }

    return res.status(201).json(document);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const { role, userEmail } = req.query;
    const documents = await documentService.getDocuments(
      req.companyId,
      role,
      userEmail,
    );
    return res.status(200).json(documents);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    // 🔥 Precisamos descobrir o nome do documento ANTES de o apagar, para podermos dedurar no log!
    const existingDoc = await prisma.document.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
    });

    if (!existingDoc)
      return res.status(404).json({ error: "Documento não encontrado." });

    await documentService.deleteDocument(req.companyId, req.params.id);

    // 🔥 3. ESPIÃO: Alarme disparado na exclusão do ficheiro!
    registerLog(
      req.companyId,
      { name: "Usuário do Sistema", role: "ADMIN" },
      "DELETE",
      "DOCUMENTOS",
      `Apagou permanentemente o documento do cofre: ${existingDoc.name}`,
    );

    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function sign(req, res) {
  try {
    // Captura o IP real de onde o cliente está a aceder
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "IP Desconhecido";

    // Pega o e-mail do cliente injetado pelo nosso middleware de segurança
    const userEmail = req.query.userEmail;

    const signedDoc = await documentService.signDocument(
      req.companyId,
      req.params.id,
      userEmail,
      ipAddress
    );

    // 🕵️ ESPIÃO: Grava na Caixa Preta que o documento tem valor legal agora
    registerLog(
      req.companyId,
      { name: userEmail, role: "CLIENT" },
      "UPDATE",
      "COFRE DIGITAL",
      `Assinou eletronicamente o documento: ${signedDoc.name} (IP: ${ipAddress})`
    );

    return res.status(200).json(signedDoc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
