const express = require('express');
const router = express.router();

const condominioController = require('../controllers/condominio');

router.get('/condominio', condominioController.listarcondominio);

module.exports = router;