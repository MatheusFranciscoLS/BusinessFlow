import { describe, it, expect } from "vitest";
import { getMailConfig } from "../src/services/email.service.js";

describe("configuração do e-mail", () => {
  it("sem SMTP configurado usa o Gmail com a senha de app", () => {
    const config = getMailConfig({ EMAIL_USER: "escritorio@gmail.com", EMAIL_PASS: "senha-de-app" });

    expect(config.transport).toMatchObject({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: "escritorio@gmail.com", pass: "senha-de-app" },
    });
    expect(config.from).toBe("escritorio@gmail.com");
    expect(config.configured).toBe(true);
  });

  it("o SMTP de produção tem prioridade e define o remetente", () => {
    const config = getMailConfig({
      EMAIL_USER: "demo@gmail.com",
      EMAIL_PASS: "x",
      SMTP_HOST: "smtp.servico.com",
      SMTP_PORT: "587",
      SMTP_USER: "apikey",
      SMTP_PASS: "segredo",
      MAIL_FROM: "avisos@escritorio.com.br",
    });

    expect(config.transport).toMatchObject({ host: "smtp.servico.com", port: 587, secure: false, auth: { user: "apikey", pass: "segredo" } });
    expect(config.from).toBe("avisos@escritorio.com.br");
  });

  it("porta 465 usa conexão segura, a menos que SMTP_SECURE diga o contrário", () => {
    expect(getMailConfig({ SMTP_PORT: "465", SMTP_USER: "u", SMTP_PASS: "p" }).transport.secure).toBe(true);
    expect(getMailConfig({ SMTP_PORT: "465", SMTP_SECURE: "false", SMTP_USER: "u", SMTP_PASS: "p" }).transport.secure).toBe(false);
  });

  it("sem usuário nem senha, diz que não está configurado", () => {
    expect(getMailConfig({}).configured).toBe(false);
  });
});
