// ===============================================================
// 🧩 controllers/usuario.js — versão padronizada 2025
// ===============================================================

const db = require('../dataBase/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { uploadPerfil } = require('./upload');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_trocar_em_prod';

module.exports = {
  // =============================================================
  // 📋 LISTAR TODOS OS USUÁRIOS (apenas síndico ou funcionário)
  // =============================================================
  async listarusuario(request, response) {
    try {
      const sql = `
        SELECT 
          user_id, user_nome, user_email, user_telefone, user_tipo 
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
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo, u.user_foto,
          ua.userap_id,
          ua.ap_id,
          a.ap_numero,
          a.ap_andar,
          b.bloc_id,
          b.bloc_nome,
          c.cond_id,
          c.cond_nome
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
  // 🧩 CADASTRAR NOVO USUÁRIO
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
        dados: { id: result.insertId, user_nome, user_email, user_tipo },
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
  // ✏️ EDITAR USUÁRIO
  // =============================================================
  async editarusuario(request, response) {
    try {
      const { id } = request.params;
      const { user_nome, user_email, user_telefone, user_senha, user_tipo, user_foto } =
        request.body;

      // Validação: morador só pode editar próprio perfil
      if (
        request.user.userType === 'Morador' &&
        Number(request.user.userId) !== Number(id)
      ) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode editar seu próprio perfil.',
        });
      }

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

      const telefone =
        user_telefone && user_telefone.trim() !== '' ? user_telefone : null;

      let sql, values;
      if (user_senha) {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(user_senha, salt);
        sql = `
          UPDATE usuarios 
          SET user_nome = ?, user_email = ?, user_telefone = ?, user_senha = ?, user_tipo = ?, user_foto = ?
          WHERE user_id = ?
        `;
        values = [user_nome, user_email, telefone, senhaHash, user_tipo, user_foto || null, id];
      } else {
        sql = `
          UPDATE usuarios 
          SET user_nome = ?, user_email = ?, user_telefone = ?, user_tipo = ?, user_foto = ?
          WHERE user_id = ?
        `;
        values = [user_nome, user_email, telefone, user_tipo, user_foto || null, id];
      }

      const [result] = await db.query(sql, values);
      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuário atualizado com sucesso.',
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
  // 🗑️ APAGAR USUÁRIO (apenas síndico)
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
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao apagar usuário.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🔐 LOGIN USUÁRIO
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
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo, u.user_senha, u.user_foto,
          ua.userap_id,
          ua.ap_id,
          a.ap_numero,
          b.bloc_id,
          b.bloc_nome,
          c.cond_id,
          c.cond_nome
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

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      delete usuario.user_senha;

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Login bem-sucedido.',
        dados: { usuario, token },
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
      await db.query(sql, [fotoPath, id]);

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
};
