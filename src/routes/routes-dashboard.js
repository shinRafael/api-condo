// ============================================================
// 📂 routes-dashboard.js — versão final CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard');
const { verificarToken, isMorador } = require('../middleware/auth');

// ============================================================
// 📱 ROTA: Atualizações do Dashboard do Morador (Mobile)
// ============================================================
router.get(
  '/dashboard/updates/:userap_id',
  verificarToken,
  isMorador,
  dashboardController.getLatestUpdates
);

module.exports = router;
