const bd = require('../dataBase/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_trocar_em_prod';

module.exports = {

  // ============================================================
  // LISTAR TODOS OS USUÁRIOS (Apenas Síndico ou Funcionário)
  // ============================================================
  async listarUsuario(request, response) {
    try {
      const sql = `
        SELECT 
          user_id, user_nome, user_email, user_telefone, user_tipo 
        FROM Usuarios
        ORDER BY user_nome ASC;
      `;
      const [rows] = await bd.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuários listados com sucesso.',
        dados: rows
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao listar usuários.'
      });
    }
  },

  // ============================================================
  // BUSCAR PERFIL COMPLETO (Apenas logado / cada um pode ver o seu)
  // ============================================================
  async buscarPerfilCompleto(request, response) {
    try {
      const { id } = request.params;

      // Apenas o próprio usuário ou um síndico pode ver o perfil
      if (request.user.userType === 'Morador' && Number(request.user.userId) !== Number(id)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Moradores só podem ver o próprio perfil.'
        });
      }

      const sql = `
        SELECT 
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo,
          ua.userap_id,
          ua.ap_id AS ap_id,
          a.ap_numero AS ap_numero,
          a.ap_andar AS ap_andar,
          b.bloc_id AS bloc_id,
          b.bloc_id AS bl_id,
          b.bloc_nome AS bloc_nome,
          b.bloc_nome AS bl_nome,
          c.cond_id AS cond_id,
          c.cond_nome AS cond_nome
        FROM Usuarios u
        LEFT JOIN Usuario_Apartamentos ua ON u.user_id = ua.user_id
        LEFT JOIN Apartamentos a ON ua.ap_id = a.ap_id
        LEFT JOIN Bloco b ON a.bloco_id = b.bloc_id
        LEFT JOIN Condominio c ON b.cond_id = c.cond_id
        WHERE u.user_id = ?
        LIMIT 1;
      `;
      const [rows] = await bd.query(sql, [id]);

      if (rows.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.'
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Perfil obtido com sucesso.',
        dados: rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao buscar perfil.'
      });
    }
  },

  // ============================================================
  // CADASTRAR NOVO USUÁRIO
  // ============================================================
  async cadastrarUsuario(request, response) {
    try {
      const { user_nome, user_email, user_telefone, user_senha, user_tipo } = request.body;

      if (!user_nome || !user_email || !user_senha || !user_tipo) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Preencha todos os campos obrigatórios.',
        });
      }

      const [existente] = await bd.query('SELECT * FROM Usuarios WHERE user_email = ?', [user_email]);
      if (existente.length > 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'E-mail já cadastrado.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(user_senha, salt);

      const sql = `
        INSERT INTO Usuarios (user_nome, user_email, user_telefone, user_senha, user_tipo, user_push_token)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [user_nome, user_email, user_telefone, senhaHash, user_tipo, null];
      const [result] = await bd.query(sql, values);

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Usuário cadastrado com sucesso!',
        dados: { id: result.insertId, user_nome, user_email, user_tipo },
      });
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao cadastrar usuário.',
      });
    }
  },

  // ============================================================
  // EDITAR USUÁRIO
  // ============================================================
  async editarUsuario(request, response) {
    try {
      const { id } = request.params;
      const { user_nome, user_email, user_telefone, user_senha, user_tipo } = request.body;

      let sql, values;

      if (user_senha) {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(user_senha, salt);
        sql = `
          UPDATE Usuarios 
          SET user_nome = ?, user_email = ?, user_telefone = ?, user_senha = ?, user_tipo = ?
          WHERE user_id = ?
        `;
        values = [user_nome, user_email, user_telefone, senhaHash, user_tipo, id];
      } else {
        sql = `
          UPDATE Usuarios 
          SET user_nome = ?, user_email = ?, user_telefone = ?, user_tipo = ?
          WHERE user_id = ?
        `;
        values = [user_nome, user_email, user_telefone, user_tipo, id];
      }

      await bd.query(sql, values);
      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuário atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao editar usuário.',
      });
    }
  },

  // ============================================================
  // APAGAR USUÁRIO (Apenas Síndico)
  // ============================================================
  async apagarUsuario(request, response) {
    try {
      const { id } = request.params;

      const [user] = await bd.query('SELECT * FROM Usuarios WHERE user_id = ?', [id]);
      if (user.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado.',
        });
      }

      await bd.query('DELETE FROM Usuarios WHERE user_id = ?', [id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Usuário removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao apagar usuário:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao apagar usuário.',
      });
    }
  },

  // ============================================================
  // LOGIN USUÁRIO
  // ============================================================
  async loginUsuario(request, response) {
    try {
      const { user_email, user_senha } = request.body;

      if (!user_email || !user_senha) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'E-mail e senha são obrigatórios.',
        });
      }

      const sqlFindUser = `
        SELECT 
          u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo,
          u.user_senha,
          ua.userap_id,
          ua.ap_id AS ap_id,
          a.ap_numero AS ap_numero,
          b.bloc_id AS bl_id,
          b.bloc_nome AS bloc_nome,
          b.bloc_nome AS bl_nome,
          c.cond_nome AS cond_nome
        FROM Usuarios u
        LEFT JOIN Usuario_Apartamentos ua ON u.user_id = ua.user_id
        LEFT JOIN Apartamentos a ON ua.ap_id = a.ap_id
        LEFT JOIN Bloco b ON a.bloco_id = b.bloc_id
        LEFT JOIN Condominio c ON b.cond_id = c.cond_id
        WHERE u.user_email = ?
        LIMIT 1;
      `;
      const [rows] = await bd.query(sqlFindUser, [user_email]);

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
        dados: {
          usuario,
          token,
        },
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao fazer login.',
      });
    }
  },
};
