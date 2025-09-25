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

// --- ROTAS PARA O MORADOR (no app mobile) ---

// Rota para o morador listar TODAS as autorizações (pode ser aprimorada com filtros)
router.get('/visitantes', visitantesController.listarVisitantes);

// Rota para o morador criar uma nova autorização (pré-cadastro)
router.post('/visitantes', visitantesController.cadastrarAutorizacao);

// Rota para o morador cancelar uma autorização que ainda está "Aguardando"
router.patch('/visitantes/:id/cancelar', visitantesController.cancelarAutorizacao);


// --- ROTAS PARA A PORTARIA (no dashboard web) ---

// Rota para a portaria registrar a ENTRADA de um visitante
router.put('/visitantes/:id/entrada', visitantesController.registrarEntrada);

// Rota para a portaria registrar a SAÍDA de um visitante
router.put('/visitantes/:id/saida', visitantesController.registrarSaida);

module.exports = router;

