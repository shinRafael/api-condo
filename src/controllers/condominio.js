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
          cond_estado,
          cond_taxa_base
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
  // 🔍 BUSCAR CONDOMÍNIO POR ID (objeto único — app mobile)
  // =============================================================
  async buscarcondominio(request, response) {
    try {
      const { id } = request.params;

      const sql = `
        SELECT 
          cond_id, 
          cond_nome, 
          cond_endereco,
          cond_cidade, 
          cond_estado,
          cond_taxa_base
        FROM condominio
        WHERE cond_id = ?;
      `;
      const [rows] = await db.query(sql, [id]);

      if (rows.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Condomínio ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Condomínio encontrado.',
        dados: rows[0],
      });
    } catch (error) {
      console.error('❌ Erro ao buscar condomínio:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao buscar condomínio.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR CONDOMÍNIO
  // =============================================================
  async cadastrarcondominio(request, response) {
    try {
      const { nome, endereco, cidade, estado, taxa_base } = request.body;

      if (!nome || !cidade || !estado) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios (nome, cidade, estado) não foram informados.',
        });
      }

      const taxaBase = taxa_base || 0.00; // Valor padrão se não informado

      const sql = `
        INSERT INTO condominio (cond_nome, cond_endereco, cond_cidade, cond_estado, cond_taxa_base)
        VALUES (?, ?, ?, ?, ?);
      `;
      const values = [nome, endereco, cidade, estado, taxaBase];
      const [result] = await db.query(sql, values);

      const dados = {
        id: result.insertId,
        nome,
        endereco,
        cidade,
        estado,
        taxa_base: taxaBase,
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
      const { nome, endereco, cidade, estado, taxa_base } = request.body;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'ID do condomínio não informado.',
        });
      }

      // Buscar dados atuais para manter valores se não informados
      const [condominioAtual] = await db.query(
        'SELECT * FROM condominio WHERE cond_id = ?',
        [id]
      );

      if (condominioAtual.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Condomínio ${id} não encontrado.`,
        });
      }

      // Usar valores atuais se novos não forem informados
      const nomeAtualizar = nome !== undefined ? nome : condominioAtual[0].cond_nome;
      const enderecoAtualizar = endereco !== undefined ? endereco : condominioAtual[0].cond_endereco;
      const cidadeAtualizar = cidade !== undefined ? cidade : condominioAtual[0].cond_cidade;
      const estadoAtualizar = estado !== undefined ? estado : condominioAtual[0].cond_estado;
      const taxaBaseAtualizar = taxa_base !== undefined ? taxa_base : condominioAtual[0].cond_taxa_base;

      const sql = `
        UPDATE condominio 
        SET cond_nome = ?, cond_endereco = ?, cond_cidade = ?, cond_estado = ?, cond_taxa_base = ?
        WHERE cond_id = ?;
      `;
      const values = [nomeAtualizar, enderecoAtualizar, cidadeAtualizar, estadoAtualizar, taxaBaseAtualizar, id];
      await db.query(sql, values);

      return response.status(200).json({
        sucesso: true,
        mensagem: `Condomínio ${id} atualizado com sucesso.`,
        dados: {
          id,
          nome: nomeAtualizar,
          endereco: enderecoAtualizar,
          cidade: cidadeAtualizar,
          estado: estadoAtualizar,
          taxa_base: taxaBaseAtualizar,
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
