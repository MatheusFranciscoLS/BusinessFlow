import nodemailer from "nodemailer";

// Motor de ligação ao Gmail (Custo Zero)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Usa conexão criptografada SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || "https://flowbusiness.vercel.app";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function sendPasswordResetEmail(user, token) {
  const resetLink = `${FRONTEND_URL}/#/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`;

  await transporter.sendMail({
    from: `"BusinessFlow Segurança" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Recuperação de Senha - BusinessFlow",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #2d3748; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #3182ce; margin-top: 0;">Olá, ${escapeHtml(user.name)}!</h2>
        <p>Recebemos uma solicitação para redefinir a sua senha de acesso à plataforma.</p>
        <p>Clique no botão abaixo para escolher uma nova senha. O link vale por 1 hora e só pode ser usado uma vez.</p>
        <a href="${resetLink}" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px; font-weight: bold;">Redefinir Minha Senha</a>
        <p style="margin-top: 32px; font-size: 12px; color: #a0aec0;">Se não pediu esta alteração, ignore este e-mail.</p>
      </div>
    `,
  });
}

export async function sendDocumentNotification(
  clientEmail,
  clientName,
  documentName,
  companyName,
) {
  try {
    const mailOptions = {
      from: `"${companyName}" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: "📄 Novo Documento no seu Cofre Digital",
      html: `
        <div style="font-family: Arial, sans-serif; color: #2d3748; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="color: #3182ce; margin-top: 0;">Olá, ${clientName}!</h2>
          <p style="font-size: 15px; line-height: 1.5;">O escritório <strong>${companyName}</strong> acabou de arquivar um novo documento de forma segura no seu portal.</p>
          
          <div style="background: #f7fafc; padding: 16px; border-left: 4px solid #3182ce; border-radius: 4px; margin: 24px 0;">
            <strong style="color: #4a5568; font-size: 12px; text-transform: uppercase;">Documento Adicionado:</strong><br/>
            <span style="font-size: 16px; color: #2d3748; font-weight: bold;">${documentName}</span>
          </div>
          
          <p style="font-size: 15px;">Aceda ao seu Cofre Digital para visualizar ou baixar o ficheiro de forma segura.</p>
          
          <a href="https://flowbusiness.vercel.app" style="display: inline-block; background: #3182ce; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">Acessar Portal do Cliente</a>
          
          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 32px 0;" />
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">Este é um e-mail automático de segurança gerado pela plataforma BusinessFlow. Por favor, não responda diretamente a este e-mail.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificação enviada silenciosamente para: ${clientEmail}`);
  } catch (error) {
    console.error("❌ Erro no background ao enviar e-mail:", error);
  }
}
