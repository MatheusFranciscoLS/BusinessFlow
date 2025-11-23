import express from "express";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- OPÇÃO NUCLEAR DE CORS (Manual) ---
// Isso força os cabeçalhos em TODAS as respostas
app.use((req, res, next) => {
  // Permite qualquer origem (Frontend)
  res.header("Access-Control-Allow-Origin", "*"); 
  
  // Permite os métodos que usamos
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS, PATCH");
  
  // Permite os cabeçalhos que o axios manda
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Se for o "batedor" (OPTIONS), responde OK imediatamente e para por aqui
  if (req.method === "OPTIONS") {
    return res.status(200).send({});
  }

  next();
});

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

export default app;