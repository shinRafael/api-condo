// ============================================================
// 📂 routes-dashboard.js — versão final CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard');
const { verificarToken } = require('../middleware/auth');
const { isOwnerOrStaff } = require('../middleware/ownership');

// ============================================================
// 📱 ROTA: Atualizações do Dashboard do Morador (Mobile)
// ============================================================
router.get(
  '/dashboard/updates/:userap_id',
  verificarToken,
  isOwnerOrStaff,
  dashboardController.getLatestUpdates
);

module.exports = router;
