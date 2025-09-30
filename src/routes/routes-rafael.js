const express = require('express');
const router = express.Router();

const condominioController = require('../controllers/condominio');

router.get('/condominio', condominioController.listarcondominio);
router.post('/condominio', condominioController.cadastrarcondominio);
router.patch('/condominio/:id', condominioController.editarcondominio);
router.delete('/condominio/:id', condominioController.apagarcondominio);

const gerenciamentoController = require('../controllers/gerenciamento');

router.get('/gerenciamento', gerenciamentoController.listargerenciamento);
router.post('/gerenciamento', gerenciamentoController.cadastrargerenciamento);
router.patch('/gerenciamento/:id', gerenciamentoController.editargerenciamento);
router.delete('/gerenciamento/:id', gerenciamentoController.apagargerenciamento);



// A rota deve usar .put() e receber um parâmetro na URL (ex: :id)
router.put('/gerenciamento/:id', (req, res) => {
  const { id } = req.params; // Pega o ID da URL
  const dadosParaAtualizar = req.body; // Pega os dados enviados pelo frontend

  // Aqui você colocaria a lógica para atualizar os dados no banco de dados
  // Usando o 'id' para encontrar o registro e 'dadosParaAtualizar' para saber o que mudar.

  console.log(`Recebida requisição PUT para atualizar o item com ID: ${id}`);
  
  // Exemplo de resposta de sucesso
  res.status(200).json({ message: 'Item atualizado com sucesso!' });
});
module.exports = router;
