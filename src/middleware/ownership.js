// ===============================================================
// 🔐 middleware/ownership.js — Controle de posse (anti-IDOR)
// ===============================================================
// Compara o userap_id solicitado na URL com o userap_id do token JWT.
// Equipe (Sindico/Funcionario/ADM) tem acesso amplo; Morador só aos
// próprios dados (mesmo userap_id do token).
//
// Em DEV (request.user._dev === true) mantém o comportamento permissivo
// do auth.js — nunca ativo em produção.
// ===============================================================

const TIPOS_EQUIPE = ['Sindico', 'Funcionario', 'ADM'];

// Verifica se o usuário autenticado é equipe (Sindico/Funcionario/ADM)
function isStaff(user) {
  return Boolean(user && TIPOS_EQUIPE.includes(user.userType));
}

// Verifica se o userap_id solicitado pertence ao usuário autenticado.
// Retorna true se for equipe ou se o userap_id bater com o do token.
function verificarPosseUserAp(user, userapIdSolicitado) {
  // DEV: request.user._dev só existe quando isDevMode() é true (auth.js),
  // nunca em produção — mantém o comportamento permissivo para testes locais.
  if (user && user._dev) return true;
  if (isStaff(user)) return true;
  if (!user || !user.userApId) return false;
  return Number(user.userApId) === Number(userapIdSolicitado);
}

// Middleware Express: usa request.params.userap_id como referência.
function isOwnerOrStaff(request, response, next) {
  // Em DEV, mantém o comportamento permissivo do auth.js (testes locais)
  if (request.user && request.user._dev) {
    return next();
  }

  const userapIdSolicitado = Number(request.params.userap_id);

  if (Number.isNaN(userapIdSolicitado)) {
    return response.status(400).json({
      sucesso: false,
      mensagem: 'O parâmetro userap_id é obrigatório e deve ser numérico.',
    });
  }

  if (verificarPosseUserAp(request.user, userapIdSolicitado)) {
    return next();
  }

  return response.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado. Você só pode acessar dados da sua própria unidade.',
  });
}

module.exports = { isOwnerOrStaff, isStaff, verificarPosseUserAp };
