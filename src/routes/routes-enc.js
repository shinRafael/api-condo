const express = require('express');
const router = express.Router();

const encomendasController = require('../controllers/encomendas')

router.get('/encomendas', encomendasController.listarEncomendas);
router.post('/encomendas', encomendasController.cadastrarEncomendas);
router.patch('/encomendas:id', encomendasController.editarEncomendas);
router.delete('/encomendas:id', encomendasController.apagarEncomendas);

module.exports = router;
