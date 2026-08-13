const express = require('express');
const router = express.Router();

const condominioController = require('../controllers/condominio');
const gerenciamentoController = require('../controllers/gerenciamento');
const { verificarToken, isSindico, isSindicoOrFuncionario } = require('../middleware/auth');

// ============================================================
// CONDOMÍNIO
// ============================================================
router.get('/condominio', verificarToken, isSindicoOrFuncionario, condominioController.listarcondominio);
// Objeto único de condomínio (app mobile) — qualquer usuário autenticado
router.get('/condominio/:id', verificarToken, condominioController.buscarcondominio);
router.post('/condominio', verificarToken, isSindico, condominioController.cadastrarcondominio);
router.patch('/condominio/:id', verificarToken, isSindico, condominioController.editarcondominio);
router.delete('/condominio/:id', verificarToken, isSindico, condominioController.apagarcondominio);

// ============================================================
// GERENCIAMENTO
// ============================================================
router.get('/gerenciamento', verificarToken, isSindicoOrFuncionario, gerenciamentoController.listarGerenciamento);
router.post('/gerenciamento', verificarToken, isSindico, gerenciamentoController.cadastrarGerenciamento);
router.patch('/gerenciamento/:id', verificarToken, isSindico, gerenciamentoController.editargerenciamento);
router.delete('/gerenciamento/:id', verificarToken, isSindico, gerenciamentoController.apagargerenciamento);

module.exports = router;
