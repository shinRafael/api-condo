const express = require('express');
const router =  express.Router();

const reservas_ambientesController = require('../controllers/reservas_ambientes');

router.get('/reservas_ambientes', reservas_ambientesController.listarreservas_ambientes);
router.post('/reservas_ambientes', reservas_ambientesController.cadastrarreservas_ambientes);
router.patch('/reservas_ambientes/:id', reservas_ambientesController.editarreservas_ambientes);
router.delete('/reservas_ambientes/:id', reservas_ambientesController.apagarreservas_ambientes);




module.exports = router;