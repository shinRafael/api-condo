// ======================================================
// 📦 Arquivo: dataBase/connection.js
// 🔧 Configuração da conexão MySQL (compatível com AWS RDS)
// ======================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

// ======================================================
// ⚙️ CRIA O POOL DE CONEXÕES
// ======================================================
const pool = mysql.createPool({
  host: process.env.BD_SERVIDOR,
  port: process.env.BD_PORTA || 3306,
  user: process.env.BD_USUARIO,
  password: process.env.BD_SENHA?.replace(/"/g, ""), // remove aspas acidentais do .env
  database: process.env.BD_BANCO,
  waitForConnections: true,
  connectionLimit: 10,   // número máximo de conexões simultâneas
  queueLimit: 0,
  connectTimeout: 10000, // evita travamento se o banco não responder
});

// ======================================================
// 🧪 TESTE DE CONEXÃO (executado apenas uma vez)
// ======================================================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexão MySQL (AWS RDS) estabelecida com sucesso!');
    conn.release();
  } catch (error) {
    console.error('\n❌ Falha ao conectar ao MySQL (AWS RDS):', error.message);
    console.error('🔹 Verifique se a porta 3306 está liberada na AWS.');
    console.error('🔹 Confirme usuário e senha no arquivo .env.');
    console.error('🔹 Confira se o banco "condowaydb" está acessível.');
  }
})();

// ======================================================
// 📤 EXPORTAÇÃO
// ======================================================
module.exports = pool;
