import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Organiza as fotos direto na pasta de produtos
const uploadFolder = path.resolve(__dirname, "../../uploads/products");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// 🔒 SEGURANÇA: Filtro de extensão e validação de tipo
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Rejeita silenciosamente ou envia erro
    cb(new Error("Formato inválido. Apenas JPG, PNG ou WEBP são aceitos."));
  }
};

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 🔒 SEGURANÇA: Limite de 5MB por foto
  fileFilter 
});