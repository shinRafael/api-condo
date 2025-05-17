const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/Usuario');

router.get('/Usuario', UsuarioController.listarUsuario);
router.post('/Usuario', UsuarioController.cadrastoUsuario);
router.patch('/Usuario/:id', UsuarioController.editarUsuario);
router.delete('/Usuario/:id', UsuarioController.apagarUsuario);

module.exports = router;