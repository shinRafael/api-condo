# 📸 Endpoints de Perfil Implementados

## ✅ Resumo das Alterações

Foram implementados com sucesso os endpoints críticos para gerenciamento de perfil de usuário conforme especificado no documento de requisitos.

---

## 🎯 Endpoints Criados/Atualizados

### 1. **POST /usuario/perfil/:id/foto** 
**Upload de Foto de Perfil**

- **Método**: `POST`
- **URL**: `/usuario/perfil/:id/foto`
- **Autenticação**: Bearer Token (JWT)
- **Content-Type**: `multipart/form-data`
- **Campo do arquivo**: `foto`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
foto: [arquivo de imagem]
```

**Validações:**
- ✅ Apenas imagens JPEG, JPG, PNG
- ✅ Tamanho máximo: 5MB
- ✅ Usuário morador só pode alterar sua própria foto
- ✅ Síndico/Funcionário pode alterar foto de qualquer usuário
- ✅ Foto antiga é deletada automaticamente ao fazer upload de nova foto

**Resposta de Sucesso (200):**
```json
{
  "sucesso": true,
  "mensagem": "Foto de perfil atualizada com sucesso.",
  "dados": {
    "filename": "1704564789123-abc123.jpg",
    "path": "/uploads/perfil/1704564789123-abc123.jpg",
    "size": 245678
  }
}
```

**Armazenamento:**
- Arquivos salvos em: `uploads/perfil/`
- Acessíveis via HTTP: `http://localhost:3333/uploads/perfil/[filename]`
- Banco de dados atualizado: campo `user_foto` na tabela `usuarios`

---

### 2. **PUT /usuario/perfil/:id**
**Editar Dados do Perfil**

- **Método**: `PUT`
- **URL**: `/usuario/perfil/:id`
- **Autenticação**: Bearer Token (JWT)
- **Content-Type**: `application/json`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "user_nome": "Nome Completo",
  "user_email": "email@exemplo.com",
  "user_telefone": "(11) 98765-4321",
  "user_tipo": "Morador",
  "user_foto": "/uploads/perfil/foto.jpg",
  "user_senha": "novaSenha123" // opcional - só enviar se quiser alterar
}
```

**Validações:**
- ✅ Usuário morador só pode editar seu próprio perfil
- ✅ Email único (não pode usar email de outro usuário)
- ✅ Senha opcional (se não enviar, mantém a atual)
- ✅ Senha é criptografada com bcrypt (salt de 10)

**Resposta de Sucesso (200):**
```json
{
  "sucesso": true,
  "mensagem": "Usuário atualizado com sucesso."
}
```

---

### 3. **GET /usuario/perfil/:id** (ATUALIZADO)
**Buscar Perfil Completo**

- **Método**: `GET`
- **URL**: `/usuario/perfil/:id`
- **Autenticação**: Bearer Token (JWT)

**Headers:**
```
Authorization: Bearer <token>
```

**Validações:**
- ✅ Usuário morador só pode ver seu próprio perfil
- ✅ Síndico/Funcionário pode ver qualquer perfil

**Resposta de Sucesso (200):**
```json
{
  "sucesso": true,
  "mensagem": "Perfil obtido com sucesso.",
  "dados": {
    "user_id": 1,
    "user_nome": "João Silva",
    "user_email": "joao@exemplo.com",
    "user_telefone": "(11) 98765-4321",
    "user_tipo": "Morador",
    "user_foto": "/uploads/perfil/1704564789123-abc123.jpg",
    "userap_id": 5,
    "ap_id": 12,
    "ap_numero": "101",
    "ap_andar": 1,
    "bloc_id": 3,
    "bloc_nome": "Bloco A",
    "cond_id": 1,
    "cond_nome": "Residencial Sunset"
  }
}
```

**⚠️ IMPORTANTE:** Agora retorna o campo `user_foto` com o caminho da imagem!

---

### 4. **POST /usuario/login** (ATUALIZADO)
**Login do Usuário**

O endpoint de login também foi atualizado para retornar o campo `user_foto` junto com os dados do usuário.

**Resposta de Sucesso (200):**
```json
{
  "sucesso": true,
  "mensagem": "Login bem-sucedido.",
  "dados": {
    "usuario": {
      "user_id": 1,
      "user_nome": "João Silva",
      "user_email": "joao@exemplo.com",
      "user_telefone": "(11) 98765-4321",
      "user_tipo": "Morador",
      "user_foto": "/uploads/perfil/foto.jpg",
      "userap_id": 5,
      "ap_id": 12,
      "ap_numero": "101",
      "bloc_id": 3,
      "bloc_nome": "Bloco A",
      "cond_nome": "Residencial Sunset"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🔧 Alterações Técnicas Realizadas

### Arquivo: `src/controllers/Usuario.js`

1. **Imports adicionados:**
   ```javascript
   const multer = require('multer');
   const path = require('path');
   const fs = require('fs');
   ```

2. **Configuração Multer para perfil:**
   - Storage em `uploads/perfil/`
   - Filtro de arquivos: apenas JPEG, JPG, PNG
   - Limite de tamanho: 5MB
   - Nome único: timestamp + string aleatória

3. **Nova função `uploadfotoperfil`:**
   - Valida permissões (morador só altera própria foto)
   - Verifica se arquivo foi enviado
   - Deleta foto antiga do sistema de arquivos
   - Atualiza campo `user_foto` no banco
   - Retorna dados do arquivo salvo

4. **Função `editarusuario` atualizada:**
   - Aceita campo `user_foto` no body
   - Valida que morador só edita próprio perfil
   - Atualiza `user_foto` no UPDATE SQL
   - Mantém compatibilidade com alteração de senha

5. **Função `buscarperfilcompleto` atualizada:**
   - SELECT agora inclui `u.user_foto AS user_foto`

6. **Função `loginusuario` atualizada:**
   - SELECT agora inclui `u.user_foto`
   - Campo retornado no objeto usuario

### Arquivo: `src/routes/routes-leo.js`

1. **Rotas adicionadas:**
   ```javascript
   // Upload de foto de perfil
   router.post(
     '/usuario/perfil/:id/foto', 
     verificarToken, 
     usuarioController.uploadPerfil.single('foto'), 
     usuarioController.uploadfotoperfil
   );

   // Edição de perfil com PUT
   router.put('/usuario/perfil/:id', verificarToken, usuarioController.editarusuario);
   ```

### Diretório criado:
- `uploads/perfil/` - para armazenar fotos de perfil

---

## 🧪 Como Testar

### 1. Reiniciar o Servidor

**Primeiro, mate o processo na porta 3333:**
```bash
# Windows (PowerShell)
netstat -ano | findstr :3333
taskkill /PID <numero_do_PID> /F

# Ou simplesmente reinicie o terminal
```

**Depois, inicie o servidor:**
```bash
npm run dev
```

### 2. Testar Upload de Foto (Postman)

**Request:**
```
POST http://localhost:3333/usuario/perfil/1/foto
Headers:
  Authorization: Bearer <seu_token_jwt>
Body (form-data):
  foto: [selecione um arquivo .jpg ou .png]
```

**Resposta esperada:**
```json
{
  "sucesso": true,
  "mensagem": "Foto de perfil atualizada com sucesso.",
  "dados": {
    "filename": "1704564789123-abc123.jpg",
    "path": "/uploads/perfil/1704564789123-abc123.jpg",
    "size": 245678
  }
}
```

### 3. Testar Edição de Perfil (Postman)

**Request:**
```
PUT http://localhost:3333/usuario/perfil/1
Headers:
  Authorization: Bearer <seu_token_jwt>
  Content-Type: application/json
Body (JSON):
{
  "user_nome": "Novo Nome",
  "user_email": "novoemail@exemplo.com",
  "user_telefone": "(11) 98765-4321",
  "user_tipo": "Morador"
}
```

**Resposta esperada:**
```json
{
  "sucesso": true,
  "mensagem": "Usuário atualizado com sucesso."
}
```

### 4. Testar Busca de Perfil (Postman)

**Request:**
```
GET http://localhost:3333/usuario/perfil/1
Headers:
  Authorization: Bearer <seu_token_jwt>
```

**Resposta esperada:**
```json
{
  "sucesso": true,
  "mensagem": "Perfil obtido com sucesso.",
  "dados": {
    "user_id": 1,
    "user_nome": "Novo Nome",
    "user_email": "novoemail@exemplo.com",
    "user_telefone": "(11) 98765-4321",
    "user_tipo": "Morador",
    "user_foto": "/uploads/perfil/1704564789123-abc123.jpg",
    ...
  }
}
```

### 5. Acessar a Foto pelo Navegador

```
http://localhost:3333/uploads/perfil/1704564789123-abc123.jpg
```

---

## 🔒 Segurança Implementada

1. **Autenticação JWT obrigatória** em todos os endpoints
2. **Validação de permissões**: Morador só pode alterar/visualizar próprio perfil
3. **Validação de tipo de arquivo**: Apenas imagens (JPEG, JPG, PNG)
4. **Limite de tamanho**: 5MB por arquivo
5. **Limpeza de arquivos**: Foto antiga é deletada ao fazer upload de nova
6. **Senha criptografada**: bcrypt com salt de 10 rodadas
7. **Validação de email único**: Não permite emails duplicados

---

## 📝 Notas Importantes

### ⚠️ Banco de Dados
- Campo `user_foto` já existe na tabela `usuarios` (VARCHAR(255))
- Não é necessário executar ALTER TABLE

### ⚠️ Porta 3333
- Se o servidor não iniciar, verifique se a porta está ocupada
- Use `taskkill` para matar o processo anterior

### ⚠️ Campo vst_telefone em Visitantes
- **AINDA PENDENTE**: Banco de dados precisa ser atualizado
- Executar: `ALTER TABLE Visitantes ADD COLUMN vst_telefone VARCHAR(20) NULL;`
- Ou recriar banco usando `createnovo.sql`

### ⚠️ Frontend
- Atualizar chamadas de API para:
  - `POST /usuario/perfil/:userId/foto` (em vez de `/usuario/:id/foto`)
  - `PUT /usuario/perfil/:userId` (em vez de `/usuario/:id`)
- Campo `user_foto` agora disponível em login e perfil
- URL completa da imagem: `http://localhost:3333${user_foto}`

---

## ✅ Checklist de Implementação

- [x] Criar diretório `uploads/perfil/`
- [x] Configurar multer para upload de fotos de perfil
- [x] Implementar endpoint POST `/usuario/perfil/:id/foto`
- [x] Adicionar validação de permissões (morador só altera própria foto)
- [x] Implementar lógica de exclusão de foto antiga
- [x] Atualizar endpoint PUT `/usuario/perfil/:id` para aceitar `user_foto`
- [x] Adicionar validação de segurança no `editarusuario`
- [x] Atualizar SELECT de `buscarperfilcompleto` para incluir `user_foto`
- [x] Atualizar SELECT de `loginusuario` para incluir `user_foto`
- [x] Registrar rotas em `routes-leo.js`
- [x] Verificar sintaxe (sem erros)
- [ ] Testar upload de foto (PENDENTE - requer restart do servidor)
- [ ] Testar edição de perfil (PENDENTE)
- [ ] Integrar com frontend (PENDENTE)

---

## 🎉 Conclusão

Todos os endpoints críticos para gerenciamento de perfil foram implementados com sucesso! 

**Próximos passos:**
1. Reiniciar o servidor (`npm run dev`)
2. Testar os endpoints com Postman
3. Integrar com o frontend React Native
4. (Opcional) Atualizar banco de dados para campo `vst_telefone` em Visitantes

**Dúvidas ou problemas?** Verifique os logs do servidor e o console de erros.
