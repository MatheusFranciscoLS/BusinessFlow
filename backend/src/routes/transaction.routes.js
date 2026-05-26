import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { upload } from "../config/multer.js"; // 🔥 Importamos o gestor de ficheiros

const router = Router();

// 🔥 Adicionamos o upload.single('file') para processar o anexo
router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  upload.single("file"),
  transactionController.create,
);
router.get(
  "/",
  authMiddleware,
  companyMiddleware,
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
