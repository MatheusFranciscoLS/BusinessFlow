import { Router } from "express";
import authRoutes from "./auth.routes.js";
import clientRoutes from "./client.routes.js";
import productRoutes from "./product.routes.js";
import transactionRoutes from "./transaction.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import appointmentRoutes from "./appointment.routes.js";

const router = Router();

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