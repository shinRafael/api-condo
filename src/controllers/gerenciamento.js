// ===============================================================
// 💰 controllers/gerenciamento.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {
  // =============================================================
  // 📋 LISTAR GERENCIAMENTOS
  // =============================================================
  async listarGerenciamento(request, response) {
    try {
      const sql = `
        SELECT 
          ger.ger_id,
          ger.cond_id,
          cond.cond_nome,
          DATE_FORMAT(ger.ger_data, '%d/%m/%Y') AS ger_data,
          ger.ger_descricao,
          ger.ger_valor
        FROM gerenciamento AS ger
        INNER JOIN condominio AS cond 
          ON ger.cond_id = cond.cond_id
        ORDER BY ger.ger_data DESC;
      `;

      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de registros de gerenciamento recuperada com sucesso.',
        itens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar registros de gerenciamento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR GERENCIAMENTO
  // =============================================================
  async cadastrarGerenciamento(request, response) {
    try {
      const { cond_id, ger_data, ger_descricao, ger_valor } = request.body;

      if (!cond_id || !ger_data || !ger_descricao || !ger_valor) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios não informados (cond_id, ger_data, ger_descricao, ger_valor).',
        });
      }

      const sql = `
        INSERT INTO gerenciamento
          (cond_id, ger_data, ger_descricao, ger_valor)
        VALUES (?, ?, ?, ?);
      `;
      const values = [cond_id, ger_data, ger_descricao, ger_valor];
      const [result] = await db.query(sql, values);

      // Buscar nome do condomínio para resposta
      const [cond] = await db.query('SELECT cond_nome FROM condominio WHERE cond_id = ?', [cond_id]);

      const dados = {
        ger_id: result.insertId,
        cond_id,
        cond_nome: cond.length > 0 ? cond[0].cond_nome : null,
        ger_data,
        ger_descricao,
        ger_valor,
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Gerenciamento cadastrado com sucesso.',
        dados,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar gerenciamento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR GERENCIAMENTO
  // =============================================================
  async editargerenciamento(request, response) {
    try {
      const { id } = request.params;
      const { cond_id, ger_data, ger_descricao, ger_valor } = request.body;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O ID do gerenciamento é obrigatório.',
        });
      }

      const sql = `
        UPDATE gerenciamento
        SET cond_id = ?, ger_data = ?, ger_descricao = ?, ger_valor = ?
        WHERE ger_id = ?;
      `;
      const values = [cond_id, ger_data, ger_descricao, ger_valor, id];
      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Gerenciamento ${id} não encontrado.`,
        });
      }

      const dados = {
        ger_id: id,
        cond_id,
        ger_data,
        ger_descricao,
        ger_valor,
      };

      return response.status(200).json({
        sucesso: true,
        mensagem: `Gerenciamento ${id} atualizado com sucesso.`,
        dados,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar gerenciamento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR GERENCIAMENTO
  // =============================================================
  async apagargerenciamento(request, response) {
    try {
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O ID do gerenciamento é obrigatório.',
        });
      }

      const sql = 'DELETE FROM gerenciamento WHERE ger_id = ?;';
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Gerenciamento ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Gerenciamento ${id} excluído com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao excluir gerenciamento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🔍 FILTRAR GERENCIAMENTO
  // =============================================================
  async filtrarGerenciamento(request, response) {
    try {
      const { condominio, descricao } = request.query;
      let sql = `
        SELECT 
          ger_id,
          cond_id,
          ger_data,
          ger_descricao,
          ger_valor
        FROM gerenciamento
        WHERE 1=1
      `;
      const params = [];

      if (condominio) {
        sql += ' AND cond_id = ?';
        params.push(condominio);
      }

      if (descricao) {
        sql += ' AND ger_descricao LIKE ?';
        params.push(`%${descricao}%`);
      }

      const [rows] = await db.query(sql, params);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Gerenciamentos filtrados com sucesso.',
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao filtrar gerenciamento.',
        dados: error.message,
      });
    }
  },
};
