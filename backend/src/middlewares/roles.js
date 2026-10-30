// Libera só quem gerencia o escritório. O perfil CLIENT (portal) fica de fora.
// Usa o perfil do token, que o próprio servidor assinou no login.
export function requireManager(req, res, next) {
  if (req.user?.role === "CLIENT") {
    return res
      .status(403)
      .json({ error: "Acesso restrito à gestão do escritório." });
  }
  next();
}
