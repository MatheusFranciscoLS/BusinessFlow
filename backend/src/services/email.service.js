import nodemailer from "nodemailer";

// Motor de ligação ao Gmail (Custo Zero)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // O seu e-mail do Gmail
    pass: process.env.EMAIL_PASS, // A "Senha de App" gerada no Google
  },
});

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
