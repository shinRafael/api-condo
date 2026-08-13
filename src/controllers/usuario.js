// ===============================================================
// 🧩 controllers/usuario.js — versão padronizada 2025
// ===============================================================

const db = require('../dataBase/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { uploadPerfil } = require('./upload');
const transporter = require('../lib/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('❌ [USUARIO] JWT_SECRET ausente ou muito curto no .env.');
  process.exit(1);
}

module.exports = {
  // =============================================================
  // 📋 LISTAR TODOS OS USUÁRIOS (apenas síndico ou funcionário)
  // =============================================================
  async listarusuario(request, response) {
    try {
      const sql = `
        SELECT 
          user_id, user_nome, user_email, user_telefone, user_tipo, user_foto
        FROM usuarios
        ORDER BY user_nome ASC;
      `;
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuários listados com sucesso.',
        dados: rows,
      });
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao listar usuários.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 👤 BUSCAR PERFIL COMPLETO (cada um pode ver apenas o seu)
  // =============================================================
  async buscarperfilcompleto(request, response) {
    try {
      const { id } = request.params;

      if (
        request.user.userType === 'Morador' &&
        Number(request.user.userId) !== Number(id)
      ) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Moradores só podem ver o próprio perfil.',
        });
      }

      const sql = `
        SELECT 
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo, u.user_foto, u.user_data_cadastro,
          ua.userap_id,
          ua.ap_id,
          a.ap_numero,
          a.ap_andar,
          b.bloc_id,
          b.bloc_nome,
          c.cond_id,
          c.cond_nome,
          c.cond_endereco,
          c.cond_cidade,
          c.cond_estado,
          c.cond_taxa_base
        FROM usuarios u
        LEFT JOIN usuario_apartamentos ua ON u.user_id = ua.user_id
        LEFT JOIN apartamentos a ON ua.ap_id = a.ap_id
        LEFT JOIN bloco b ON a.bloc_id = b.bloc_id
        LEFT JOIN condominio c ON b.cond_id = c.cond_id
        WHERE u.user_id = ?
        LIMIT 1;
      `;
      const [rows] = await db.query(sql, [id]);

      if (rows.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Perfil obtido com sucesso.',
        dados: rows[0],
      });
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao buscar perfil.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧩 CADASTRAR NOVO USUÁRIO (sem foto no cadastro)
  // =============================================================
  async cadastrarusuario(request, response) {
    try {
      const { user_nome, user_email, user_telefone, user_senha, user_tipo } =
        request.body;
      if (!user_nome || !user_email || !user_senha || !user_tipo) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Preencha todos os campos obrigatórios.',
        });
      }

      const [existente] = await db.query(
        'SELECT * FROM usuarios WHERE user_email = ?',
        [user_email]
      );
      if (existente.length > 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'E-mail já cadastrado.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(user_senha, salt);

      const telefone =
        user_telefone && user_telefone.trim() !== '' ? user_telefone : null;

      const sql = `
        INSERT INTO usuarios (user_nome, user_email, user_telefone, user_senha, user_tipo)
        VALUES (?, ?, ?, ?, ?)
      `;
      const values = [user_nome, user_email, telefone, senhaHash, user_tipo];
      const [result] = await db.query(sql, values);

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Usuário cadastrado com sucesso!',
        dados: { 
          id: result.insertId, 
          user_nome, 
          user_email, 
          user_tipo
        },
      });
    } catch (error) {
      console.error('❌ Erro ao cadastrar usuário:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao cadastrar usuário.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📱 CADASTRO PÚBLICO DE MORADOR (app mobile — POST /usuario/cadastro)
  // Força user_tipo='Morador' — ninguém se auto-cadastra como Síndico/ADM.
  // =============================================================
  async cadastrarusuarioPublico(request, response) {
    try {
      const { user_nome, user_email, user_telefone, user_senha } = request.body;

      if (!user_nome || !user_email || !user_senha) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Preencha todos os campos obrigatórios.',
        });
      }

      if (String(user_senha).length < 6) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'A senha deve ter pelo menos 6 caracteres.',
        });
      }

      // 🔒 Normaliza e-mail para lowercase — evita duplicata case-sensitive
      const emailNormalizado = String(user_email).trim().toLowerCase();

      const [existente] = await db.query(
        'SELECT * FROM usuarios WHERE user_email = ?',
        [emailNormalizado]
      );
      if (existente.length > 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'E-mail já cadastrado.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(user_senha, salt);
      const telefone =
        user_telefone && user_telefone.trim() !== '' ? user_telefone : null;

      // 🔒 user_tipo é SEMPRE 'Morador' no cadastro público
      const sql = `
        INSERT INTO usuarios (user_nome, user_email, user_telefone, user_senha, user_tipo)
        VALUES (?, ?, ?, ?, 'Morador')
      `;
      const values = [user_nome, emailNormalizado, telefone, senhaHash];
      const [result] = await db.query(sql, values);

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Cadastro realizado com sucesso!',
        dados: {
          id: result.insertId,
          user_nome,
          user_email: emailNormalizado,
          user_tipo: 'Morador',
        },
      });
    } catch (error) {
      console.error('❌ Erro ao cadastrar usuário público:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao cadastrar usuário.',
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR USUÁRIO
  // =============================================================
  async editarusuario(request, response) {
    try {
      // 🔍 LOGS PARA DEBUG
      // ⚠️ NUNCA logar request.body — contém user_senha em texto puro
      console.log('📸 Arquivo recebido:', request.file);
      console.log('🔑 Headers:', request.headers['content-type']);
      
      const { id } = request.params;
      const { user_nome, user_email, user_telefone, user_senha, user_tipo, user_foto } =
        request.body;

      // 🔒 Validação de posse: apenas Síndico/ADM podem editar OUTRO usuário.
            // (Morador E Funcionário só editam o próprio perfil — evita ATO por
            // porteiro alterando senha de qualquer morador.)
            const ehEquipeAmpla = ['Sindico', 'ADM'].includes(request.user?.userType);
            if (
              !ehEquipeAmpla &&
              Number(request.user?.userId) !== Number(id)
            ) {
              return response.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado. Você só pode editar seu próprio perfil.',
              });
            }

      // ⚠️ Se for apenas upload de foto (sem outros campos obrigatórios)
      if (request.file && !user_email) {
        console.log('🎯 Modo: Upload de foto apenas');
        
        // Buscar dados atuais do usuário
        const [usuarioExiste] = await db.query(
          'SELECT user_foto FROM usuarios WHERE user_id = ?',
          [id]
        );

        if (usuarioExiste.length === 0) {
          return response.status(404).json({
            sucesso: false,
            mensagem: 'Usuário não encontrado.',
          });
        }

        const fotoNova = `/uploads/perfil/${request.file.filename}`;
        
        // Deletar foto antiga se existir
        if (usuarioExiste[0].user_foto) {
          const fs = require('fs');
          const path = require('path');
          const oldPhotoPath = path.join(__dirname, '../../', usuarioExiste[0].user_foto);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }

        // Atualizar apenas a foto
        await db.query('UPDATE usuarios SET user_foto = ? WHERE user_id = ?', [fotoNova, id]);

        return response.status(200).json({
          sucesso: true,
          mensagem: 'Foto atualizada com sucesso.',
          dados: {
            user_id: parseInt(id),
            user_foto: fotoNova
          }
        });
      }

      // Validação: email obrigatório (para atualização completa)
      if (!user_email || user_email.trim() === '') {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Email é obrigatório.',
        });
      }

      // Validação: formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user_email)) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Formato de email inválido.',
        });
      }

      // Validação: telefone com 10 ou 11 dígitos (se fornecido)
      if (user_telefone && user_telefone.trim() !== '') {
        const telefoneNumeros = user_telefone.replace(/\D/g, '');
        if (telefoneNumeros.length !== 10 && telefoneNumeros.length !== 11) {
          return response.status(400).json({
            sucesso: false,
            mensagem: 'Telefone deve ter 10 ou 11 dígitos.',
          });
        }
      }

      // Validação: email único
      const [duplicado] = await db.query(
        'SELECT user_id FROM usuarios WHERE user_email = ? AND user_id != ?',
        [user_email, id]
      );
      if (duplicado.length > 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Já existe um usuário com este e-mail.',
        });
      }

      // Verificar se usuário existe e buscar dados atuais
      const [usuarioExiste] = await db.query(
        'SELECT user_nome, user_tipo, user_foto FROM usuarios WHERE user_id = ?',
        [id]
      );

      if (usuarioExiste.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      // Tratar telefone (null se vazio)
      const telefone =
        user_telefone && user_telefone.trim() !== '' ? user_telefone : null;

      // Para edição de perfil (morador), manter nome e tipo originais
      const nomeAtualizar = user_nome || usuarioExiste[0].user_nome;

      // 🔒 Segurança (anti-escalada de privilégio): apenas Síndico/ADM podem
      // alterar o user_tipo. Qualquer tentativa de mudança de cargo por
      // Morador/Funcionário é IGNORADA — o tipo permanece o atual.
      const podeAlterarTipo = ['Sindico', 'ADM'].includes(request.user?.userType);
      const tiposValidos = ['ADM', 'Sindico', 'Funcionario', 'Morador'];
      let tipoAtualizar = usuarioExiste[0].user_tipo;
      if (podeAlterarTipo && user_tipo && tiposValidos.includes(user_tipo)) {
        tipoAtualizar = user_tipo;
      }
      
      // ✅ UPLOAD DE FOTO: Se houver nova foto, usar; senão, manter a atual
      let fotoAtualizar = usuarioExiste[0].user_foto;
      if (request.file) {
        fotoAtualizar = `/uploads/perfil/${request.file.filename}`;
        
        // Deletar foto antiga se existir
        if (usuarioExiste[0].user_foto) {
          const fs = require('fs');
          const path = require('path');
          const oldPhotoPath = path.join(__dirname, '../../', usuarioExiste[0].user_foto);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
      } else if (user_foto !== undefined) {
        // Se user_foto for enviado no body (não pelo upload), usar ele
        fotoAtualizar = user_foto;
      }

      let sql, values;
      if (user_senha) {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(user_senha, salt);
        sql = `
          UPDATE usuarios 
          SET user_nome = ?, user_email = ?, user_telefone = ?, user_senha = ?, user_tipo = ?, user_foto = ?
          WHERE user_id = ?
        `;
        values = [nomeAtualizar, user_email, telefone, senhaHash, tipoAtualizar, fotoAtualizar, id];
      } else {
        sql = `
          UPDATE usuarios 
          SET user_nome = ?, user_email = ?, user_telefone = ?, user_tipo = ?, user_foto = ?
          WHERE user_id = ?
        `;
        values = [nomeAtualizar, user_email, telefone, tipoAtualizar, fotoAtualizar, id];
      }

      await db.query(sql, values);

      // Buscar dados atualizados do usuário
      const sqlSelect = `
        SELECT 
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo, u.user_foto, u.user_data_cadastro,
          ua.userap_id,
          ua.ap_id,
          a.ap_numero,
          a.ap_andar,
          b.bloc_id,
          b.bloc_nome,
          c.cond_id,
          c.cond_nome,
          c.cond_endereco,
          c.cond_cidade,
          c.cond_estado,
          c.cond_taxa_base
        FROM usuarios u
        LEFT JOIN usuario_apartamentos ua ON u.user_id = ua.user_id
        LEFT JOIN apartamentos a ON ua.ap_id = a.ap_id
        LEFT JOIN bloco b ON a.bloc_id = b.bloc_id
        LEFT JOIN condominio c ON b.cond_id = c.cond_id
        WHERE u.user_id = ?
        LIMIT 1;
      `;
      const [usuario] = await db.query(sqlSelect, [id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuário atualizado com sucesso.',
        dados: usuario[0],
      });
    } catch (error) {
      console.error('❌ Erro ao editar usuário:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao editar usuário.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ️ APAGAR USUÁRIO (apenas síndico)
  // =============================================================
  async apagarusuario(request, response) {
    try {
      const { id } = request.params;

      const [user] = await db.query('SELECT * FROM usuarios WHERE user_id = ?', [
        id,
      ]);
      if (user.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      await db.query('DELETE FROM usuario_apartamentos WHERE user_id = ?', [id]);
      await db.query('DELETE FROM usuarios WHERE user_id = ?', [id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuário removido com sucesso.',
      });
    } catch (error) {
      console.error('❌ Erro ao apagar usuário:', error);

      // 🔒 Erro amigável para violação de chave estrangeira (1451 / ER_ROW_IS_REFERENCED)
      if (
        error.code === 'ER_ROW_IS_REFERENCED_2' ||
        error.code === 'ER_ROW_IS_REFERENCED' ||
        error.errno === 1451
      ) {
        return response.status(409).json({
          sucesso: false,
          mensagem:
            'Não é possível excluir este usuário: existem registros vinculados ' +
            '(encomendas, ocorrências, visitantes, mensagens ou notificações). ' +
            'Exclua ou reatribua esses registros antes de remover o usuário.',
        });
      }

      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao apagar usuário.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // � ALTERAR SENHA DO USUÁRIO
  // =============================================================
  async alterarsenha(request, response) {
    try {
      const { id } = request.params;
      const { senhaAtual, novaSenha } = request.body;

      // Validação: usuário só pode alterar própria senha
      if (
        request.user.userType === 'Morador' &&
        Number(request.user.userId) !== Number(id)
      ) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode alterar sua própria senha.',
        });
      }

      if (!senhaAtual || !novaSenha) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Senha atual e nova senha são obrigatórias.',
        });
      }

      if (novaSenha.length < 6) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'A nova senha deve ter no mínimo 6 caracteres.',
        });
      }

      // Buscar usuário e verificar senha atual
      const [usuario] = await db.query(
        'SELECT user_senha FROM usuarios WHERE user_id = ?',
        [id]
      );

      if (usuario.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      // Verificar se senha atual está correta
      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario[0].user_senha);
      
      if (!senhaCorreta) {
        return response.status(401).json({
          sucesso: false,
          mensagem: 'Senha atual incorreta.',
        });
      }

      // Criptografar nova senha
      const salt = await bcrypt.genSalt(10);
      const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

      // Atualizar senha no banco
      const sql = 'UPDATE usuarios SET user_senha = ? WHERE user_id = ?';
      await db.query(sql, [novaSenhaHash, id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Senha alterada com sucesso.',
      });
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao alterar senha.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // �🔐 LOGIN USUÁRIO
  // =============================================================
  async loginusuario(request, response) {
    try {
      const { user_email, user_senha } = request.body;

      if (!user_email || !user_senha) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'E-mail e senha são obrigatórios.',
        });
      }

      const sql = `
        SELECT 
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo, u.user_senha, u.user_foto, u.user_data_cadastro,
          ua.userap_id,
          ua.ap_id,
          a.ap_numero,
          b.bloc_id,
          b.bloc_nome,
          c.cond_id,
          c.cond_nome,
          c.cond_endereco,
          c.cond_cidade,
          c.cond_estado,
          c.cond_taxa_base
        FROM usuarios u
        LEFT JOIN usuario_apartamentos ua ON u.user_id = ua.user_id
        LEFT JOIN apartamentos a ON ua.ap_id = a.ap_id
        LEFT JOIN bloco b ON a.bloc_id = b.bloc_id
        LEFT JOIN condominio c ON b.cond_id = c.cond_id
        WHERE u.user_email = ?
        LIMIT 1;
      `;
      const [rows] = await db.query(sql, [user_email]);

      if (rows.length === 0) {
        return response.status(401).json({
          sucesso: false,
          mensagem: 'E-mail ou senha inválidos.',
        });
      }

      const usuario = rows[0];
      const senhaCorreta = await bcrypt.compare(user_senha, usuario.user_senha);

      if (!senhaCorreta) {
        return response.status(401).json({
          sucesso: false,
          mensagem: 'E-mail ou senha inválidos.',
        });
      }

      const payload = {
        userId: usuario.user_id,
        userType: usuario.user_tipo,
        userApId: usuario.userap_id || null,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // 7 dias de validade
      delete usuario.user_senha;

      // Formatar resposta conforme esperado pelo frontend
      return response.status(200).json({
        dados: {
          token: token,
          usuario: {
            user_id: usuario.user_id,
            user_nome: usuario.user_nome,
            user_email: usuario.user_email,
            user_tipo: usuario.user_tipo
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao fazer login.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📸 UPLOAD FOTO DE PERFIL
  // =============================================================
  async uploadfotoperfil(request, response) {
    try {
      const { id } = request.params;

      // Validação: usuário só pode alterar própria foto (a menos que seja admin/síndico)
      if (
        request.user.userType === 'Morador' &&
        Number(request.user.userId) !== Number(id)
      ) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode alterar sua própria foto.',
        });
      }

      if (!request.file) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Nenhuma imagem foi enviada.',
        });
      }

      const fotoPath = `/uploads/perfil/${request.file.filename}`;

      // Buscar foto antiga para deletar (opcional)
      const [usuario] = await db.query(
        'SELECT user_foto FROM usuarios WHERE user_id = ?',
        [id]
      );

      if (usuario.length === 0) {
        // Se usuário não existe, deletar a imagem recém-carregada
        fs.unlinkSync(request.file.path);
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      // Deletar foto antiga se existir
      if (usuario[0].user_foto) {
        const oldPhotoPath = path.join(__dirname, '../../', usuario[0].user_foto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Atualizar banco de dados
      
      const sql = 'UPDATE usuarios SET user_foto = ? WHERE user_id = ?';
      const [resultado] = await db.query(sql, [fotoPath, id]);

      // Verificar se realmente salvou
      const [verificacao] = await db.query(
        'SELECT user_id, user_foto FROM usuarios WHERE user_id = ?',
        [id]
      );

      if (!verificacao[0] || verificacao[0].user_foto !== fotoPath) {
        return response.status(500).json({
          sucesso: false,
          mensagem: 'Erro: foto foi salva no servidor mas não foi atualizada no banco de dados.',
          dados: {
            esperado: fotoPath,
            obtido: verificacao[0]?.user_foto,
          },
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Foto de perfil atualizada com sucesso.',
        url: fotoPath, // Para compatibilidade com frontend
        dados: {
          filename: request.file.filename,
          path: fotoPath,
          user_foto: fotoPath,
          size: request.file.size,
        },
      });
    } catch (error) {
      console.error('❌ Erro ao fazer upload da foto de perfil:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao fazer upload da foto.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🔐 SOLICITAR RESET DE SENHA (Enviar código por email)
  // =============================================================
  async solicitarReset(request, response) {
    try {
      const { user_email } = request.body;

      // Validação: email obrigatório
      if (!user_email || user_email.trim() === '') {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Email é obrigatório.',
        });
      }

      // Verificar se email existe
      const [usuario] = await db.query(
        'SELECT user_id, user_nome FROM usuarios WHERE user_email = ?',
        [user_email]
      );

      if (usuario.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Email não encontrado.',
        });
      }

      // Gerar código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();

      // Definir expiração (10 minutos)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Salvar no banco
      await db.query(
        'UPDATE usuarios SET user_reset_token = ?, user_reset_expires = ? WHERE user_email = ?',
        [codigo, expiresAt, user_email]
      );

      // Enviar email
      try {
        await transporter.sendMail({
          from: '"CondoWay" <noreply@condoway.com>',
          to: user_email,
          subject: '🔐 Código de Recuperação de Senha - CondoWay',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Recuperação de Senha</h2>
              <p>Olá, <strong>${usuario[0].user_nome}</strong>!</p>
              <p>Você solicitou a recuperação de senha da sua conta no CondoWay.</p>
              <p>Seu código de verificação é:</p>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #4F46E5; font-size: 36px; margin: 0; letter-spacing: 8px;">${codigo}</h1>
              </div>
              <p><strong>⏰ Este código expira em 10 minutos.</strong></p>
              <p>Se você não solicitou esta recuperação, ignore este email.</p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="color: #6B7280; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </div>
          `,
        });

        console.log('✅ Email de recuperação enviado para:', user_email);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email:', emailError);
        return response.status(500).json({
          sucesso: false,
          mensagem: 'Erro ao enviar email. Tente novamente mais tarde.',
          dados: emailError.message,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Código de recuperação enviado para seu email.',
        // ⚠️ REMOVER EM PRODUÇÃO (apenas para testes)
        codigo_dev: process.env.NODE_ENV === 'development' ? codigo : undefined,
      });
    } catch (error) {
      console.error('❌ Erro ao solicitar reset:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao processar solicitação.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🔄 RESETAR SENHA (Validar código e atualizar senha)
  // =============================================================
  async resetarSenha(request, response) {
    try {
      const { codigo, novaSenha } = request.body;

      // Validações
      if (!codigo || !novaSenha) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Código e nova senha são obrigatórios.',
        });
      }

      if (novaSenha.length < 6) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'A nova senha deve ter no mínimo 6 caracteres.',
        });
      }

      // Buscar usuário pelo token (não precisa do email)
      const [usuario] = await db.query(
        'SELECT user_id, user_nome, user_reset_token, user_reset_expires FROM usuarios WHERE user_reset_token = ?',
        [codigo]
      );

      if (usuario.length === 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Código inválido ou não encontrado.',
        });
      }

      // Verificar se token expirou
      const agora = new Date();
      const expiraEm = new Date(usuario[0].user_reset_expires);

      if (agora > expiraEm) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Código expirado. Solicite um novo código.',
        });
      }

      // Hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(novaSenha, salt);

      // Atualizar senha e limpar token
      await db.query(
        'UPDATE usuarios SET user_senha = ?, user_reset_token = NULL, user_reset_expires = NULL WHERE user_id = ?',
        [senhaHash, usuario[0].user_id]
      );

      console.log('✅ Senha redefinida para usuário:', usuario[0].user_nome);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Senha redefinida com sucesso! Faça login com sua nova senha.',
      });
    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao resetar senha.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📱 REGISTRAR DISPOSITIVO (push token do app mobile)
  // =============================================================
  async registrarDispositivo(request, response) {
    try {
      // 🔒 Usa o ID do usuário autenticado pelo JWT — nunca do body
      const userId = request.user?.userId || request.user?.user_id;
      if (!userId) {
        return response.status(401).json({
          sucesso: false,
          mensagem: 'Usuário não autenticado.',
        });
      }

      // Aceita token | user_push_token | device_token (contrato do app mobile)
      const token = request.body?.token || request.body?.user_push_token || request.body?.device_token;
      if (!token || typeof token !== 'string' || !token.trim()) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O campo token (ou user_push_token / device_token) é obrigatório.',
        });
      }

      if (token.length > 255) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O token de push não pode exceder 255 caracteres.',
        });
      }

      const tokenLimpo = token.trim();

      // 🔄 Transação: libera o token de QUALQUER outro usuário (dispositivo
      // compartilhado — tablet de portaria, celular de casal) e só então
      // grava no usuário atual. Evita ER_DUP_ENTRY no UNIQUE user_push_token.
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // 1) Libera o token de qualquer outro usuário que ainda o possua
        await conn.query(
          'UPDATE usuarios SET user_push_token = NULL WHERE user_push_token = ?',
          [tokenLimpo]
        );

        // 2) Grava o token no usuário atual (novo dono do aparelho)
        await conn.query(
          'UPDATE usuarios SET user_push_token = ? WHERE user_id = ?',
          [tokenLimpo, userId]
        );

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Dispositivo registrado com sucesso.',
      });
    } catch (error) {
      console.error('❌ Erro ao registrar dispositivo:', error);
      // Fallback idempotente: corrida concorrente pode reintroduzir o token
      // entre a liberação e a gravação — duplicidade não deve virar erro 500
      if (error && error.errno === 1062) {
        return response.status(200).json({
          sucesso: true,
          mensagem: 'Dispositivo já registrado com este token.',
        });
      }
      // ⚠️ NUNCA devolver error.message ao cliente (vaza SQL interno)
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao registrar dispositivo.',
      });
    }
  },
};
