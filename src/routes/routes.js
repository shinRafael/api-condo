const express = require('express');
const router = express.Router();

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

module.exports = router;