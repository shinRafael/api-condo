require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const router = require("./src/routes/routes");

const app = express();

// Configuração CORS para permitir requisições do frontend
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use(router);

// inicia servidor
const porta = process.env.PORT || 3333;
app.listen(porta, () => {
  console.log(`Servidor iniciado em http://localhost:${porta}`);
});

app.get("/", (request, response) => {
  response.send("Hello World");
});
