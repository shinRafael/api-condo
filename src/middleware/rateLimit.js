// ===============================================================
// 🚦 middleware/rateLimit.js — proteção contra brute-force e abuso
// ===============================================================
const rateLimit = require('express-rate-limit');

// Limite global: 300 req/15min por IP (API de condomínio é de baixo volume)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições. Tente novamente em 15 minutos.',
    codigo: 'RATE_LIMIT_EXCEEDED',
  },
});

// Login: 10 tentativas / 15 min (não conta sucessos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login. Aguarde 15 minutos.',
    codigo: 'AUTH_RATE_LIMIT',
  },
});

// Recuperação de senha: 3 solicitações / hora (anti email bombing)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas solicitações de recuperação de senha. Aguarde 1 hora.',
    codigo: 'PASSWORD_RESET_RATE_LIMIT',
  },
});

// Upload: 20 arquivos / hora
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Limite de uploads atingido. Aguarde 1 hora.',
    codigo: 'UPLOAD_RATE_LIMIT',
  },
});

module.exports = { globalLimiter, loginLimiter, passwordResetLimiter, uploadLimiter };
