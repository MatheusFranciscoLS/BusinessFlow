import express from "express";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CORS DINÂMICO (ACEITA TUDO) ---
app.use((req, res, next) => {
  // Pega quem está chamando (Vercel ou Localhost)
  const origin = req.headers.origin;

  // Devolve o cabeçalho permitindo exatamente quem chamou
  // Se não tiver origem (ex: Postman), permite '*'
  res.header("Access-Control-Allow-Origin", origin || "*");

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Responde ao Preflight (OPTIONS) imediatamente
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

export default app;