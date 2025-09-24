const express = require('express');
const router = express.Router();

const NotificacaoController = require('../controllers/notificacao');

// ==================================================================
// ROTAS PARA O PAINEL WEB (VISÃO AGRUPADA)
// ==================================================================

// Rota para buscar a lista de envios de forma agrupada
router.get('/notificacoes/envios', NotificacaoController.listarEnviosAgrupados);

// Rota para editar um grupo inteiro de notificações
router.patch('/notificacoes/envio', NotificacaoController.editarEnvioAgrupado);

// Rota para apagar um grupo inteiro de notificações
router.delete('/notificacoes/envio', NotificacaoController.apagarEnvioAgrupado);

// Rota para o DASHBOARD do app (Avisos Urgentes)
router.get('/notificacoes/importantes', NotificacaoController.listarAvisosImportantes);

// Rota para o APP (Listar "Minhas Notificações")
router.get('/notificacao/:userap_id', NotificacaoController.listarnotificacao);

// Rota para o APP (Marcar notificação como lida)
router.patch('/notificacao/:not_id/lida', NotificacaoController.marcarComoLida);

// Rota para o PAINEL WEB (Criar novas notificações)
router.post('/notificacao', NotificacaoController.cadrastonotificacao);

// ===== ADICIONE A ROTA DE EDITAR AQUI =====
// Rota para o PAINEL WEB (Editar uma notificação existente)
router.patch('/notificacao/:id', NotificacaoController.editarnotificacao);

// Rota para o PAINEL WEB (Apagar uma notificação)
router.delete('/notificacao/:id', NotificacaoController.apagarnotificacao);

module.exports = router;