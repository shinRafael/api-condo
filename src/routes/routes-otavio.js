const express = require('express');
const router = express.Router();

const NotificacaoController = require('../controllers/notificacao');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// WEB (Gestão)
router.get('/notificacoes/envios', verificarToken, isSindicoOrFuncionario, NotificacaoController.listarEnviosAgrupados);
router.patch('/notificacoes/envio', verificarToken, isSindicoOrFuncionario, NotificacaoController.editarEnvioAgrupado);
router.delete('/notificacoes/envio', verificarToken, isSindico, NotificacaoController.apagarEnvioAgrupado);
router.post('/notificacao', verificarToken, isSindicoOrFuncionario, NotificacaoController.cadastrarnotificacao);
router.patch('/notificacao/:id', verificarToken, isSindicoOrFuncionario, NotificacaoController.editarnotificacao);
router.delete('/notificacao/:id', verificarToken, isSindico, NotificacaoController.apagarnotificacao);

// APP (Morador)
router.get('/notificacoes/importantes', verificarToken, isMorador, NotificacaoController.listarAvisosImportantes);
router.get('/notificacao/:userap_id', verificarToken, isMorador, NotificacaoController.listarnotificacao);
router.patch('/notificacao/:not_id/lida', verificarToken, isMorador, NotificacaoController.marcarComoLida);

module.exports = router;
