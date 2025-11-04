// ===============================================================
// 📂 controllers/condominio.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {
  // =============================================================
  // 📋 LISTAR CONDOMÍNIOS
  // =============================================================
  async listarcondominio(request, response) {
    try {
      const sql = `
        SELECT 
          cond_id, 
          cond_nome, 
          cond_endereco,
          cond_cidade, 
          cond_estado
        FROM condominio;
      `;
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de condomínios.',
        itens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na listagem de condomínios.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR CONDOMÍNIO
  // =============================================================
  async cadastrarcondominio(request, response) {
    try {
      const { nome, endereco, cidade, estado } = request.body;

      if (!nome || !cidade || !estado) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios (nome, cidade, estado) não foram informados.',
        });
      }

      const sql = `
        INSERT INTO condominio (cond_nome, cond_endereco, cond_cidade, cond_estado)
        VALUES (?, ?, ?, ?);
      `;
      const values = [nome, endereco, cidade, estado];
      const [result] = await db.query(sql, values);

      const dados = {
        id: result.insertId,
        nome,
        endereco,
        cidade,
        estado,
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Condomínio cadastrado com sucesso.',
        dados,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro no cadastro de condomínio.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR CONDOMÍNIO
  // =============================================================
  async editarcondominio(request, response) {
    try {
      const { id } = request.params;
      const { nome, endereco, cidade, estado } = request.body;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'ID do condomínio não informado.',
        });
      }

      const sql = `
        UPDATE condominio 
        SET cond_nome = ?, cond_endereco = ?, cond_cidade = ?, cond_estado = ?
        WHERE cond_id = ?;
      `;
      const values = [nome, endereco, cidade, estado, id];
      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Condomínio ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Condomínio ${id} atualizado com sucesso.`,
        dados: {
          id,
          nome,
          endereco,
          cidade,
          estado,
        },
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na edição de condomínio.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR CONDOMÍNIO
  // =============================================================
  async apagarcondominio(request, response) {
    try {
      const { id } = request.params;

      const sql = 'DELETE FROM condominio WHERE cond_id = ?';
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Condomínio ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Condomínio ${id} excluído com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na exclusão de condomínio.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🔍 FILTRAR CONDOMÍNIOS
  // =============================================================
  async filtrarcondominios(request, response) {
    try {
      const { nome } = request.query;

      let sql = 'SELECT * FROM condominio WHERE 1=1';
      const params = [];

      if (nome) {
        sql += ' AND cond_nome LIKE ?';
        params.push(`%${nome}%`);
      }

      const [rows] = await db.query(sql, params);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Condomínios filtrados com sucesso!',
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao filtrar condomínios.',
        dados: error.message,
      });
    }
  },
};
