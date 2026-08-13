const express = require('express');
const router = express.Router();

const notificacaoController = require('../controllers/notificacao');
const usuarioController = require('../controllers/usuario');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');
const { isOwnerOrStaff } = require('../middleware/ownership');

// ============================================================
// ROTAS PARA O PAINEL WEB (GESTÃO)
// ============================================================
router.get('/notificacoes/envios', verificarToken, isSindicoOrFuncionario, notificacaoController.listarEnviosAgrupados);
router.patch('/notificacoes/envio', verificarToken, isSindicoOrFuncionario, notificacaoController.editarEnvioAgrupado);
router.delete('/notificacoes/envio', verificarToken, isSindico, notificacaoController.apagarEnvioAgrupado);
router.post('/notificacao', verificarToken, isSindicoOrFuncionario, notificacaoController.cadastrarnotificacao);
router.patch('/notificacao/:id', verificarToken, isSindicoOrFuncionario, notificacaoController.editarnotificacao);
router.delete('/notificacao/:id', verificarToken, isSindico, notificacaoController.apagarnotificacao);

// ============================================================
// ROTAS PARA O APP (MORADOR)
// ============================================================
router.get('/notificacoes/importantes', verificarToken, isMorador, notificacaoController.listarAvisosImportantes);
router.get('/notificacao/:userap_id', verificarToken, isOwnerOrStaff, notificacaoController.listarnotificacao);

// ============================================================
// 📱 DISPOSITIVOS (push token do app mobile)
// ============================================================
router.post('/devices/register', verificarToken, usuarioController.registrarDispositivo);

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
  notificacaoController.marcarComoLida
);

module.exports = router;
