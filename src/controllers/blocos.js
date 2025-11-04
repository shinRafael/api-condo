const db = require('../dataBase/connection');

module.exports = {
  async listablocos(req, res) {
    try {
      const [rows] = await db.query(`SELECT bloc_id, cond_id, bloc_nome FROM Bloco;`);
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Lista de blocos.',
        nItens: rows.length,
        dados: rows
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar blocos.',
        dados: error.message
      });
    }
  },

  async cadastrarblocos(req, res) {
    try {
      const { cond_id, bloc_nome } = req.body;
      const [result] = await db.query(
        `INSERT INTO Bloco (cond_id, bloc_nome) VALUES (?, ?);`,
        [cond_id, bloc_nome]
      );

      const dados = {
        id: result.insertId, // ✅ corrigido
        cond_id,
        bloc_nome
      };

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Bloco cadastrado com sucesso.',
        dados
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar bloco.',
        dados: error.message
      });
    }
  },

  async editarblocos(req, res) {
    try {
      const { id } = req.params;
      const { cond_id, bloc_nome } = req.body;
      const [result] = await db.query(
        `UPDATE Bloco SET cond_id = ?, bloc_nome = ? WHERE bloc_id = ?;`,
        [cond_id, bloc_nome, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          sucesso: false,
          mensagem: `Bloco ${id} não encontrado.`,
        });
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: `Bloco ${id} atualizado com sucesso.`,
        dados: { cond_id, bloc_nome }
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar bloco.',
        dados: error.message
      });
    }
  },

  async apagarblocos(req, res) {
    try {
      const { id } = req.params;
      const [result] = await db.query(`DELETE FROM Bloco WHERE bloc_id = ?;`, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          sucesso: false,
          mensagem: `Bloco ${id} não encontrado.`, // ✅ corrigido
        });
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: `Bloco ${id} apagado com sucesso.`,
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao apagar bloco.',
        dados: error.message
      });
    }
  }
};
