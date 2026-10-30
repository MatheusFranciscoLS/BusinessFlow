import { Router } from "express";
import * as documentController from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { portalScope } from "../middlewares/portal.js";
import { requireManager } from "../middlewares/roles.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import prisma from "../config/prisma.js";

const router = Router();

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
router.use(portalScope);

// Perfil e e-mail vêm do banco (nunca da URL) e seguem para os controllers.
router.use(async (req, res, next) => {
  try {
    const loggedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, email: true },
    });
    if (!loggedUser)
      return res.status(401).json({ error: "Utilizador não encontrado." });

    req.query.role = loggedUser.role;
    req.query.userEmail = loggedUser.email;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Falha na segurança da rota." });
  }
});

router.put("/:id/read", documentController.markAsRead);
router.get("/:id/file", documentController.downloadFile);
router.put("/:id/sign", documentController.sign);
router.get("/", documentController.getAll);

router.post("/", requireManager, upload.single("file"), documentController.create);
router.delete("/:id", requireManager, documentController.remove);

export default router;
