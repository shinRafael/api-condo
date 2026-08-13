require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const router = require("./src/routes/routes");
const { globalLimiter, loginLimiter, passwordResetLimiter, uploadLimiter } = require("./src/middleware/rateLimit");

const app = express();

// 🔒 Headers de segurança (CSP, X-Frame-Options, nosniff, etc.)
app.use(helmet());

// 🔒 trust proxy: atrás do proxy da Hostinger o rate-limit precisa do IP real
// (X-Forwarded-For). Ajustar para 0 se o backend for exposto direto.
app.set('trust proxy', 1);

// Configuração CORS para permitir requisições de múltiplas origens
const corsOptions = {
  origin: [
    'http://localhost:3000',        // Painel Web
    'http://localhost:8081',        // Expo Web (React Native)
    'http://192.168.0.174:8081',    // Expo Web na rede local
    'http://192.168.0.174:19006',   // Expo Dev Server alternativo
    'exp://192.168.0.174:8081',     // Expo Go
    // Domínios de produção
    'https://condoway.com.br',
    'https://www.condoway.com.br',
    'https://api.condoway.com.br',
    'https://staging-api.condoway.com.br',
    'https://index-condoway.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 🔒 Limite de body (JSON) — evita payloads abusivos
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 🚦 Rate limit global (todas as rotas)
app.use(globalLimiter);

// 🚦 Rate limits específicos (mais estritos em auth)
app.use('/usuario/login', loginLimiter);
app.use('/Usuario/login', loginLimiter);
app.use('/usuario/recuperar-senha', passwordResetLimiter);
app.use('/upload', uploadLimiter);

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
