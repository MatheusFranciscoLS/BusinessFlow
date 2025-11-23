import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { upload } from "../config/multer.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  productController.create
);

router.get("/", authMiddleware, productController.getAll);
router.get("/:id", authMiddleware, productController.getById);

router.put(
  "/:id",
  authMiddleware,
  upload.array("images", 5),
  productController.update
);

router.delete("/:id", authMiddleware, productController.remove);

export default router;
