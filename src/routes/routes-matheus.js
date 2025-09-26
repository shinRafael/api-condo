const express = require('express');
const router = express.Router();

const apartamentoController = require('../controllers/apartamentos');

const visitantesController = require('../controllers/visitantes');

// ROTAS APARTAMENTOS

router.get('/apartamentos', apartamentoController.listarApartamentos);

router.post('/apartamentos', apartamentoController.cadastrarApartamentos);

router.patch('/apartamentos/:id', apartamentoController.editarApartamentos);

router.delete('/apartamentos/:id', apartamentoController.apagarApartamentos);

// ROTAS VISITANTES 


// ======================================================
// ==               ROTAS PARA O MORADOR               ==
// ======================================================

// Rota para o morador criar uma nova autorização de visitante
router.post('/visitantes', visitantesController.cadastrarAutorizacao);

// Rota para o morador listar as suas autorizações
router.get('/visitantes', visitantesController.listarVisitantes);

// Rota para o morador cancelar uma autorização que ainda está "Aguardando"
router.patch('/visitantes/:id/cancelar', visitantesController.cancelarAutorizacao);


// ======================================================
// ==              ROTAS PARA A PORTARIA               ==
// ======================================================

// Rota para o painel da portaria listar os visitantes esperados para o dia
router.get('/visitantes/dashboard', visitantesController.listarVisitantesParaDashboard);

// Rota para a portaria registrar a ENTRADA de um visitante
router.put('/visitantes/:id/entrada', visitantesController.registrarEntrada);

// Rota para a portaria registar a SAÍDA de um visitante
router.put('/visitantes/:id/saida', visitantesController.registrarSaida);

// ROTA ADICIONADA: Notificar morador sobre um visitante inesperado
router.post('/moradores/:userap_id/notificar-visitante', visitantesController.notificarVisitanteInesperado);


module.exports = router;

