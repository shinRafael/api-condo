const express = require('express');
const router = express.Router();

// Rota de teste
router.get('/rafael', (req, res) => {
  res.send('Rafael');
});

// Importa controllers
const condominioController = require('../controllers/condominio');
const gerenciamentoController = require('../controllers/gerenciamento');

// Rotas de CONDOMINIO
router.get('/condominio', condominioController.listarcondominio);
router.post('/condominio', condominioController.cadastrarcondominio);
router.patch('/condominio/:id', condominioController.editarcondominio);
router.delete('/condominio/:id', condominioController.apagarcondominio);

// Rotas de GERENCIAMENTO
router.get('/gerenciamento', gerenciamentoController.listarGerenciamento); // ✅ sem underline
router.post('/gerenciamento', gerenciamentoController.cadastrarGerenciamento);
router.patch('/gerenciamento/:id', gerenciamentoController.editargerenciamento);
router.delete('/gerenciamento/:id', gerenciamentoController.apagargerenciamento);

module.exports = router;