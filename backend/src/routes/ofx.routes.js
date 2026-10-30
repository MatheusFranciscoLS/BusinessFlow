import { Router } from "express";
import * as ofxController from "../controllers/ofx.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { requireManager } from "../middlewares/roles.js";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// O extrato é lido na memória (nada é gravado no disco do servidor) e é coisa do gestor.
router.post(
  "/parse",
  authMiddleware,
  requireManager,
  companyMiddleware,
  upload.single("file"),
  ofxController.parse,
);

export default router;
