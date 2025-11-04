// ============================================================
// 📂 routes-joao.js — versão final padronizada CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const visitantesController = require('../controllers/visitantes');
const apartamentosController = require('../controllers/apartamentos');
const {
  verificarToken,
  isSindico,
  isSindicoOrFuncionario,
  isMorador
} = require('../middleware/auth');

// ============================================================
// 🏢 Apartamentos — (somente síndico)
// ============================================================
router.get('/apartamentos', verificarToken, isSindico, apartamentosController.listarapartamentos);
router.post('/apartamentos', verificarToken, isSindico, apartamentosController.cadastrarapartamentos);
router.patch('/apartamentos/:id', verificarToken, isSindico, apartamentosController.editarapartamentos);
router.delete('/apartamentos/:id', verificarToken, isSindico, apartamentosController.apagarapartamentos);

// ============================================================
// 👥 Visitantes — (acesso do morador)
// ============================================================
router.get('/visitantes', verificarToken, isMorador, visitantesController.listarvisitantes);
router.post('/visitantes', verificarToken, isMorador, visitantesController.cancelarautorizacao);
router.patch('/visitantes/:id/cancelar', verificarToken, isMorador, visitantesController.cancelarautorizacao);

// ============================================================
// 🚪 Visitantes — (portaria / gestão)
// ============================================================
router.get('/visitantes/dashboard', verificarToken, isSindicoOrFuncionario, visitantesController.listarvisitantesdashboard);
router.put('/visitantes/:id/entrada', verificarToken, isSindicoOrFuncionario, visitantesController.registrarentrada);
router.put('/visitantes/:id/saida', verificarToken, isSindicoOrFuncionario, visitantesController.registrarsaida);
router.post('/visitantes/entrada-imediata', verificarToken, isSindicoOrFuncionario, visitantesController.autorizarentrada);
router.post('/moradores/:userap_id/notificar-visitante', verificarToken, isSindicoOrFuncionario, visitantesController.notificarvisitante);
router.patch('/visitantes/:id/nega', verificarToken, isSindicoOrFuncionario, visitantesController.cancelarautorizacao);

// ============================================================
// ✅ Exportação
// ============================================================
module.exports = router;
