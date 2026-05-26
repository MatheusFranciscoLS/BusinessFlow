import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// 🔥 1. Garante que a pasta "uploads" existe sempre (Proteção contra o Render)
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🔥 2. Define onde e como o ficheiro será guardado
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Cria um nome único para não haver ficheiros duplicados
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err);
      const fileName = `${hash.toString("hex")}-${file.originalname.replace(/\s/g, "_")}`;
      cb(null, fileName);
    });
  },
});

// 🔥 3. O filtro de segurança: Agora aceita PDFs e Imagens!
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf", // O passe VIP para as Notas Fiscais e Boletos!
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato inválido. Envie apenas Imagens ou PDFs."));
    }
  },
});
