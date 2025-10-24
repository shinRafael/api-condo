const express = require('express');
const router = express.Router();

const NotificacaoController = require('../controllers/notificacao');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// ============================================================
// ROTAS PARA O PAINEL WEB (GESTÃO)
// ============================================================
router.get('/notificacoes/envios', verificarToken, isSindicoOrFuncionario, NotificacaoController.listarEnviosAgrupados);
router.patch('/notificacoes/envio', verificarToken, isSindicoOrFuncionario, NotificacaoController.editarEnvioAgrupado);
router.delete('/notificacoes/envio', verificarToken, isSindico, NotificacaoController.apagarEnvioAgrupado);
router.post('/notificacao', verificarToken, isSindicoOrFuncionario, NotificacaoController.cadastrarnotificacao);
router.patch('/notificacao/:id', verificarToken, isSindicoOrFuncionario, NotificacaoController.editarnotificacao);
router.delete('/notificacao/:id', verificarToken, isSindico, NotificacaoController.apagarnotificacao);

// ============================================================
// ROTAS PARA O APP (MORADOR)
// ============================================================
router.get('/notificacoes/importantes', verificarToken, isMorador, NotificacaoController.listarAvisosImportantes);
router.get('/notificacao/:userap_id', verificarToken, isMorador, NotificacaoController.listarnotificacao);

// 🔄 AGORA PERMITE SÍNDICO E MORADOR MARCAREM COMO LIDA
router.patch(
  '/notificacao/:not_id/lida',
  verificarToken,
  (req, res, next) => {
    const tipo = req.user?.userType;
    if (tipo === 'Morador' || tipo === 'Sindico') return next();
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Apenas Moradores ou Síndicos podem marcar notificações como lidas.',
    });
  },
  NotificacaoController.marcarComoLida
);

module.exports = router;