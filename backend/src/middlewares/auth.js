import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  console.log("HEADER RECEBIDO:", req.headers.authorization);

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("ERRO: Nenhum token enviado.");
    return res.status(401).json({ message: "Token não enviado." });
  }

  const [, token] = authHeader.split(" ");

  console.log("TOKEN EXTRAÍDO:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("TOKEN DECODIFICADO:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("ERRO NO JWT:", err.message);
    return res.status(401).json({ message: "Token inválido." });
  }
}
