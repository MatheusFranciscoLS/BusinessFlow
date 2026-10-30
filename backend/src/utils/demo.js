// Demonstração: um escritório fictício, com dados inventados, para mostrar o sistema
// (estudo de caso, apresentação). As contas da demo usam e-mails deste domínio.
export const DEMO_DOMAIN = "businessflow.demo";

export const DEMO_PROFILES = {
  gestor: `gestor@${DEMO_DOMAIN}`,
  analista: `analista@${DEMO_DOMAIN}`,
  cliente: `cliente@${DEMO_DOMAIN}`,
};

export const isDemoEmail = (email) => String(email || "").toLowerCase().endsWith(`@${DEMO_DOMAIN}`);

// A entrada sem senha só existe se o servidor foi ligado com DEMO_MODE=true.
export const isDemoEnabled = () => process.env.DEMO_MODE === "true";

// Na demonstração só se lê. Estas rotas são POST, mas só calculam e não gravam nada.
export const DEMO_READ_ONLY_POSTS = ["/api/reconciliation/suggest", "/api/ofx/parse"];
