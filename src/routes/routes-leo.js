// ============================================================
// 📂 routes-leo.js — versão final CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario');
const { uploadPerfil } = require('../controllers/upload');
const { verificarToken, isSindico, isSindicoOrFuncionario } = require('../middleware/auth');

// ============================================================
// 🔐 LOGIN (público)
// ============================================================
router.post('/usuario/login', usuarioController.loginusuario);

// ============================================================
// 🔑 RECUPERAÇÃO DE SENHA (público - não requer token)
// ============================================================
router.post('/usuario/recuperar-senha', usuarioController.solicitarReset);
router.post('/usuario/redefinir-senha', usuarioController.resetarSenha);

// ============================================================
// 👤 PERFIL DO USUÁRIO (qualquer logado)
// ============================================================
router.get('/usuario/perfil/:id', verificarToken, usuarioController.buscarperfilcompleto);
router.get('/Usuario/:id', verificarToken, usuarioController.buscarperfilcompleto); // Compatibilidade frontend - buscar usuário específico

// ============================================================
// 👥 GESTÃO DE USUÁRIOS (Síndico e Funcionário)
// ============================================================
router.get('/usuario', verificarToken, isSindicoOrFuncionario, usuarioController.listarusuario);

// ============================================================
// ➕ CADASTRAR USUÁRIO (apenas Síndico) - SEM foto no cadastro
// ============================================================
router.post('/usuario', verificarToken, isSindico, usuarioController.cadastrarusuario);
router.post('/Usuario', verificarToken, isSindico, usuarioController.cadastrarusuario); // Compatibilidade frontend

// ============================================================
// 📱 CADASTRO PÚBLICO DE MORADOR (app mobile)
// Força user_tipo='Morador' no controller — ninguém se auto-cadastra como
// Síndico/ADM. Rate limited pelo limiter global.
// ============================================================
router.post('/usuario/cadastro', usuarioController.cadastrarusuarioPublico);

// ============================================================
// ✏️ EDITAR USUÁRIO (apenas Síndico - pode alterar tudo) - com suporte a upload de foto
// ============================================================
router.patch('/usuario/:id', verificarToken, isSindico, uploadPerfil.single('foto'), usuarioController.editarusuario);
router.patch('/Usuario/:id', verificarToken, uploadPerfil.single('foto'), usuarioController.editarusuario); // Compatibilidade frontend - qualquer usuário pode editar próprio perfil

// ============================================================
// ❌ APAGAR USUÁRIO (apenas Síndico)
// ============================================================
router.delete('/usuario/:id', verificarToken, isSindico, usuarioController.apagarusuario);

// ============================================================
// 📸 UPLOAD FOTO DE PERFIL (usuário pode alterar sua própria foto)
// ============================================================
router.post(
  '/usuario/perfil/:id/foto', 
  verificarToken, 
  uploadPerfil.single('foto'), 
  usuarioController.uploadfotoperfil
);

// Rota alternativa para compatibilidade com frontend (campo 'file')
router.post(
  '/usuario/foto/:id', 
  verificarToken, 
  uploadPerfil.single('file'), 
  usuarioController.uploadfotoperfil
);

// ============================================================
// ✏️ EDITAR PERFIL DO USUÁRIO (usuário pode editar email e telefone)
// ============================================================
router.put('/usuario/perfil/:id', verificarToken, usuarioController.editarusuario);

// ============================================================
// 🔒 ALTERAR SENHA DO USUÁRIO (usuário pode alterar própria senha)
// ============================================================
router.put('/usuario/senha/:id', verificarToken, usuarioController.alterarsenha);

module.exports = router;
