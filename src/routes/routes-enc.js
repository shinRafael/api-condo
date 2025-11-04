// ============================================================
// 📂 routes-enc.js — versão final CondoWay 2025
// ============================================================

const express = require('express');
const router = express.Router();

const encomendasController = require('../controllers/encomendas');
const ocorrenciasController = require('../controllers/ocorrencias');
const documentosController = require('../controllers/documentos');

const { verificarToken, isSindico, isSindicoOrFuncionario, isMorador } = require('../middleware/auth');

// ============================================================
// 📦 ENCOMENDAS
// ============================================================
router.get('/encomendas', verificarToken, isSindicoOrFuncionario, encomendasController.listarTodasEncomendas);
router.get('/encomendas/:userap_id', verificarToken, isMorador, encomendasController.listarEncomendasDoMorador);
router.post('/encomendas', verificarToken, isSindicoOrFuncionario, encomendasController.cadastrarEncomendas);
router.patch('/encomendas/:id', verificarToken, isSindicoOrFuncionario, encomendasController.editarEncomendas);
router.delete('/encomendas/:id', verificarToken, isSindicoOrFuncionario, encomendasController.apagarEncomendas);

// ============================================================
// ⚠️ OCORRÊNCIAS
// ============================================================
router.get('/ocorrencias', verificarToken, isSindicoOrFuncionario, ocorrenciasController.listarMensagensDaOcorrencia);
router.get('/ocorrencias/:userap_id', verificarToken, isMorador, ocorrenciasController.listarMensagensDaOcorrencia);
router.post('/ocorrencias', verificarToken, isMorador, ocorrenciasController.cadastrarocorrencias);
router.patch('/ocorrencias/:id', verificarToken, isSindicoOrFuncionario, ocorrenciasController.editarocorrencias);
router.delete('/ocorrencias/:id', verificarToken, isSindico, ocorrenciasController.apagarocorrencias);

// 💬 MENSAGENS DAS OCORRÊNCIAS
router.get('/ocorrencias/:id/mensagens', verificarToken, ocorrenciasController.listarMensagensDaOcorrencia);
router.post('/ocorrencias/:id/mensagens', verificarToken, ocorrenciasController.enviarMensagemParaOcorrencia);

// ============================================================
// 📑 DOCUMENTOS
// ============================================================
router.get('/documentos', verificarToken, isSindicoOrFuncionario, documentosController.listardocumentos);
router.post('/documentos', verificarToken, isSindico, documentosController.cadastrardocumentos);
router.patch('/documentos/:id', verificarToken, isSindico, documentosController.editardocumentos);
router.delete('/documentos/:id', verificarToken, isSindico, documentosController.apagardocumentos);

module.exports = router;