import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { companyMiddleware } from "../middlewares/company.js"; // 🔥 O Segurança
import { upload } from "../config/multer.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  companyMiddleware,
  upload.array("images", 5),
  productController.create,
);
router.get("/", authMiddleware, companyMiddleware, productController.getAll);
router.get(
  "/:id",
  authMiddleware,
  companyMiddleware,
  productController.getById,
);
router.put(
  "/:id",
  authMiddleware,
  companyMiddleware,
  upload.array("images", 5),
  productController.update,
);
router.delete(
  "/:id",
  authMiddleware,
  companyMiddleware,
  productController.remove,
);

export default router;
