import multer from "multer";
import path from "path";
import fs from "fs";

// Cria a pasta principal se não existir
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/misc";

    // Roteamento inteligente de pastas
    if (file.fieldname === "avatar" || req.originalUrl.includes("profile")) {
      folder = "uploads/avatars";
    } else if (
      file.fieldname === "file" ||
      req.originalUrl.includes("document")
    ) {
      folder = "uploads/documents";
    } else if (req.originalUrl.includes("ofx")) {
      folder = "uploads/ofx"; // Pasta temporária para extratos
    }

    // Garante que a subpasta existe
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Nome à prova de bala
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

export default multer({ storage });
