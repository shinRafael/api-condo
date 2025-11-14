# 🔐 Sistema de Recuperação de Senha - CondoWay

## ✅ **Estrutura do Banco de Dados Atualizada**

### 📋 **Novas Colunas na Tabela `usuarios`:**

```sql
user_reset_token VARCHAR(10) NULL      -- Token de 6 dígitos para recuperação
user_reset_expires DATETIME NULL       -- Data/hora de expiração (15 minutos)
```

---

## 📁 **Arquivos Atualizados:**

### ✅ **`createnovo.sql`**
- Adicionadas colunas `user_reset_token` e `user_reset_expires` na tabela `usuarios`

### ✅ **`insert.novo.sql`**
- INSERTs atualizados para incluir os novos campos (NULL por padrão)

### ✅ **`select.sql`**
- SELECT detalhado incluindo as novas colunas

### ✅ **`alter_add_reset_password.sql`** (NOVO)
- Script ALTER TABLE para bancos existentes
- Localização: `src/dataBase/createbanco/alter_add_reset_password.sql`

---

## 🚀 **Como Aplicar no Banco Existente:**

### **Opção 1: Executar o ALTER TABLE**
```bash
mysql -u seu_usuario -p -h seu_host_aws seu_banco < src/dataBase/createbanco/alter_add_reset_password.sql
```

### **Opção 2: Executar manualmente no MySQL Workbench**
```sql
ALTER TABLE usuarios
ADD COLUMN user_reset_token VARCHAR(10) NULL,
ADD COLUMN user_reset_expires DATETIME NULL;
```

### **Verificar se foi aplicado:**
```sql
DESCRIBE usuarios;
```

---

## 🔧 **Próximos Passos (Backend):**

### **1. Criar endpoint para solicitar recuperação:**
```javascript
// POST /usuario/recuperar-senha
async solicitarRecuperacaoSenha(request, response) {
  const { user_email } = request.body;
  
  // 1. Verificar se email existe
  const [usuario] = await db.query('SELECT user_id FROM usuarios WHERE user_email = ?', [user_email]);
  
  if (usuario.length === 0) {
    return response.status(404).json({ sucesso: false, mensagem: 'Email não encontrado.' });
  }
  
  // 2. Gerar token de 6 dígitos
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 3. Definir expiração (15 minutos)
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  
  // 4. Salvar no banco
  await db.query(
    'UPDATE usuarios SET user_reset_token = ?, user_reset_expires = ? WHERE user_email = ?',
    [token, expires, user_email]
  );
  
  // 5. Enviar email com o token (integrar com serviço de email)
  // TODO: Implementar envio de email
  
  return response.status(200).json({
    sucesso: true,
    mensagem: 'Código de recuperação enviado para seu email.',
    // Em desenvolvimento, retornar o token (REMOVER EM PRODUÇÃO)
    token_dev: token
  });
}
```

### **2. Criar endpoint para validar token:**
```javascript
// POST /usuario/validar-token
async validarToken(request, response) {
  const { user_email, token } = request.body;
  
  const [usuario] = await db.query(
    'SELECT user_id, user_reset_expires FROM usuarios WHERE user_email = ? AND user_reset_token = ?',
    [user_email, token]
  );
  
  if (usuario.length === 0) {
    return response.status(400).json({ sucesso: false, mensagem: 'Token inválido.' });
  }
  
  // Verificar se expirou
  if (new Date() > new Date(usuario[0].user_reset_expires)) {
    return response.status(400).json({ sucesso: false, mensagem: 'Token expirado.' });
  }
  
  return response.status(200).json({ sucesso: true, mensagem: 'Token válido.' });
}
```

### **3. Criar endpoint para redefinir senha:**
```javascript
// POST /usuario/redefinir-senha
async redefinirSenha(request, response) {
  const { user_email, token, nova_senha } = request.body;
  
  // 1. Validar token novamente
  const [usuario] = await db.query(
    'SELECT user_id, user_reset_expires FROM usuarios WHERE user_email = ? AND user_reset_token = ?',
    [user_email, token]
  );
  
  if (usuario.length === 0 || new Date() > new Date(usuario[0].user_reset_expires)) {
    return response.status(400).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
  }
  
  // 2. Hash da nova senha
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(nova_senha, salt);
  
  // 3. Atualizar senha e limpar token
  await db.query(
    'UPDATE usuarios SET user_senha = ?, user_reset_token = NULL, user_reset_expires = NULL WHERE user_id = ?',
    [senhaHash, usuario[0].user_id]
  );
  
  return response.status(200).json({
    sucesso: true,
    mensagem: 'Senha redefinida com sucesso!'
  });
}
```

---

## 📱 **Fluxo no Frontend:**

### **1. Tela "Esqueci minha senha"**
- Usuário digita email
- Frontend chama: `POST /usuario/recuperar-senha`
- Backend envia código por email

### **2. Tela "Digite o código"**
- Usuário digita código de 6 dígitos
- Frontend chama: `POST /usuario/validar-token`
- Se válido, avança para próxima tela

### **3. Tela "Nova senha"**
- Usuário digita nova senha
- Frontend chama: `POST /usuario/redefinir-senha`
- Redireciona para login

---

## 🔐 **Segurança:**

✅ **Token de 6 dígitos** (fácil de digitar)  
✅ **Expiração de 15 minutos** (segurança)  
✅ **Token único por usuário** (sobrescreve anterior)  
✅ **Token limpo após uso** (não pode reusar)  
✅ **Senha com bcrypt** (hash seguro)  

---

## 📧 **Integração com Email (Próximo Passo):**

### **Opções de serviço:**
1. **SendGrid** (recomendado, gratuito até 100 emails/dia)
2. **Nodemailer + Gmail** (simples para desenvolvimento)
3. **AWS SES** (se já usa AWS)

### **Exemplo com Nodemailer:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

await transporter.sendMail({
  from: 'noreply@condoway.com',
  to: user_email,
  subject: '🔐 Código de Recuperação - CondoWay',
  html: `
    <h2>Recuperação de Senha</h2>
    <p>Seu código de recuperação é:</p>
    <h1 style="color: #4F46E5; font-size: 32px;">${token}</h1>
    <p>Este código expira em 15 minutos.</p>
  `
});
```

---

## ✅ **Status:**

| Item | Status |
|------|--------|
| 📊 Estrutura do banco | ✅ **CONCLUÍDO** |
| 📁 Scripts SQL atualizados | ✅ **CONCLUÍDO** |
| 🔧 Endpoints backend | ⏳ **PENDENTE** |
| 📧 Envio de email | ⏳ **PENDENTE** |
| 📱 Interface frontend | ⏳ **PENDENTE** |

---

## 🎯 **Próxima Ação:**

1. ✅ **Execute o ALTER TABLE** no banco AWS RDS
2. 🔧 **Implemente os 3 endpoints** em `Usuario.js`
3. 📧 **Configure o serviço de email**
4. 📱 **Crie as telas no frontend**

**Estrutura pronta para implementação!** 🚀
