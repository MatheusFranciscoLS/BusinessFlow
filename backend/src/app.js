import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔒 SEGURANÇA: Configuração de CORS Restrito
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
app.use("/uploads", express.static(path.resolve("uploads")));

// 🔒 SEGURANÇA: Limita o tamanho do JSON
app.use(express.json({ limit: "10mb" }));

// 📂 Trava para não executar scripts na pasta de upload
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      res.set("X-Content-Type-Options", "nosniff");
    },
  }),
);

// Mapeia todas as rotas
app.use("/api", routes);

// 🔥 O AIRBAG GLOBAL: Se o sistema tentar quebrar, este código captura a queda!
app.use((err, req, res, next) => {
  console.error("🔥 Erro Capturado Globalmente:", err.stack);
  res.status(500).json({
    error:
      "Ocorreu um erro interno no servidor. A equipa de suporte foi notificada.",
  });
});

export default app;
