// ===============================================================
// 📂 routes/routes-visitantes.js — versão revisada CondoWay 2025
// ===============================================================

const express = require('express');
const router = express.Router();

const visitantesController = require('../controllers/visitantes');
const apartamentoController = require('../controllers/apartamentos');
const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// ===============================================================
// 🏢 ROTAS DE APARTAMENTOS (apenas Síndico)
// ===============================================================
router.get('/apartamentos', verificarToken, isSindico, apartamentoController.listarApartamentos);
router.post('/apartamentos', verificarToken, isSindico, apartamentoController.cadastrarApartamentos);
router.patch('/apartamentos/:id', verificarToken, isSindico, apartamentoController.editarApartamentos);
router.delete('/apartamentos/:id', verificarToken, isSindico, apartamentoController.apagarApartamentos);

// ===============================================================
// 👥 ROTAS DE VISITANTES — ACESSO DO MORADOR
// ===============================================================

// 🔹 Lista visitantes cadastrados pelo morador
router.get('/visitantes', verificarToken, isMorador, visitantesController.listarVisitantes);

// 🔹 Morador cadastra autorização de visitante
router.post('/visitantes', verificarToken, isMorador, visitantesController.cadastrarAutorizacao);

// 🔹 Morador cancela uma autorização antes da entrada
router.patch('/visitantes/:id/cancelar', verificarToken, isMorador, visitantesController.cancelarAutorizacao);

// ===============================================================
// 🚪 ROTAS DE VISITANTES — PORTARIA / GESTÃO
// ===============================================================

// 🔹 Lista visitantes relevantes (Aguardando / Entrou)
router.get('/visitantes/dashboard', verificarToken, isSindicoOrFuncionario, visitantesController.listarVisitantesParaDashboard);

// 🔹 Portaria registra ENTRADA de visitante autorizado
router.put('/visitantes/:id/entrada', verificarToken, isSindicoOrFuncionario, visitantesController.registrarEntrada);

// 🔹 Portaria registra SAÍDA de visitante
router.put('/visitantes/:id/saida', verificarToken, isSindicoOrFuncionario, visitantesController.registrarSaida);

// 🔹 Portaria autoriza entrada imediata de visitante sem agendamento
router.post('/visitantes/entrada-imediata', verificarToken, isSindicoOrFuncionario, visitantesController.autorizarEntradaImediata);

// 🔹 Portaria notifica morador sobre visitante inesperado
router.post(
  '/moradores/:userap_id/notificar-visitante',
  verificarToken,
  isSindicoOrFuncionario,
  visitantesController.notificarVisitanteInesperado
);

// 🔹 Portaria pode NEGAR visitante (nova rota)
router.patch(
  '/visitantes/:id/nega',
  verificarToken,
  isSindicoOrFuncionario,
  visitantesController.cancelarAutorizacao
);

module.exports = router;
