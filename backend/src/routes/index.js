import { Router } from "express";

// Importação de todas as Rotas
import authRoutes from "./auth.routes.js";
import clientRoutes from "./client.routes.js";
import productRoutes from "./product.routes.js";
import transactionRoutes from "./transaction.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import profileRoutes from "./profile.routes.js"; // 🔥 O nosso novo ficheiro de Perfil

const router = Router();

// Rota de Teste (Health Check)
router.get("/", (req, res) => {
  res.json({ message: "API BusinessFlow a funcionar 🚀" });
});

// Definição das Rotas (Sem repetições)
router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);
router.use("/products", productRoutes);
router.use("/transactions", transactionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/profile", profileRoutes); // 🔥 A rota de perfil ligada corretamente!

export default router;
