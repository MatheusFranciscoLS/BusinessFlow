import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";
import { portalScope } from "../middlewares/portal.js";
import { requireManager } from "../middlewares/roles.js";
import upload from "../config/multer.js";

const router = Router();

router.use(authMiddleware);
router.use(companyMiddleware);
router.use(portalScope);

// Cliente do portal só lê os próprios lançamentos; criar, editar e apagar é do gestor.
router.get("/", transactionController.getAll);
router.get("/:id", transactionController.getById);
router.get("/:id/file", transactionController.downloadFile);

router.post("/", requireManager, upload.single("file"), transactionController.create);
router.put("/:id", requireManager, upload.single("file"), transactionController.update);
router.delete("/:id", requireManager, transactionController.remove);

export default router;
