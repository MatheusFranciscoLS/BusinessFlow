import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  companyMiddleware,
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
  transactionController.update,
);
router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  transactionController.remove,
);

export default router;
