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
router.get('/encomendas', verificarToken, isSindicoOrFuncionario, encomendasController.listartodasencomendas);
router.get('/encomendas/:userap_id', verificarToken, isMorador, encomendasController.listarencomendasdomorador);
router.post('/encomendas', verificarToken, isSindicoOrFuncionario, encomendasController.cadastrarencomendas);
router.patch('/encomendas/:id', verificarToken, isSindicoOrFuncionario, encomendasController.editarencomendas);
router.delete('/encomendas/:id', verificarToken, isSindicoOrFuncionario, encomendasController.apagarencomendas);

// ============================================================
// ⚠️ OCORRÊNCIAS
// ============================================================
router.get('/ocorrencias', verificarToken, isSindicoOrFuncionario, ocorrenciasController.listartodasocorrencias);
router.get('/ocorrencias/:userap_id', verificarToken, isMorador, ocorrenciasController.listarocorrenciasdomorador);
router.post('/ocorrencias', verificarToken, isMorador, ocorrenciasController.cadastrarocorrencias);
router.patch('/ocorrencias/:id', verificarToken, isSindicoOrFuncionario, ocorrenciasController.editarocorrencias);
router.delete('/ocorrencias/:id', verificarToken, isSindico, ocorrenciasController.apagarocorrencias);

// 💬 MENSAGENS DAS OCORRÊNCIAS
router.get('/ocorrencias/:id/mensagens', verificarToken, ocorrenciasController.listarmensagensdaocorrencia);
router.post('/ocorrencias/:id/mensagens', verificarToken, ocorrenciasController.enviarmensagemparaocorrencia);

// ============================================================
// 📑 DOCUMENTOS
// ============================================================
router.get('/documentos', verificarToken, isSindicoOrFuncionario, documentosController.listardocumentos);
router.post('/documentos', verificarToken, isSindico, documentosController.cadastrardocumentos);
router.patch('/documentos/:id', verificarToken, isSindico, documentosController.editardocumentos);
router.delete('/documentos/:id', verificarToken, isSindico, documentosController.apagardocumentos);

module.exports = router;