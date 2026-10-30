import path from "path";
import fs from "fs";

const uploadsRoot = path.resolve("uploads");

// Pastas onde os anexos podem estar (o upload de lançamentos usa a de documentos).
const folders = ["documents", "transactions"];

// Só estes tipos abrem direto no navegador. Qualquer outro (HTML, SVG...) vai como
// download genérico, para um arquivo enviado não rodar script no site.
const inlineTypes = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
};

// Acha o arquivo no disco a partir do fileUrl guardado no banco.
// Usa só o nome do arquivo, então um fileUrl adulterado não sai da pasta de uploads.
export function findStoredFile(fileUrl) {
  if (!fileUrl) return null;
  const filename = path.basename(fileUrl);
  for (const folder of folders) {
    const candidate = path.join(uploadsRoot, folder, filename);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Entrega o arquivo ao usuário já autorizado pela rota que chamou.
export function sendStoredFile(res, fileUrl) {
  const filePath = findStoredFile(fileUrl);
  if (!filePath) {
    return res.status(404).json({ error: "Arquivo não encontrado no servidor." });
  }

  const contentType = inlineTypes[path.extname(filePath).toLowerCase()];
  res.set("Content-Type", contentType || "application/octet-stream");
  if (!contentType) res.set("Content-Disposition", "attachment");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Content-Security-Policy", "sandbox");
  res.set("Cache-Control", "private, no-store");
  return res.sendFile(filePath);
}
