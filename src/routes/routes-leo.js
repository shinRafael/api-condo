const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/Usuario');

// Rota para login (método POST)
router.post('/Usuario/login', UsuarioController.loginUsuario);

// Rotas existentes para CRUD de Usuários
router.get('/Usuario', UsuarioController.listarUsuario);
router.post('/Usuario', UsuarioController.cadastrarUsuario);
router.patch('/Usuario/:id', UsuarioController.editarUsuario);
router.delete('/Usuario/:id', UsuarioController.apagarUsuario);

module.exports = router;