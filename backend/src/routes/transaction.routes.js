import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/", authMiddleware, transactionController.create);
router.get("/", authMiddleware, transactionController.getAll);
router.get("/:id", authMiddleware, transactionController.getById);

router.put("/:id", authMiddleware, transactionController.update); 
// -----------------------------------------------

router.delete("/:id", authMiddleware, transactionController.remove);

export default router;