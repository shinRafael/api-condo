const express = require('express');
const router = express.Router();

const encomendasController = require('../controllers/encomendas')

const ocorrenciasController = require('../controllers/ocorrencias')

// const documentosController = require('../controllers/documentos')

router.get('/encomendas', encomendasController.listarEncomendas);
router.post('/encomendas', encomendasController.cadastrarEncomendas);
router.patch('/encomendas/:id', encomendasController.editarEncomendas);
router.delete('/encomendas/:id', encomendasController.apagarEncomendas);

router.get('/ocorrencias', ocorrenciasController.listarocorrencias);
router.post('/ocorrencias', ocorrenciasController.cadastrarocorrencias);
router.patch('/ocorrencias/:id', ocorrenciasController.editarocorrencias);
router.delete('/ocorrencias/:id', ocorrenciasController.apagarocorrencias);

// router.get('/documentos', documentosController.listarDocumentos);
// router.post('/documentos', documentosController.cadastrarDocumentos);
// router.patch('/documentos/:id', documentosController.editarDocumentos);
// router.delete('/documentos/:id', documentosController.apagarDocumentos);


module.exports = router;
