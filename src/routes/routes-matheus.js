const express = require('express');
const router = express.Router();

const apartamentoController = require('../controllers/apartamentos');

const visitantesController = require('../controllers/visitantes');

// ROTAS APARTAMENTOS

router.get('/apartamentos', apartamentoController.listarApartamentos);

router.post('/apartamentos', apartamentoController.cadastrarApartamentos);

router.patch('/apartamentos/:id', apartamentoController.editarApartamentos);

router.delete('/apartamentos/:id', apartamentoController.apagarApartamentos);

// ROTAS AMBIENTES 

router.get('/visitantes', visitantesController.listarVisitantes);

router.post('/visitantes', visitantesController.cadastrarVisitantes);

router.patch('/visitantes/:id', visitantesController.editarVisitantes);

router.delete('/visitantes/:id', visitantesController.apagarVisitantes);

module.exports = router;