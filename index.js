require('dotenv').config();
const express = require('express'); 
const cors = require('cors');

const router = require('./src/routes/routes');

const app = express();
app.use(cors()); 
app.use(express.json());

// importa as rotas
const routes = require('./src/routes/routes-rafael');
app.use('/', routes); // todas as rotas já estão com prefixo (/condominio, /gerenciamento, etc.)

// inicia servidor
const porta = process.env.PORT || 3333;
app.listen(porta, () => {
    console.log(`Servidor iniciado em http://localhost:${porta}`);
});

// rota de teste
app.get('/', (request, response) => {
    response.send('Hello World');

});
