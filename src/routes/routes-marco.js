const express = require('express');
const router =  express.Router();

const reserva_ambientesController = require('../controllers/reserva_ambientes');

router.get('/reserva_ambientes', reserva_ambientesController.listarreserva_ambientes);
router.post('/reserva_ambientes', reserva_ambientesController.cadastrarreserva_ambientes);
router.patch('/reserva_ambientes/:id', reserva_ambientesController.editarreserva_ambientes);
router.delete('/reserva_ambientes/:id', reserva_ambientesController.apagarreserva_ambientes);

module.exports = router;