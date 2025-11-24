import express from "express";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CORREÇÃO MANUAL DE CORS (INFALÍVEL) ---
app.use((req, res, next) => {
  // Lista de sites permitidos
  const allowedOrigins = [
    'https://flowbusiness.vercel.app', // Seu Frontend na Vercel
    'http://localhost:3000',                  // Seu Localhost
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  
  // Se a origem de quem chamou estiver na lista, a gente permite
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Define os métodos e cabeçalhos permitidos
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Se for a pergunta "Posso entrar?" (OPTIONS), responde SIM imediatamente
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

export default app;