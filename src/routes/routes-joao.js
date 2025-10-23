const express = require('express');
const router = express.Router();

const apartamentoController = require('../controllers/apartamentos');
const visitantesController = require('../controllers/visitantes');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// ROTAS APARTAMENTOS (Apenas Síndico)
router.get('/apartamentos', verificarToken, isSindico, apartamentoController.listarApartamentos);
router.post('/apartamentos', verificarToken, isSindico, apartamentoController.cadastrarApartamentos);
router.patch('/apartamentos/:id', verificarToken, isSindico, apartamentoController.editarApartamentos);
router.delete('/apartamentos/:id', verificarToken, isSindico, apartamentoController.apagarApartamentos);

// ROTAS VISITANTES (MORADOR)
router.post('/visitantes', verificarToken, isMorador, visitantesController.cadastrarAutorizacao);
router.get('/visitantes', verificarToken, isMorador, visitantesController.listarVisitantes);
router.patch('/visitantes/:id/cancelar', verificarToken, isMorador, visitantesController.cancelarAutorizacao);

// ROTAS VISITANTES (PORTARIA / GESTÃO)
router.get('/visitantes/dashboard', verificarToken, isSindicoOrFuncionario, visitantesController.listarVisitantesParaDashboard);
router.put('/visitantes/:id/entrada', verificarToken, isSindicoOrFuncionario, visitantesController.registrarEntrada);
router.put('/visitantes/:id/saida', verificarToken, isSindicoOrFuncionario, visitantesController.registrarSaida);
router.post('/moradores/:userap_id/notificar-visitante', verificarToken, isSindicoOrFuncionario, visitantesController.notificarVisitanteInesperado);

module.exports = router;
