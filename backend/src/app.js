import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// --- CORREÇÃO DO CORS (LIBERA TUDO) ---
app.use(cors({
  origin: "*", // Permite qualquer site (Vercel, Localhost, etc)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Permite todos os métodos
  allowedHeaders: ["Content-Type", "Authorization"], // Permite envio de JSON e Token
}));

app.use(express.json());

// Configuração de Uploads (Mantida igual você mandou)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", routes);

export default app;