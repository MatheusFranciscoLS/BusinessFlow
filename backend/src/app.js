import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// 🛡️ 1. CAMADAS DE SEGURANÇA GLOBAIS (O Escudo)
// ==========================================

// Oculta a tecnologia do servidor e protege contra injeções XSS
app.use(helmet());

// Proteção Anti-DDoS e Força Bruta (Máximo 300 requisições a cada 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: "Muitas requisições desta rede. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS Restrito (Só o seu Front-end pode falar com este Back-end)
const corsOptions = {
  origin: [
    "https://flowbusiness.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ==========================================
// 📦 2. MIDDLEWARES DE DADOS E ARQUIVOS
// ==========================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trava para não executar scripts maliciosos disfarçados de imagem na pasta de upload
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      res.set("X-Content-Type-Options", "nosniff");
    },
  }),
);

// ==========================================
// 🚀 3. ROTAS DA APLICAÇÃO
// ==========================================

app.use("/api", routes);

// ==========================================
// 🪂 4. O PARAQUEDAS (Global Error Handler)
// ==========================================

app.use((err, req, res, next) => {
  console.error("🔥 Erro Capturado Globalmente:", err.stack);

  // Tratamento especial se o cliente tentar enviar um ficheiro gigante que o Multer recuse
  if (err.name === "MulterError") {
    return res
      .status(400)
      .json({
        error:
          "Erro no envio do ficheiro. O arquivo excede os limites permitidos.",
      });
  }

  res.status(500).json({
    error:
      "Ocorreu um erro interno no servidor. A equipa de suporte foi notificada.",
  });
});

export default app;
