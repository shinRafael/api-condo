const express = require('express');
const router = express.Router();

const condominioController = require('../controllers/condominio');

router.get('/condominio', condominioController.listarcondominio);
router.post('/condominio', condominioController.cadrastocondominio);
router.patch('/condominio', condominioController.editarcondominio);
router.delete('/condominio', condominioController.apagarcondominio);

module.exports = router;