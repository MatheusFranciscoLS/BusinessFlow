import { Router } from "express";
import * as documentController from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

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

router.use(authMiddleware);
router.use(companyMiddleware);

// 🔥 INTERCEPTOR ZERO TRUST
router.use(async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;
    const loggedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!loggedUser)
      return res.status(401).json({ error: "Utilizador não encontrado." });

    // Sobrescreve a URL com a verdade
    req.query.role = loggedUser.role;
    req.query.userEmail = loggedUser.email;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança da rota." });
  }
});

router.post("/", upload.single("file"), documentController.create);
router.get("/", documentController.getAll);
router.delete("/:id", documentController.remove);

export default router;
