const express = require('express');
const router = express.Router();

const blocosController = require('../controllers/blocos');
const mensagensController = require('../controllers/mensagens');
const { verificarToken, isSindico, isSindicoOrFuncionario } = require('../middleware/auth');

// BLOCOS
router.get('/blocos', verificarToken, isSindicoOrFuncionario, blocosController.listablocos);
router.post('/blocos', verificarToken, isSindico, blocosController.cadastrarblocos);
router.patch('/blocos/:id', verificarToken, isSindico, blocosController.editarblocos);
router.delete('/blocos/:id', verificarToken, isSindico, blocosController.apagarblocos);

// MENSAGENS
router.get('/mensagens', verificarToken, isSindicoOrFuncionario, mensagensController.listamensagens);
router.post('/mensagens', verificarToken, mensagensController.cadastrarmensagens);
router.patch('/mensagens/:id', verificarToken, mensagensController.editarmensagens);
router.delete('/mensagens/:id', verificarToken, isSindico, mensagensController.apagarmensagens);

module.exports = router;
