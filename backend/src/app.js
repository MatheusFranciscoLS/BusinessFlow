import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import ofxRoutes from "./routes/ofx.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔒 SEGURANÇA: Configuração de CORS Restrito (Whitelist)
const corsOptions = {
  origin: [
    "https://flowbusiness.vercel.app", // Seu domínio de produção
    "http://localhost:5173",           // Porta padrão do Vite
    "http://localhost:3000"            // Porta padrão do Create React App
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 🔒 SEGURANÇA: Limita o tamanho do JSON para evitar sobrecarga de memória
app.use(express.json({ limit: "10mb" }));

// 📂 Pasta de uploads pública com trava para não executar scripts acidentalmente
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
  setHeaders: (res, filePath) => {
    res.set("X-Content-Type-Options", "nosniff");
  }
}));

// Rotas da API
app.use("/api", routes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ofx", ofxRoutes);
app.use("/api/tickets", ticketRoutes);

export default app;