import { Router } from "express";
import * as documentController from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();

// Configuração segura da pasta do Cofre
const docFolder = path.resolve("uploads", "documents");
if (!fs.existsSync(docFolder)) fs.mkdirSync(docFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: docFolder,
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(10).toString("hex");
    cb(null, `${hash}-${file.originalname.replace(/\s/g, "_")}`);
  },
});
const upload = multer({ storage });

// 🔥 Arquitetura MVC Perfeita: Rota -> Middleware de Empresa -> Controller
router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  upload.single("file"),
  documentController.create,
);
router.get("/", authMiddleware, companyMiddleware, documentController.getAll);
router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  documentController.remove,
);

export default router;
