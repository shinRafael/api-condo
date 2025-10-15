// Arquivo: src/routes/routes-dashboard.js
// (Crie este novo arquivo)

const express = require('express');
const router = express.Router();

// Importa o CONTROLLER (o objeto com a lógica)
const dashboardController = require('../controllers/dashboard');

// Define a rota e liga ela à função do controller
router.get('/dashboard/updates/:userap_id', dashboardController.getLatestUpdates);

// Exporta APENAS o router. É isso que o routes.js precisa.
module.exports = router;