// ===============================================================
// 📂 controllers/apartamentos.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {

  // =============================================================
  // 📋 LISTAR APARTAMENTOS
  // =============================================================
  async listarapartamentos(request, response) {
    try {
      const sql = `
        SELECT 
          ap.ap_id, 
          ap.bloc_id, 
          ap.ap_numero, 
          ap.ap_andar,
          b.bloc_nome
        FROM apartamentos ap
        INNER JOIN bloco b ON ap.bloc_id = b.bloc_id;
      `;

      const [rows] = await db.query(sql);
      const nItens = rows.length;

      return response.status(200).json({
        sucesso: true,
        mensagem: "Lista de apartamentos recuperada com sucesso.",
        nItens,
        dados: rows,
      });

    } catch (error) {
      console.error("Erro ao listar apartamentos:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro ao listar apartamentos.",
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR APARTAMENTO
  // =============================================================
  async cadastrarapartamentos(request, response) {
    try {
      // Aceita tanto o formato antigo (bloc_id) quanto o novo (bloc)
      const { bloc_id, bloc, ap_numero, numero, ap_andar, andar } = request.body;
      
      const blocoId = bloc_id || bloc;
      const numeroAp = ap_numero || numero;
      const andarAp = ap_andar || andar;

      if (!blocoId || !numeroAp) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "Campos obrigatórios (bloc/bloc_id, numero/ap_numero) não foram informados.",
        });
      }

      const sql = `
        INSERT INTO apartamentos (bloc_id, ap_numero, ap_andar)
        VALUES (?, ?, ?);
      `;
      const values = [blocoId, numeroAp, andarAp];

      const [result] = await db.query(sql, values);

      const dados = {
        ap_id: result.insertId,
        bloc_id: blocoId,
        ap_numero: numeroAp,
        ap_andar: andarAp,
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: "Apartamento cadastrado com sucesso.",
        dados,
      });

    } catch (error) {
      console.error("Erro ao cadastrar apartamento:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro ao cadastrar apartamento.",
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR APARTAMENTO
  // =============================================================
  async editarapartamentos(request, response) {
    try {
      const { id } = request.params;
      // Aceita tanto o formato antigo quanto o novo
      const { bloc_id, bloc, ap_numero, numero, ap_andar, andar } = request.body;
      
      const blocoId = bloc_id || bloc;
      const numeroAp = ap_numero || numero;
      const andarAp = ap_andar || andar;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "ID do apartamento não informado.",
        });
      }

      const sql = `
        UPDATE apartamentos
        SET bloc_id = ?, ap_numero = ?, ap_andar = ?
        WHERE ap_id = ?;
      `;
      const values = [blocoId, numeroAp, andarAp, id];

      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Apartamento ${id} não encontrado.`,
        });
      }

      const dados = {
        ap_id: id,
        bloc_id: blocoId,
        ap_numero: numeroAp,
        ap_andar: andarAp,
      };

      return response.status(200).json({
        sucesso: true,
        mensagem: `Apartamento ${id} atualizado com sucesso.`,
        dados,
      });

    } catch (error) {
      console.error("Erro ao editar apartamento:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro ao editar apartamento.",
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR APARTAMENTO
  // =============================================================
  async apagarapartamentos(request, response) {
    try {
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "ID do apartamento não informado.",
        });
      }

      const sql = `
        DELETE FROM apartamentos
        WHERE ap_id = ?;
      `;
      const values = [id];

      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Apartamento ${id} não encontrado.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Apartamento ${id} removido com sucesso.`,
      });

    } catch (error) {
      console.error("Erro ao apagar apartamento:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro ao apagar apartamento.",
        dados: error.message,
      });
    }
  },
};
