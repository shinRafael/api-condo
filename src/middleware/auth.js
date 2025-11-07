// auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_trocar_em_prod';

// Helper: detectar modo dev com tolerância a strings
const isDevMode = () => {
  const env = (process.env.NODE_ENV || '').toString().trim().toLowerCase();
  const devFlag = (process.env.DEV_MODE || '').toString().trim().toLowerCase();
  return env === 'development' || devFlag === 'true';
};

// Helper: tentar parse seguro de JSON
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// ============================================================
// MIDDLEWARE PRINCIPAL: verificarToken
// - Em DEV: ignora JWT e injeta request.user (acesse tudo).
// - Em PROD: valida Bearer JWT e coloca payload em request.user.
// ============================================================
function verificarToken(request, response, next) {
  // =========================
  //  MODO DEV: bypass completo
  // =========================
  if (isDevMode()) {
    // 1) Se frontend enviar header X-Dev-User com JSON, usa isso
    const headerDevUser = request.headers['x-dev-user'];
    if (headerDevUser) {
      const parsed = safeJsonParse(headerDevUser);
      if (parsed && parsed.userType) {
        request.user = { ...parsed, _dev: true };
        console.log('\x1b[33m%s\x1b[0m', `🧩 [AUTH DEV] Usuário simulado via header: ${request.user.userType} (ID: ${request.user.userId || 'N/A'})`);
        return next();
      } else {
        console.warn('\x1b[33m%s\x1b[0m', '⚠️ [AUTH DEV] Cabeçalho X-Dev-User inválido — deve ser JSON com pelo menos userType. Ex: {"userId":1,"userType":"Morador"}');
      }
    }

    // 2) Se query ?role=Funcionario estiver presente, usa isso (útil pra testar direto via URL)
    const roleQuery = (request.query && request.query.role) || null;
    if (roleQuery) {
      request.user = { userId: 1, userType: roleQuery, _dev: true };
      console.log('\x1b[33m%s\x1b[0m', `🧩 [AUTH DEV] Usuário simulado via query: ${request.user.userType}`);
      return next();
    }

    // 3) Fallback: usuário padrão em DEV — SÍNDICO (acesso total)
    request.user = { userId: 1, userType: 'Sindico', _dev: true };
    console.log('\x1b[33m%s\x1b[0m', '🧩 [AUTH DEV] Modo DEV ativo — usuário padrão: Sindico (acesso total)');
    return next();
  }

  // =========================
  //  MODO PRODUÇÃO: validar JWT
  // =========================
  const authHeader = request.headers.authorization || request.headers.Authorization;
  if (!authHeader) {
    return response.status(401).json({
      sucesso: false,
      mensagem: 'Token de autenticação não fornecido.',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return response.status(401).json({
      sucesso: false,
      mensagem: 'Token mal formatado. O formato é: Bearer <token>',
    });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    request.user = payload;
    console.log('\x1b[32m%s\x1b[0m', `🔐 [AUTH] Usuário autenticado: ID=${payload.userId || 'N/A'}, Tipo=${payload.userType || 'N/A'}`);
    return next();
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ [AUTH] Erro de autenticação:', error.message);
    
    // Diferenciar entre token expirado e token inválido
    if (error.name === 'TokenExpiredError') {
      return response.status(401).json({
        sucesso: false,
        mensagem: 'Token expirado. Faça login novamente.',
        codigo: 'TOKEN_EXPIRADO',
        expiradoEm: error.expiredAt,
      });
    }
    
    return response.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido.',
      codigo: 'TOKEN_INVALIDO',
    });
  }
}

// ============================================================
// MIDDLEWARES DE AUTORIZAÇÃO (controle por papel)
// Observação: em DEV request.user._dev === true é setado e => passa nas checagens
// ============================================================

// Apenas Síndico
const isSindico = (request, response, next) => {
  const user = request.user || {};
  console.log('🔐 [AUTH] isSindico check —', { userType: user.userType, dev: user._dev || false });

  // Em DEV, se _dev = true e userType undefined, damos acesso (já setado como Sindico no verificarToken)
  if (user._dev || user.userType === 'Sindico') {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Requer privilégios de Síndico.',
  });
};

// Síndico OU Funcionário (porteiro)
const isSindicoOrFuncionario = (request, response, next) => {
  const user = request.user || {};
  console.log('🔐 [AUTH] isSindicoOrFuncionario check —', { userType: user.userType, dev: user._dev || false });

  if (user._dev || user.userType === 'Sindico' || user.userType === 'Funcionario') {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Requer privilégios de Síndico ou Funcionário.',
  });
};

// Apenas Morador
const isMorador = (request, response, next) => {
  const user = request.user || {};
  console.log('🔐 [AUTH] isMorador check —', { userType: user.userType, dev: user._dev || false });

  // Em DEV, _dev true permite ver tudo — útil para testes
  if (user._dev || user.userType === 'Morador') {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Requer privilégios de Morador.',
  });
};

// ============================================================
// Export
// ============================================================
module.exports = {
  verificarToken,
  isSindico,
  isSindicoOrFuncionario,
  isMorador,
};
