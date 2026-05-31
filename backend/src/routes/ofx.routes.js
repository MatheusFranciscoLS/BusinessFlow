import { Router } from "express";
import * as ofxController from "../controllers/ofx.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { upload } from "../config/multer.js";

const router = Router();

// Apenas Gestores logados podem subir ficheiros OFX
router.post(
  "/parse",
  authMiddleware,
  companyMiddleware,
  upload.single("file"), // Middleware que intercepta o ficheiro
  ofxController.parse,
);

export default router;
