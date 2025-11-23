import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --- CORREÇÃO AQUI ---
// process.cwd() pega a raiz do projeto (onde está o package.json)
// Assim ele acha a pasta 'uploads' com certeza.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", routes);

export default app;