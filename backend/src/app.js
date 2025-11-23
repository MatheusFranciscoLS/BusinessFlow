import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CONFIGURAÇÃO CORS BLINDADA ---
// 1. Permite qualquer origem (Vercel, Localhost, etc)
app.use(cors());

// 2. Responde explicitamente a requisições OPTIONS (Preflight)
// Isso corrige o erro 404 que você está vendo
app.options("*", cors());

app.use(express.json());

// Configuração de Uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotas da API
app.use("/api", routes);

export default app;