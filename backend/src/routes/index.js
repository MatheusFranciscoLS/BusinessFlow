import { Router } from "express";
import authRoutes from "./auth.routes.js";
import clientRoutes from "./client.routes.js";
import productRoutes from "./product.routes.js";
import transactionRoutes from "./transaction.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.js"; // ajuste conforme seu projeto
import multer from "multer";
import crypto from "crypto";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(10).toString("hex");
    const fileName = `${fileHash}-${file.originalname}`;
    return cb(null, fileName);
  },
});
const upload = multer({ storage });

routes.get("/profile", ensureAuthenticated, profileController.show);
routes.put(
  "/profile",
  ensureAuthenticated,
  upload.single("avatar"),
  profileController.update,
);

// Rota de teste
router.get("/", (req, res) => {
  res.json({ message: "API BusinessFlow funcionando 🚀" });
});

// Definição das Rotas
router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/products", productRoutes);
router.use("/transactions", transactionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/appointments", appointmentRoutes);

export default router;