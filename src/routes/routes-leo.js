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
// 👤 PERFIL DO USUÁRIO (qualquer logado)
// ============================================================
router.get('/usuario/perfil/:id', verificarToken, usuarioController.buscarperfilcompleto);

// ============================================================
// 👥 GESTÃO DE USUÁRIOS (Síndico e Funcionário)
// ============================================================
router.get('/usuario', verificarToken, isSindicoOrFuncionario, usuarioController.listarusuario);

// ============================================================
// ➕ CADASTRAR USUÁRIO (apenas Síndico)
// ============================================================
router.post('/usuario', verificarToken, isSindico, usuarioController.cadastrarusuario);

// ============================================================
// ✏️ EDITAR USUÁRIO (apenas Síndico)
// ============================================================
router.patch('/usuario/:id', verificarToken, isSindico, usuarioController.editarusuario);

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
// ✏️ EDITAR PERFIL DO USUÁRIO (usuário pode editar próprio perfil)
// ============================================================
router.put('/usuario/perfil/:id', verificarToken, usuarioController.editarusuario);

module.exports = router;
