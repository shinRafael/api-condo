// ===============================================================
// 🧩 controllers/usuario_apartamentos.js — versão padronizada 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {
  // =============================================================
  // 📋 LISTAR USUÁRIOS X APARTAMENTOS
  // =============================================================
  async listarusuariosapartamentos(request, response) {
    try {
      const sql = `
        SELECT userap_id, user_id, ap_id 
        FROM usuario_apartamentos;
      `;
      const [rows] = await db.query(sql);
      const nItens = rows.length;

      const dados = rows.map((item) => ({
        id: item.userap_id,
        usuarioId: item.user_id,
        apartamentoId: item.ap_id,
      }));

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de usuários vinculados aos apartamentos.',
        nItens,
        dados,
      });
    } catch (error) {
      console.error('❌ Erro ao listar usuários-apartamentos:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na listagem de usuários-apartamentos.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧩 CADASTRAR VÍNCULO USUÁRIO x APARTAMENTO
  // =============================================================
  async cadastrarusuariosapartamentos(request, response) {
    try {
      const { user_id, ap_id } = request.body;

      if (!user_id || !ap_id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios não preenchidos (user_id, ap_id).',
        });
      }

      const sql = `
        INSERT INTO usuario_apartamentos (user_id, ap_id)
        VALUES (?, ?);
      `;
      const [result] = await db.query(sql, [user_id, ap_id]);

      const dados = {
        id: result.insertId,
        user_id,
        ap_id,
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Usuário vinculado ao apartamento com sucesso.',
        dados,
      });
    } catch (error) {
      console.error('❌ Erro ao cadastrar vínculo usuário-apartamento:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro no cadastro de usuário-apartamento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR VÍNCULO USUÁRIO x APARTAMENTO
  // =============================================================
  async editarusuariosapartamentos(request, response) {
    try {
      const { id } = request.params;
      const { user_id, ap_id } = request.body;

      const sql = `
        UPDATE usuario_apartamentos 
        SET user_id = ?, ap_id = ?
        WHERE userap_id = ?;
      `;
      const [result] = await db.query(sql, [user_id, ap_id, id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Usuário-apartamento com ID ${id} não encontrado.`,
        });
      }

      const dados = { id, user_id, ap_id };

      return response.status(200).json({
        sucesso: true,
        mensagem: `Vínculo usuário-apartamento ${id} atualizado com sucesso.`,
        dados,
      });
    } catch (error) {
      console.error('❌ Erro ao editar vínculo usuário-apartamento:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na edição de vínculo usuário-apartamento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR VÍNCULO USUÁRIO x APARTAMENTO
  // =============================================================
  async apagarusuariosapartamentos(request, response) {
    try {
      const { id } = request.params;

      const sql = `DELETE FROM usuario_apartamentos WHERE userap_id = ?;`;
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Vínculo com ID ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Vínculo usuário-apartamento ${id} removido com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao apagar vínculo usuário-apartamento:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao remover vínculo usuário-apartamento.',
        dados: error.message,
      });
    }
  },
};
