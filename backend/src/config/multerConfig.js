import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import multer from "multer";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: "uploads/avatars/", // A pasta correta!
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(10).toString("hex");
    const fileName = `${fileHash}-${file.originalname}`;
    return cb(null, fileName);
  },
});
const upload = multer({ storage });

const router = Router();
router.get("/", authMiddleware, profileController.show);
router.put(
  "/",
  authMiddleware,
  upload.single("avatar"),
  profileController.update,
);

export default router;
