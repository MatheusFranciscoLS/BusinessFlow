import jwt from "jsonwebtoken";
import { DEMO_READ_ONLY_POSTS } from "../utils/demo.js";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Formato de token inválido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Injeta o ID e dados do usuário na requisição

    // Sessão da demonstração só lê: qualquer método que altera dados é recusado.
    if (decoded.demo && !READ_METHODS.has(req.method) && !DEMO_READ_ONLY_POSTS.includes(req.originalUrl.split("?")[0])) {
      return res.status(403).json({ error: "A demonstração é somente leitura: nada pode ser alterado." });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Sessão expirada ou token inválido." });
  }
}