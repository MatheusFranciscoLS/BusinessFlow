import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { upload } from "../config/multer.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  upload.single("file"),
  transactionController.create,
);

// 🔥 INTERCEPTOR ZERO TRUST (BASEADO NO TOKEN CRIPTOGRAFADO)
router.get(
  "/",
  authMiddleware,
  companyMiddleware,
  async (req, res, next) => {
    try {
      // 1. Extraímos a identidade DIRETO DO TOKEN JWT (À prova de manipulações e delays do React)
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      // 2. Se for Sócio/Admin, permite acesso total e passa para o Controller
      if (userRole !== "CLIENT") return next();

      // 3. Se for Cliente, busca o Dossiê dele cruzando o E-mail de forma silenciosa
      const client = await prisma.client.findFirst({
        where: { email: userEmail, companyId: req.companyId },
      });

      // Se não achar o dossiê, a porta fecha e devolve VAZIO!
      if (!client) return res.json([]);

      // 4. Injeta a trava de filtro oculta no Controller
      req.query.clientId = client.id;

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Falha crítica na segurança da rota." });
    }
  },
  transactionController.getAll,
);

router.get(
  "/:id",
  authMiddleware,
  companyMiddleware,
  transactionController.getById,
);
router.put(
  "/:id",
  authMiddleware,
  companyMiddleware,
  upload.single("file"),
  transactionController.update,
);
router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  transactionController.remove,
);

export default router;
