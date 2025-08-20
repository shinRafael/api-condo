const express = require('express');
const router = express.Router();

const encomendasController = require('../controllers/encomendas')

router.get('/', encomendasController.listarEncomendas);
router.post('/', encomendasController.cadastrarEncomenda);
router.put('/', encomendasController.editarEncomenda);
router.delete('/', encomendasController.apagarEncomenda);

module.exports = router;
