import { Router } from "express";
import * as clientController from "../controllers/client.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/", authMiddleware, clientController.create);
router.get("/", authMiddleware, clientController.getAll);
router.get("/:id", authMiddleware, clientController.getById);
router.put("/:id", authMiddleware, clientController.update);
router.delete("/:id", authMiddleware, clientController.remove);

export default router;
