const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard'); // ✅ adicionado
const { verificarToken, isMorador } = require('../middleware/auth');

// Rota de atualizações do app do morador
router.get('/dashboard/updates/:userap_id', verificarToken, isMorador, dashboardController.getLatestUpdates);

module.exports = router;
