// ============================================================
// 📂 routes-joao.js — versão final CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const visitantesController = require('../controllers/visitantes');
const apartamentoController = require('../controllers/apartamentos');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// ============================================================
// 🏢 APARTAMENTOS — (Somente Síndico)
// ============================================================
router.get('/apartamentos', verificarToken, isSindico, apartamentoController.listarapartamentos);
router.post('/apartamentos', verificarToken, isSindico, apartamentoController.cadastrapartamentos);
router.patch('/apartamentos/:id', verificarToken, isSindico, apartamentoController.editarapartamentos);
router.delete('/apartamentos/:id', verificarToken, isSindico, apartamentoController.apagarapartamentos);

// ============================================================
// � VISITANTES — (Portaria / Gestão)
// ============================================================

// Lista visitantes relevantes (Aguardando / Entrou) - DEVE VIR ANTES das rotas genéricas
router.get('/visitantes/dashboard', verificarToken, isSindicoOrFuncionario, visitantesController.listarvisitantesdashboard);

// ============================================================
// 👥 VISITANTES — (Acesso do Morador)
// ============================================================

// Lista visitantes cadastrados pelo morador
router.get('/visitantes', verificarToken, isMorador, visitantesController.listarvisitantes);

// Morador cadastra autorização de visitante
router.post('/visitantes', verificarToken, isMorador, visitantesController.cadastravisitante);

// Morador cancela uma autorização antes da entrada
router.patch('/visitantes/:id/cancelar', verificarToken, isMorador, visitantesController.cancelarautorizacao);

// ============================================================
// 🚪 VISITANTES — (Portaria / Gestão - continuação)
// ============================================================

// Portaria autoriza entrada imediata de visitante sem agendamento
router.post('/visitantes/entrada-imediata', verificarToken, isSindicoOrFuncionario, visitantesController.autorizarentrada);

// Portaria registra ENTRADA de visitante autorizado
router.put('/visitantes/:id/entrada', verificarToken, isSindicoOrFuncionario, visitantesController.registrarentrada);

// Portaria registra SAÍDA de visitante
router.put('/visitantes/:id/saida', verificarToken, isSindicoOrFuncionario, visitantesController.registrarsaida);

// Portaria notifica morador sobre visitante inesperado
router.post(
  '/moradores/:userap_id/notificar-visitante',
  verificarToken,
  isSindicoOrFuncionario,
  visitantesController.notificarvisitante
);

// Portaria nega visitante
router.patch(
  '/visitantes/:id/nega',
  verificarToken,
  isSindicoOrFuncionario,
  visitantesController.cancelarautorizacao
);

module.exports = router;
