import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// 🛡️ A VACINA DEFINITIVA: Cria a pasta ANTES do Multer ser configurado
const avatarFolder = path.resolve("uploads", "avatars");

if (!fs.existsSync(avatarFolder)) {
  fs.mkdirSync(avatarFolder, { recursive: true });
}

// Agora sim, configuramos o Multer com a certeza de que a pasta existe
const storage = multer.diskStorage({
  destination: avatarFolder, // Usa o caminho garantido
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(10).toString("hex");
    const fileName = `${fileHash}-${file.originalname}`;
    return cb(null, fileName);
  },
});

const upload = multer({ storage });
const router = Router();

router.get("/", authMiddleware, profileController.show);
router.put(
  "/",
  authMiddleware,
  upload.single("avatar"),
  profileController.update,
);

export default router;
