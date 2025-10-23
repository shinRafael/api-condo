const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/Usuario');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// Login público
router.post('/Usuario/login', UsuarioController.loginUsuario);

// Perfil do usuário (qualquer logado)
router.get('/usuario/perfil/:id', verificarToken, UsuarioController.buscarPerfilCompleto);

// Listar todos os usuários (Síndico e Funcionário)
router.get('/Usuario', verificarToken, isSindicoOrFuncionario, UsuarioController.listarUsuario);

// Cadastrar usuário (Apenas Síndico)
router.post('/Usuario', verificarToken, isSindico, UsuarioController.cadastrarUsuario);

// Editar usuário (Apenas Síndico)
router.patch('/Usuario/:id', verificarToken, isSindico, UsuarioController.editarUsuario);

// Apagar usuário (Apenas Síndico)
router.delete('/Usuario/:id', verificarToken, isSindico, UsuarioController.apagarUsuario);

module.exports = router;