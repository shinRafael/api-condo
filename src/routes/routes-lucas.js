const express = require('express');
const router = express.Router();

const usuarioApartamentosController = require('../controllers/usuarioApartamentos');
const ambientesController = require('../controllers/ambientes');
const { verificarToken, isSindico, isSindicoOrFuncionario } = require('../middleware/auth');

// USUÁRIOS x APARTAMENTOS (Apenas Síndico)
router.get('/usuarioApartamentos', verificarToken, isSindico, usuarioApartamentosController.listarUsuariosApartamentos);
router.post('/usuarioApartamentos', verificarToken, isSindico, usuarioApartamentosController.cadastrarUsuariosApartamentos);
router.patch('/usuarioApartamentos/:id', verificarToken, isSindico, usuarioApartamentosController.editarUsuariosApartamentos);
router.delete('/usuarioApartamentos/:id', verificarToken, isSindico, usuarioApartamentosController.apagarUsuariosApartamentos);

// AMBIENTES (Síndico controla)
router.get('/ambientes', verificarToken, isSindicoOrFuncionario, ambientesController.listarAmbientes);
router.post('/ambientes', verificarToken, isSindico, ambientesController.cadastrarAmbientes);
router.patch('/ambientes/:id', verificarToken, isSindico, ambientesController.editarAmbientes);
router.delete('/ambientes/:id', verificarToken, isSindico, ambientesController.apagarAmbientes);

module.exports = router;
