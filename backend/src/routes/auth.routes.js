import { Router } from "express";
// AQUI ESTAVA O ERRO: Precisamos importar tudo como 'authController'
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// Rotas de Autenticação
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;