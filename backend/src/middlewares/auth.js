import jwt from "jsonwebtoken";

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
    next();
  } catch (err) {
    return res.status(401).json({ message: "Sessão expirada ou token inválido." });
  }
}