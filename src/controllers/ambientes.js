const db = require('../dataBase/connection');

module.exports = {
  async listarambientes(request, response) {
    try {
      const sql = `
        SELECT a.*, c.cond_nome 
        FROM ambientes a
        INNER JOIN condominio c ON a.cond_id = c.cond_id;
      `;
      const [dados] = await db.query(sql);
      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de ambientes.',
        dados
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar ambientes.',
        dados: error.message
      });
    }
  },

  async cadastrarambientes(request, response) {
    try {
      const { cond_id, amd_nome, amd_descricao, amd_capacidade } = request.body;
      const sql = `
        INSERT INTO ambientes (cond_id, amd_nome, amd_descricao, amd_capacidade)
        VALUES (?, ?, ?, ?);
      `;
      const values = [cond_id, amd_nome, amd_descricao, amd_capacidade];
      const [result] = await db.query(sql, values);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Ambiente cadastrado com sucesso.',
        dados: { id: result.insertId, cond_id, amd_nome, amd_descricao, amd_capacidade }
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar ambiente.',
        dados: error.message
      });
    }
  },

  async editarambientes(request, response) {
    try {
      const { id } = request.params;
      const { cond_id, amd_nome, amd_descricao, amd_capacidade } = request.body;

      const sql = `
        UPDATE ambientes 
        SET cond_id = ?, amd_nome = ?, amd_descricao = ?, amd_capacidade = ?
        WHERE amd_id = ?;
      `;
      const values = [cond_id, amd_nome, amd_descricao, amd_capacidade, id];
      const [result] = await db.query(sql, values);

      if (!result.affectedRows) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Ambiente com ID ${id} não encontrado.`
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Ambiente atualizado com sucesso.'
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar ambiente.',
        dados: error.message
      });
    }
  },

  async apagarambientes(request, response) {
    try {
      const { id } = request.params;
      const sql = `DELETE FROM ambientes WHERE amd_id = ?`;
      const [result] = await db.query(sql, [id]);

      if (!result.affectedRows) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Ambiente com ID ${id} não encontrado.`
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Ambiente excluído com sucesso.'
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao excluir ambiente.',
        dados: error.message
      });
    }
  },
};
