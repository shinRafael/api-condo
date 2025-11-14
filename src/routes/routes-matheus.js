const express = require('express');
const router = express.Router();

const reservas_ambientesController = require('../controllers/reservas_ambientes');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// ============================================================
// 🏢 AMBIENTES
// ============================================================
router.get('/ambientes', verificarToken, reservas_ambientesController.listarAmbientes);

// ============================================================
// 📅 RESERVAS DE AMBIENTES (Padrão REST)
// ============================================================

// Listar reservas (filtro automático por tipo de usuário)
router.get('/reservas', verificarToken, reservas_ambientesController.listarreservas_ambientes);

// Criar nova reserva
router.post('/reservas', verificarToken, reservas_ambientesController.cadastrarreservas_ambientes);

// Obter detalhes de uma reserva
router.get('/reservas/:id', verificarToken, reservas_ambientesController.obterReserva);

// Cancelar reserva
router.patch('/reservas/:id/cancelar', verificarToken, reservas_ambientesController.cancelarReserva);

// Ver reservas de um ambiente específico (para calendário)
router.get('/reservas/ambiente/:amd_id', verificarToken, reservas_ambientesController.listarReservasPorAmbiente);

// ============================================================
// 📋 ROTAS ANTIGAS (MANTER POR COMPATIBILIDADE - DEPRECATED)
// ============================================================
router.get('/reservas_ambientes', verificarToken, isSindicoOrFuncionario, reservas_ambientesController.listarreservas_ambientes);
router.post('/reservas_ambientes', verificarToken, isMorador, reservas_ambientesController.cadastrarreservas_ambientes);
router.patch('/reservas_ambientes/:id', verificarToken, isSindicoOrFuncionario, reservas_ambientesController.editarreservas_ambientes);
router.delete('/reservas_ambientes/:id', verificarToken, isSindico, reservas_ambientesController.apagarreservas_ambientes);

module.exports = router;