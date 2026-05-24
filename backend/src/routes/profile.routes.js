import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { upload } from "../config/multer.js"; // Reaproveitando a sua config de imagens!

const router = Router();

// Rota para buscar os dados do perfil
router.get("/", authMiddleware, profileController.show);

// Rota para atualizar o perfil (com suporte ao upload de avatar)
router.put(
  "/",
  authMiddleware,
  upload.single("avatar"),
  profileController.update,
);

export default router;
