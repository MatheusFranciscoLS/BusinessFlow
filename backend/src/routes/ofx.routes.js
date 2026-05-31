import { Router } from "express";
import * as ofxController from "../controllers/ofx.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import multer from "multer"; // Importamos o multer diretamente aqui!

const router = Router();

// 🔥 Configuramos o Multer para NÃO gravar no disco do Render, apenas guardar na Memória (Buffer)
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.post(
  "/parse",
  authMiddleware,
  companyMiddleware,
  uploadMemory.single("file"), // Usamos o nosso multer de memória
  ofxController.parse,
);

export default router;
