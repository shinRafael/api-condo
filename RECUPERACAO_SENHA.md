# 🔐 Sistema de Recuperação de Senha - CondoWay

## ✅ **Estrutura do Banco de Dados**

### 📋 **Colunas na Tabela `usuarios` (implementadas):**

```sql
user_reset_token VARCHAR(10) NULL      -- Código de 6 dígitos para recuperação
user_reset_expires DATETIME NULL       -- Data/hora de expiração (10 minutos)
```

> As colunas já fazem parte do `CREATE TABLE` em `src/dataBase/createbanco/createnovo.sql` (linhas 58-59).

---

## 📁 **Scripts SQL Atualizados:**

### ✅ **`createnovo.sql`**
- Colunas `user_reset_token` e `user_reset_expires` na tabela `usuarios` (linhas 58-59)

### ✅ **`insert.novo.sql`**
- INSERTs incluem os novos campos (NULL por padrão)

### ✅ **`select.sql`**
- SELECT detalhado incluindo as novas colunas

> ⚠️ **Não existe** script `alter_add_reset_password.sql` no repositório — as colunas já estão no schema (`src/dataBase/createbanco/` contém apenas `createnovo.sql`, `drop.sql`, `insert.novo.sql` e `select.sql`).

---

## 🗄️ **Banco de Dados em Produção:**

- **Provedor:** Hostinger (MySQL)
- **Servidor:** `212.85.3.212` (porta 3306)
- **Banco:** `u815496249_condoway`
- **Credenciais:** definidas no `.env` (`BD_SERVIDOR`, `BD_USUARIO`, `BD_SENHA`, `BD_BANCO`) — **nunca expor**
- As colunas de recuperação de senha já estão aplicadas no schema do banco

### **Caso precise aplicar em outro ambiente (banco já criado):**

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

## 🔧 **Endpoints Backend (✅ IMPLEMENTADOS):**

Ambos são **públicos** (não exigem token JWT) e estão registrados em `src/routes/routes-leo.js` (linhas 20-21), com a lógica em `src/controllers/usuario.js`.

### **1. `POST /usuario/recuperar-senha`** → `solicitarReset` (usuario.js ~linhas 792-878)

**Body:** `{ user_email }`

**Fluxo:**
1. Valida se `user_email` é obrigatório
2. Verifica se o e-mail existe no banco (404 se não encontrar)
3. Gera código numérico de 6 dígitos
4. Salva o código em `user_reset_token` com expiração em `user_reset_expires` (**10 minutos**)
5. Envia e-mail com o código via **Nodemailer** (`src/lib/mailer.js`)
6. Retorna `{ sucesso, mensagem, codigo_dev }` — `codigo_dev` (o código em si) só é retornado quando `NODE_ENV === 'development'` (⚠️ remover em produção)

```javascript
// Trecho real (usuario.js)
const codigo = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

await db.query(
  'UPDATE usuarios SET user_reset_token = ?, user_reset_expires = ? WHERE user_email = ?',
  [codigo, expiresAt, user_email]
);

await transporter.sendMail({
  from: '"CondoWay" <noreply@condoway.com>',
  to: user_email,
  subject: '🔐 Código de Recuperação de Senha - CondoWay',
  html: `...código em destaque + "Este código expira em 10 minutos"...`,
});
```

### **2. `POST /usuario/redefinir-senha`** → `resetarSenha` (usuario.js ~linhas 883-950)

**Body:** `{ codigo, novaSenha }`

**Fluxo:**
1. Valida `codigo` e `novaSenha` (mínimo de 6 caracteres)
2. Busca o usuário pelo `user_reset_token` (não depende do e-mail)
3. Verifica se o código expirou (10 minutos) → 400 se expirado
4. Gera hash **bcrypt** da nova senha
5. Atualiza `user_senha` e limpa `user_reset_token`/`user_reset_expires` (código não pode ser reutilizado)
6. Retorna `{ sucesso: true, mensagem: 'Senha redefinida com sucesso!...' }`

```javascript
// Trecho real (usuario.js)
const { codigo, novaSenha } = request.body;

const [usuario] = await db.query(
  'SELECT user_id, user_nome, user_reset_token, user_reset_expires FROM usuarios WHERE user_reset_token = ?',
  [codigo]
);

if (agora > expiraEm) {
  return response.status(400).json({ sucesso: false, mensagem: 'Código expirado. Solicite um novo código.' });
}

const salt = await bcrypt.genSalt(10);
const senhaHash = await bcrypt.hash(novaSenha, salt);

await db.query(
  'UPDATE usuarios SET user_senha = ?, user_reset_token = NULL, user_reset_expires = NULL WHERE user_id = ?',
  [senhaHash, usuario[0].user_id]
);
```

> ℹ️ **Não existe** (e não é necessário) um endpoint `validar-token`: a validação do código e da expiração é feita pelo próprio `POST /usuario/redefinir-senha` em um único passo.

---

## 📱 **Fluxo no Frontend (✅ IMPLEMENTADO):**

App mobile em `TCC-OFICIAL/projeto-condoway-old/src/screens/Auth/`

### **1. Tela "Esqueci minha senha"** (`ForgotPassword/index.js`)
- Usuário digita o e-mail
- Frontend chama `apiService.solicitarRecuperacaoSenha(email)` (linha 54) → `POST /usuario/recuperar-senha` com `{ user_email }`
- Backend envia o código por e-mail
- Navega para a tela `ResetPassword` após 4 segundos

### **2. Tela "Nova senha"** (`ResetPassword/index.js`)
- Usuário digita o código de 6 dígitos + a nova senha
- Frontend chama `apiService.redefinirSenha(email, codigo, novaSenha)` (linha 122) → `POST /usuario/redefinir-senha` com `{ codigo, novaSenha }`
- Redireciona para o login após sucesso

> O botão "Validar Código" do app é uma validação **local simulada** (não chama endpoint) — a validação real do código acontece no backend, no `redefinir-senha`.

---

## 🔐 **Segurança:**

✅ **Código de 6 dígitos** (fácil de digitar)
✅ **Expiração de 10 minutos** (segurança)
✅ **Código único por usuário** (sobrescreve anterior)
✅ **Código limpo após uso** (não pode reusar)
✅ **Senha com bcrypt** (hash seguro)
✅ **`codigo_dev` só em desenvolvimento** (`NODE_ENV === 'development'`) — remover em produção
✅ **Redefinição não depende do e-mail** (busca pelo código, reduzindo enumeração)

---

## 📧 **Envio de E-mail (✅ IMPLEMENTADO):**

- **Nodemailer** configurado em `src/lib/mailer.js` (Mailtrap, para desenvolvimento)
- Remetente: `"CondoWay" <noreply@condoway.com>`
- E-mail HTML com o código em destaque e aviso: **"Este código expira em 10 minutos"**
- Credenciais definidas no `.env` (`MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASSWORD`) — **nunca expor**

---

## ✅ **Status:**

| Item | Status |
|------|--------|
| 📊 Estrutura do banco | ✅ **CONCLUÍDO** |
| 📁 Scripts SQL | ✅ **CONCLUÍDO** |
| 🔧 Endpoints backend | ✅ **CONCLUÍDO** |
| 📧 Envio de email | ✅ **CONCLUÍDO** |
| 📱 Interface frontend | ✅ **CONCLUÍDO** |

---

## 🎯 **Próximas Ações / Pendências:**

1. ⚠️ **Revisar o `codigo_dev`** — garantir que o código não seja retornado pela API em produção (`NODE_ENV`)
2. 🔧 **Substituir o Mailtrap por provedor real** (SendGrid, SES, etc.) quando o envio em produção for necessário
3. 🔄 **Teste de ponta a ponta**: solicitar código → receber e-mail → redefinir senha → login
4. 🧹 **Opcional:** remover a simulação do botão "Validar Código" do app (validação real já é feita no backend)

**Fluxo completo implementado!** 🚀
