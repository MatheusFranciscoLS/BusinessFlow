// Libera só quem gerencia o escritório. O perfil CLIENT (portal) fica de fora.
// Usa o perfil do token, que o próprio servidor assinou no login.
// Libera só o dono e os sócios da equipe (o analista fica de fora). Rodar depois do
// companyMiddleware, que define req.teamRole.
export function requireSocio(req, res, next) {
  if (req.teamRole !== "OWNER" && req.teamRole !== "SOCIO") {
    return res
      .status(403)
      .json({ error: "Ação restrita aos sócios do escritório." });
  }
  next();
}

export function requireManager(req, res, next) {
  if (req.user?.role === "CLIENT") {
    return res
      .status(403)
      .json({ error: "Acesso restrito à gestão do escritório." });
  }
  next();
}
