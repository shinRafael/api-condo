// ===============================================================
// 📂 controllers/documentos.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {
  // =============================================================
  // 📋 LISTAR DOCUMENTOS
  // =============================================================
  async listardocumentos(request, response) {
    try {
      // 🔒 Escopo por condomínio: o morador vê apenas os documentos do SEU condomínio.
      // O userApId do JWT → usuario_apartamentos → apartamentos → bloco → cond_id.
      const sql = `
        SELECT 
          d.doc_id,
          d.cond_id,
          d.doc_nome,
          d.doc_categoria,
          d.doc_data,
          d.doc_tamanho,
          d.doc_url
        FROM documentos d
        WHERE d.cond_id = (
          SELECT b.cond_id
          FROM usuario_apartamentos ua
          JOIN apartamentos a ON a.ap_id = ua.ap_id
          JOIN bloco b ON b.bloc_id = a.bloc_id
          WHERE ua.userap_id = ?
          LIMIT 1
        );
      `;

      const [rows] = await db.query(sql, [request.user.userApId]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de documentos.',
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na listagem de documentos.',
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR DOCUMENTO
  // =============================================================
  async cadastrardocumentos(request, response) {
    try {
      const { cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url } = request.body;

      if (!cond_id || !doc_nome || !doc_categoria || !doc_url) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios (cond_id, doc_nome, doc_categoria, doc_url) não informados.',
        });
      }

      const sql = `
        INSERT INTO documentos 
        (cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      const values = [cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url];
      const [result] = await db.query(sql, values);

      const dados = {
        doc_id: result.insertId,
        cond_id,
        doc_nome,
        doc_categoria,
        doc_data,
        doc_tamanho,
        doc_url,
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Documento cadastrado com sucesso.',
        dados,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro no cadastro de documentos.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR DOCUMENTO
  // =============================================================
  async editardocumentos(request, response) {
    try {
      const { id } = request.params;
      const { cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url } = request.body;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'ID do documento não informado.',
        });
      }

      const sql = `
        UPDATE documentos 
        SET cond_id = ?, doc_nome = ?, doc_categoria = ?, doc_data = ?, doc_tamanho = ?, doc_url = ?
        WHERE doc_id = ?;
      `;
      const values = [cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url, id];
      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Documento com ID ${id} não encontrado.`,
        });
      }

      const dados = { doc_id: id, cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url };

      return response.status(200).json({
        sucesso: true,
        mensagem: `Documento ${id} atualizado com sucesso.`,
        dados,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar documento.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR DOCUMENTO
  // =============================================================
  async apagardocumentos(request, response) {
    try {
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'ID do documento não informado.',
        });
      }

      const sql = `DELETE FROM documentos WHERE doc_id = ?;`;
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Documento com ID ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Documento ${id} excluído com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao apagar documento.',
        dados: error.message,
      });
    }
  },
};
