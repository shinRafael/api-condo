const express = require('express');
const router = express.Router();

const usuarioApartamentosController = require('../controllers/usuarioApartamentos');

const ambientesController = require('../controllers/ambientes');

router.get('/usuarioApartamentos', usuarioApartamentosController.listarUsuariosApartamentos);

router.post('/usuarioApartamentos', usuarioApartamentosController.cadastrarUsuariosApartamentos);

router.patch('/usuarioApartamentos/:id', usuarioApartamentosController.editarUsuariosApartamentos);

router.delete('/usuarioApartamentos/:id', usuarioApartamentosController.apagarUsuariosApartamentos);

// ROTA AMBIENTES

router.get('/ambientes', ambientesController.listarAmbientes);

router.post('/ambientes', ambientesController.cadastrarAmbientes);

router.patch('/ambientes/:id', ambientesController.editarAmbientes);

router.delete('/ambientes/:id', ambientesController.apagarAmbientes);

module.exports = router;