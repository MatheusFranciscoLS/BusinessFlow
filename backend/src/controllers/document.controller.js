import * as documentService from "../services/document.service.js";
// 🔥 Importamos o novo serviço de e-mail e o banco de dados
import { sendDocumentNotification } from "../services/email.service.js";
import { PrismaClient } from "@prisma/client";

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

    // 🔥 2. A MÁGICA: Gatilho de E-mail em Background!
    // 🥶 [GELADEIRA]: Desativado temporariamente devido ao bloqueio de portas do Render Gratuito.
    /*
    if (req.body.clientId) {
      Promise.all([
        prisma.client.findUnique({ where: { id: req.body.clientId } }),
        prisma.company.findUnique({ where: { id: req.companyId } }),
      ])
        .then(([client, company]) => {
          if (client && client.email && company) {
            const primeiroNome = client.fullName.split(" ")[0];
            sendDocumentNotification(client.email, primeiroNome, document.name, company.name);
          }
        })
        .catch((err) => console.error("Erro ao buscar dados para o e-mail:", err));
    }
    */

    // 3. Devolve o sucesso imediatamente para o Front-end não ficar travado!
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
    await documentService.deleteDocument(req.companyId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
