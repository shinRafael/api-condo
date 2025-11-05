// ===============================================================
// 📂 controllers/blocos.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {

  // =============================================================
  // 📋 LISTAR BLOCOS
  // =============================================================
  async listarblocos(request, response) {
    try {
      const sql = `
        SELECT 
          bloc_id, 
          cond_id, 
          bloc_nome 
        FROM bloco;
      `;

      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de blocos recuperada com sucesso.',
        nItens: rows.length,
        dados: rows
      });

    } catch (error) {
      console.error("Erro ao listar blocos:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar blocos.',
        dados: error.message
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR BLOCO
  // =============================================================
  async cadastrarblocos(request, response) {
    try {
      // Aceita tanto o formato antigo (bloc_nome) quanto o novo (nome)
      const { cond_id, bloc_nome, nome } = request.body;
      
      const nomeBloco = bloc_nome || nome;

      if (!cond_id || !nomeBloco) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "Campos obrigatórios (cond_id, nome/bloc_nome) não foram informados."
        });
      }

      const sql = `
        INSERT INTO bloco (cond_id, bloc_nome)
        VALUES (?, ?);
      `;
      const [result] = await db.query(sql, [cond_id, nomeBloco]);

      const dados = {
        bloc_id: result.insertId,
        cond_id,
        bloc_nome: nomeBloco
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Bloco cadastrado com sucesso.',
        dados
      });

    } catch (error) {
      console.error("Erro ao cadastrar bloco:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar bloco.',
        dados: error.message
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR BLOCO
  // =============================================================
  async editarblocos(request, response) {
    try {
      const { id } = request.params;
      const { cond_id, bloc_nome } = request.body;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "ID do bloco não informado."
        });
      }

      const sql = `
        UPDATE bloco
        SET cond_id = ?, bloc_nome = ?
        WHERE bloc_id = ?;
      `;
      const [result] = await db.query(sql, [cond_id, bloc_nome, id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Bloco ${id} não encontrado.`
        });
      }

      const dados = { bloc_id: id, cond_id, bloc_nome };

      return response.status(200).json({
        sucesso: true,
        mensagem: `Bloco ${id} atualizado com sucesso.`,
        dados
      });

    } catch (error) {
      console.error("Erro ao editar bloco:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar bloco.',
        dados: error.message
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR BLOCO
  // =============================================================
  async apagarblocos(request, response) {
    try {
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "ID do bloco não informado."
        });
      }

      const sql = `
        DELETE FROM bloco
        WHERE bloc_id = ?;
      `;
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Bloco ${id} não encontrado.`
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Bloco ${id} removido com sucesso.`
      });

    } catch (error) {
      console.error("Erro ao apagar bloco:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao apagar bloco.',
        dados: error.message
      });
    }
  }
};
