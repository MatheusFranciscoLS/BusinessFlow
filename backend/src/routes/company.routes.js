import { Router } from "express";
import * as companyController from "../controllers/company.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/", authMiddleware, companyController.create);
router.get("/", authMiddleware, companyController.getAll);
router.put("/:id", authMiddleware, companyController.update);
router.delete("/:id", authMiddleware, companyController.remove);

export default router;
