const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_trocar_em_prod';

// ============================================================
// FUNÇÃO PRINCIPAL: verificarToken
// ============================================================
function verificarToken(request, response, next) {
  // ========================================================
  // 🧩 MODO DEV - ignora autenticação e simula um usuário
  // ========================================================
  if (process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true') {
  const headerDevUser = request.headers['x-dev-user'];
  if (headerDevUser) {
    try {
      const userSimulado = JSON.parse(headerDevUser);
      request.user = userSimulado;
      console.log(`🧩 [AUTH DEV] Usuário simulado recebido do front: ${userSimulado.userType}`);
    } catch (err) {
      console.warn('⚠️ Cabeçalho X-Dev-User inválido.');
    }
  } else {
    request.user = { userId: 1, userType: 'Sindico' };
    console.log('🧩 [AUTH DEV] Usuário padrão: Síndico');
  }
  return next();
}
  // ========================================================
  // 🔒 MODO PRODUÇÃO - exige token válido
  // ========================================================
  const authHeader = request.headers.authorization;

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

    console.log('\x1b[32m%s\x1b[0m', `🔐 Usuário autenticado: ID=${payload.userId}, Tipo=${payload.userType}`);
    next();
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro de autenticação:', error.message);
    return response.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido ou expirado.',
    });
  }
}

// ============================================================
// MIDDLEWARES DE AUTORIZAÇÃO (Controle de Acesso por Papel)
// ============================================================

// Apenas Síndico
const isSindico = (request, response, next) => {
  console.log('🔐 [AUTH] Verificando acesso de Síndico...', { userType: request.user?.userType });
  
  if (request.user && request.user.userType === 'Sindico') {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Requer privilégios de Síndico.',
  });
};

// Síndico OU Funcionário (porteiro)
const isSindicoOrFuncionario = (request, response, next) => {
  console.log('🔐 [AUTH] Verificando acesso de Síndico/Funcionário...', { userType: request.user?.userType });
  
  if (
    request.user &&
    (request.user.userType === 'Sindico' || request.user.userType === 'Funcionario')
  ) {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Requer privilégios de Síndico ou Funcionário.',
  });
};

// Apenas Morador
const isMorador = (request, response, next) => {
  console.log('🔐 [AUTH] Verificando acesso de Morador...', { userType: request.user?.userType });
  
  if (request.user && request.user.userType === 'Morador') {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Requer privilégios de Morador.',
  });
};

// ============================================================
// EXPORTA TODOS OS MIDDLEWARES
// ============================================================
module.exports = {
  verificarToken,
  isSindico,
  isSindicoOrFuncionario,
  isMorador,
};