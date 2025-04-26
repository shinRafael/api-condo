const express = require('express');
const router = express.Router();

const condominioController = require('../controllers/condominio');

router.get('/condominio', condominioController.listarcondominio);
router.post('/condominio', condominioController.cadrastocondominio);
router.patch('/condominio/:id', condominioController.editarcondominio);
router.delete('/condominio', condominioController.apagarcondominio);

const gerenciamentoController = require('../controllers/gerenciamento');

router.get('/gerenciamento', gerenciamentoController.listargerenciamento);
router.post('/gerenciamento', gerenciamentoController.cadrastogerenciamento);
router.patch('/gerenciamento/:id', gerenciamentoController.editargerenciamento);
router.delete('/gerenciamento', gerenciamentoController.apagargerenciamto);

module.exports = router;