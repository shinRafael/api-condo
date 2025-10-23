const express = require('express');
const router = express.Router();

const reservas_ambientesController = require('../controllers/reservas_ambientes');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// Reservas de Ambientes
router.get('/reservas_ambientes', verificarToken, isSindicoOrFuncionario, reservas_ambientesController.listarreservas_ambientes);
router.post('/reservas_ambientes', verificarToken, isMorador, reservas_ambientesController.cadastrarreservas_ambientes);
router.patch('/reservas_ambientes/:id', verificarToken, reservas_ambientesController.editarreservas_ambientes);
router.delete('/reservas_ambientes/:id', verificarToken, isSindico, reservas_ambientesController.apagarreservas_ambientes);

module.exports = router;
