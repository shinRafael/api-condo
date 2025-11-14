// ===============================================================
// 📧 src/lib/mailer.js — Configuração do Nodemailer (Mailtrap)
// ===============================================================

const nodemailer = require('nodemailer');

// Configuração do transporter usando Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  port: process.env.MAILTRAP_PORT || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD
  }
});

// Verificar conexão (opcional, para debug)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erro na configuração do Mailtrap:', error);
  } else {
    console.log('✅ Mailtrap configurado e pronto para enviar emails');
  }
});

module.exports = transporter;
