import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { upload } from "../config/multer.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// 1. Aplica a segurança em TODAS as rotas financeiras
router.use(authMiddleware);
router.use(companyMiddleware);

router.post("/", upload.single("file"), transactionController.create);

// 🔥 2. INTERCEPTOR ZERO TRUST (Prova de Balas)
router.get(
  "/",
  async (req, res, next) => {
    try {
      // Pega o ID infalsificável de quem fez o login
      const userId = req.user?.id || req.userId;

      // Vai ao banco confirmar quem é a pessoa
      const loggedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!loggedUser)
        return res.status(401).json({ error: "Utilizador não encontrado." });

      // Se for o Gestor do Escritório, porta aberta!
      if (loggedUser.role !== "CLIENT") return next();

      // Se for Cliente, cruza o E-mail REAL do banco para achar o dossiê
      const client = await prisma.client.findFirst({
        where: { email: loggedUser.email, companyId: req.companyId },
      });

      // Se o cliente não existir no CRM, devolve um array vazio (Bloqueio Total)
      if (!client) return res.json([]);

      // Injeta o ID real e avança
      req.query.clientId = client.id;
      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Falha crítica de segurança no financeiro." });
    }
  },
  transactionController.getAll,
);

router.get("/:id", transactionController.getById);
router.put("/:id", upload.single("file"), transactionController.update);
router.delete("/:id", transactionController.remove);

export default router;
