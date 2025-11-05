const express = require('express');
const router = express.Router();

// Importações de controllers e middlewares
const { upload, uploadAnexo } = require('../controllers/upload');
const { verificarToken } = require('../middleware/auth');

// Importações de sub-rotas
const RotasRafael = require('./routes-rafael');
const RotasJoao = require('./routes-joao');
const RotasLeo = require('./routes-leo');
const RotasLucas = require('./routes-lucas');
const RotasMarco = require('./routes-marco');
const RotasMatheus = require('./routes-matheus');
const RotasOtavio = require('./routes-otavio');
const RotasEnc = require('./routes-enc');
const RotasDashboard = require('./routes-dashboard');

// Montagem das rotas
router.use('/', RotasRafael);
router.use('/', RotasJoao);
router.use('/', RotasLeo);
router.use('/', RotasLucas);
router.use('/', RotasMarco);
router.use('/', RotasMatheus);
router.use('/', RotasOtavio);
router.use('/', RotasEnc);
router.use('/', RotasDashboard);

// Rota de upload de arquivos (protegida por token)
router.post('/upload', verificarToken, upload.single('file'), uploadAnexo);

module.exports = router;