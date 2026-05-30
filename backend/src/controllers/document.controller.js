import * as documentService from "../services/document.service.js";

export async function create(req, res) {
  try {
    const fileUrl = req.file ? `/uploads/documents/${req.file.filename}` : null;
    if (!fileUrl)
      return res
        .status(400)
        .json({ error: "Ficheiro não recebido pelo servidor." });

    const document = await documentService.createDocument(
      req.companyId,
      req.body,
      fileUrl,
    );
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
