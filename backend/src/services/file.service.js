import path from "path";
import fs from "fs";
import prisma from "../config/prisma.js";

const uploadsRoot = path.resolve("uploads");

// Arquivos antigos, de antes de passarem a ficar no banco, ainda podem estar nestas pastas.
const legacyFolders = ["documents", "transactions"];

// O fileUrl dos arquivos no banco tem o formato "db:<id>/<nome>". O nome no final
// mantém a extensão visível para o painel saber se é PDF ou imagem.
const DB_PREFIX = "db:";

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

const safeName = (name) =>
  String(name || "arquivo")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-100);

const dbFileId = (fileUrl) =>
  fileUrl?.startsWith(DB_PREFIX) ? fileUrl.slice(DB_PREFIX.length).split("/")[0] : null;

// Guarda o arquivo enviado (multer em memória) no banco e devolve o fileUrl.
export async function saveUploadedFile(companyId, file) {
  const filename = safeName(file.originalname);
  const stored = await prisma.storedFile.create({
    data: { companyId, filename, size: file.size, data: file.buffer },
    select: { id: true },
  });
  return `${DB_PREFIX}${stored.id}/${filename}`;
}

// Apaga o arquivo do banco quando o documento ou lançamento some. Arquivos antigos
// do disco são deixados como estão.
export async function deleteStoredFile(fileUrl) {
  const id = dbFileId(fileUrl);
  if (!id) return;
  await prisma.storedFile.deleteMany({ where: { id } });
}

// Acha um arquivo antigo no disco. Usa só o nome do arquivo, então um fileUrl
// adulterado não sai da pasta de uploads.
function findLegacyFile(fileUrl) {
  if (!fileUrl) return null;
  const filename = path.basename(fileUrl);
  for (const folder of legacyFolders) {
    const candidate = path.join(uploadsRoot, folder, filename);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function setSafeHeaders(res, filename) {
  const contentType = inlineTypes[path.extname(filename).toLowerCase()];
  res.set("Content-Type", contentType || "application/octet-stream");
  if (!contentType) res.set("Content-Disposition", "attachment");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Content-Security-Policy", "sandbox");
  res.set("Cache-Control", "private, no-store");
}

// Entrega o arquivo ao usuário já autorizado pela rota que chamou.
// O companyId confere de novo que o arquivo é da empresa do documento.
export async function sendStoredFile(res, fileUrl, companyId) {
  const id = dbFileId(fileUrl);

  if (id) {
    const file = await prisma.storedFile.findFirst({
      where: { id, companyId },
      select: { filename: true, data: true },
    });
    if (!file) {
      return res.status(404).json({ error: "Arquivo não encontrado no servidor." });
    }
    setSafeHeaders(res, file.filename);
    return res.send(Buffer.from(file.data));
  }

  const filePath = findLegacyFile(fileUrl);
  if (!filePath) {
    return res.status(404).json({ error: "Arquivo não encontrado no servidor." });
  }
  setSafeHeaders(res, filePath);
  return res.sendFile(filePath);
}
