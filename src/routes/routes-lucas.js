// ============================================================
// 📂 routes-lucas.js — versão final CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const usuarioapartamentosController = require('../controllers/usuarioapartamentos');
const ambientesController = require('../controllers/ambientes');
const { verificarToken, isSindico, isSindicoOrFuncionario } = require('../middleware/auth');

// ============================================================
// 👥 USUÁRIOS x APARTAMENTOS (Apenas Síndico)
// ============================================================
router.get('/usuarioapartamentos', verificarToken, isSindico, usuarioapartamentosController.listarusuariosapartamentos);
router.post('/usuarioapartamentos', verificarToken, isSindico, usuarioapartamentosController.cadastrarusuariosapartamentos);
router.patch('/usuarioapartamentos/:id', verificarToken, isSindico, usuarioapartamentosController.editarusuariosapartamentos);
router.delete('/usuarioapartamentos/:id', verificarToken, isSindico, usuarioapartamentosController.apagarusuariosapartamentos);

// ============================================================
// 🏢 AMBIENTES (Moradores podem listar, apenas Síndico gerencia)
// ============================================================
router.get('/ambientes', verificarToken, ambientesController.listarambientes); // Qualquer usuário logado pode listar
router.post('/ambientes', verificarToken, isSindico, ambientesController.cadastrarambientes);
router.patch('/ambientes/:id', verificarToken, isSindico, ambientesController.editarambientes);
router.delete('/ambientes/:id', verificarToken, isSindico, ambientesController.apagarambientes);

module.exports = router;
