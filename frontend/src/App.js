import express from "express";
import cors from "cors"; // Importe a biblioteca
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CONFIGURAÇÃO CORS ---
// 1. Libera tudo
app.use(cors());

// 2. Força o Express a responder requisições OPTIONS (Preflight) em todas as rotas
// Isso resolve o erro 404 no OPTIONS
app.options('*', cors());

app.use(express.json());

// Pasta de uploads pública
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotas da API
app.use("/api", routes);

export default app;