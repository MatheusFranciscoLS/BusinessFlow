import { Router } from "express";

// Importação das Rotas Corretas e Limpas
import authRoutes from "./auth.routes.js";
import clientRoutes from "./client.routes.js";
import transactionRoutes from "./transaction.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import profileRoutes from "./profile.routes.js";
import companyRoutes from "./company.routes.js";
import taskRoutes from "./task.routes.js"; // 🔥 O Kanban
import ticketRoutes from "./ticket.routes.js"; // 🔥 O Helpdesk
import documentRoutes from "./document.routes.js"; // 🔥 O Cofre Digital
import ofxRoutes from "./ofx.routes.js";
import auditRoutes from "./audit.routes.js";
import reconciliationRoutes from "./reconciliation.routes.js";
import feesRoutes from "./fees.routes.js";
import portalRoutes from "./portal.routes.js";
import privacyRoutes from "./privacy.routes.js";
import teamRoutes from "./team.routes.js";
import obligationsRoutes from "./obligations.routes.js";
import homeRoutes from "./home.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "API BusinessFlow a funcionar 🚀 (Segurança Máxima)" });
});

router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/clients", clientRoutes);
// router.use("/products", productRoutes); <- REMOVIDO!
// router.use("/appointments", appointmentRoutes); <- REMOVIDO!
router.use("/transactions", transactionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/tasks", taskRoutes);
router.use("/tickets", ticketRoutes);
router.use("/documents", documentRoutes);
router.use("/ofx", ofxRoutes);
router.use("/audit", auditRoutes);
router.use("/reconciliation", reconciliationRoutes);
router.use("/fees", feesRoutes);
router.use("/portal", portalRoutes);
router.use("/privacy", privacyRoutes);
router.use("/team", teamRoutes);
router.use("/obligations", obligationsRoutes);
router.use("/home", homeRoutes);

export default router;
