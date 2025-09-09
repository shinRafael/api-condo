const express = require('express');
const router = express.Router();

const encomendasController = require('../controllers/encomendas')

const ocorrenciasController = require('../controllers/ocorrencias')

const documentosController = require('../controllers/')

router.get('/encomendas', encomendasController.listarEncomendas);
router.post('/encomendas', encomendasController.cadastrarEncomendas);
router.patch('/encomendas/:id', encomendasController.editarEncomendas);
router.delete('/encomendas/:id', encomendasController.apagarEncomendas);

router.get('/ocorrencias', ocorrenciasController.listarOcorrencias);
router.post('/ocorrencias', ocorrenciasController.cadastrarOcorrencias);
router.patch('/ocorrencias/:id', ocorrenciasController.editarOcorrencias);
router.delete('/ocorrencias/:id', ocorrenciasController.apagarOcorrencias);

router.get('/documentos', documentosController.listarDocumentos);
router.post('/documentos', documentosController.cadastrarDocumentos);
router.patch('/documentos/:id', documentosController.editarDocumentos);
router.delete('/documentos/:id', documentosController.apagarDocumentos);


module.exports = router;
