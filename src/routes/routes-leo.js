const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/Usuario');
const verificarToken = require('../middleware/auth'); // Importe o middleware

// Rota de login continua pública
router.post('/Usuario/login', UsuarioController.loginUsuario);
// =============================================================
// NOVA ROTA PARA OBTER O PERFIL DO USUÁRIO (SEM MIDDLEWARE)
// =============================================================
router.get('/usuario/perfil/:id', UsuarioController.buscarPerfilCompleto);

// --- MUDANÇA: Aplicamos o middleware que libera o acesso ---
// Isso força a rota a ser pública durante o desenvolvimento.
router.get('/Usuario', verificarToken, UsuarioController.listarUsuario);
router.post('/Usuario', verificarToken, UsuarioController.cadastrarUsuario);
router.patch('/Usuario/:id', verificarToken, UsuarioController.editarUsuario);
router.delete('/Usuario/:id', verificarToken, UsuarioController.apagarUsuario);

module.exports = router;