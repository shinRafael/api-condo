require('dotenv').config();
const express = require('express'); 
const cors = require('cors');

// 1. IMPORTE OS CONTROLLERS AQUI
// (Ajuste o caminho se necessário)
const reservasController = require('./src/controllers/reservas_ambientes');
const encomendasController = require('./src/controllers/encomendas');
const ocorrenciasController = require('./src/controllers/ocorrencias');
const mensagensController = require('./src/controllers/mensagens');
const visitantesController = require('./src/controllers/visitantes'); // Importe este também

const app = express(); 
app.use(cors()); 
app.use(express.json()); 

// 2. USE AS ROTAS DE CADA CONTROLLER
// O Express vai usar o '.router' que você exportou em cada arquivo
app.use(reservasController.router);
app.use(encomendasController.router);
app.use(ocorrenciasController.router);
app.use(mensagensController.router);
app.use(visitantesController.router); // Use este também para a rota '/visitantes/dashboard'

// A linha antiga 'app.use(router);' foi substituída pelas de cima.

const porta = process.env.PORT || 3333;
app.listen(porta, () => {
    console.log(`Servidor iniciado em http://localhost:${porta}`);
});

app.get('/', (request, response) => {
    response.send('Hello World');
});