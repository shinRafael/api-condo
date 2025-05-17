const express = require('express');
const router = express.Router();

const RotasRafael = require('./routes-rafael');
const RotasJoao = require('./routes-joao');
const RotasLeo= require('./routes-leo');
const RotasLucas = require('./routes-lucas');
const RotasMarco = require('./routes-marco');
const RotasMatheus = require('./routes-matheus');
const RotasOtavio = require('./routes-otavio');


router.use('/', RotasRafael);
router.use('/', RotasJoao);
router.use('/', RotasLeo);
router.use('/', RotasLucas);
router.use('/', RotasMarco);
router.use('/', RotasMatheus);
router.use('/', RotasOtavio);


module.exports = router;
