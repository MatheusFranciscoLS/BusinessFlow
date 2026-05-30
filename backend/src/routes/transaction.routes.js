import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { upload } from "../config/multer.js";
import { PrismaClient } from "@prisma/client"; // 🔥 Importamos o Prisma para a Segurança

const router = Router();
const prisma = new PrismaClient();

router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  upload.single("file"),
  transactionController.create,
);

// 🔥 INTERCEPTOR DE SEGURANÇA MÁXIMA (ISOLAMENTO DE CLIENTE)
router.get(
  "/",
  authMiddleware,
  companyMiddleware,
  async (req, res, next) => {
    try {
      const { role, userEmail, companyId } = req.query;

      // Se for o Sócio da Contabilidade, passa direto para ver tudo
      if (role !== "CLIENT") return next();

      // Se for Cliente, descobre o Dossiê dele cruzando o E-mail
      const client = await prisma.client.findFirst({
        where: { email: userEmail, companyId: companyId },
      });

      // Se o email não existir no CRM, bloqueia o acesso e devolve vazio!
      if (!client) return res.json([]);

      // 🔥 MÁGICA: Injeta o ID do cliente na query de forma oculta.
      // O Controller vai achar que foi um filtro normal e só vai devolver os dados dele!
      req.query.clientId = client.id;

      next(); // Libera a passagem para o Controller
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Falha na validação de segurança." });
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
