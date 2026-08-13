// ===============================================================
// 💬 controllers/mensagens.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

// ===============================================================
// 🧩 Função auxiliar — Agrupa mensagens por morador
// ===============================================================
const agruparMensagensPorMorador = (mensagens) => {
  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    return [];
  }

  const conversasMap = new Map();

  mensagens.forEach((msg) => {
    if (!conversasMap.has(msg.moradorId)) {
      conversasMap.set(msg.moradorId, {
        moradorId: msg.moradorId,
        cond_id: msg.cond_id,
        moradorNome: msg.moradorNome,
        apartamento: `Bloco ${msg.bloc_nome} - ${msg.ap_numero}`,
        mensagens: [],
      });
    }

    conversasMap.get(msg.moradorId).mensagens.push({
      id: msg.msg_id,
      remetente: msg.user_tipo === 'Morador' ? 'morador' : 'sindico',
      texto: msg.msg_mensagem,
      data: new Date(msg.msg_data_envio).toLocaleString('pt-BR'),
      lida: msg.msg_status === 'Lida',
    });
  });

  return Array.from(conversasMap.values());
};

// ===============================================================
// 🧱 Controller principal
// ===============================================================
module.exports = {
  // =============================================================
  // 📋 1. LISTAR TODAS AS MENSAGENS (agrupadas por morador)
  // =============================================================
  async listamensagens(request, response) {
    try {
      const sql = `
        SELECT 
          m.msg_id, 
          m.msg_mensagem, 
          m.msg_data_envio, 
          m.msg_status, 
          m.cond_id,
          ua.userap_id AS moradorId,
          u.user_nome AS moradorNome, 
          u.user_tipo,
          a.ap_numero, 
          b.bloc_nome
        FROM mensagens AS m
        JOIN usuario_apartamentos AS ua ON m.userap_id = ua.userap_id
        JOIN usuarios AS u ON ua.user_id = u.user_id
        JOIN apartamentos AS a ON ua.ap_id = a.ap_id
        JOIN bloco AS b ON a.bloc_id = b.bloc_id
        ORDER BY m.msg_data_envio ASC;
      `;
      const [rows] = await db.query(sql);

      const conversasAgrupadas = agruparMensagensPorMorador(rows);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de conversas agrupadas por morador.',
        dados: conversasAgrupadas,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar mensagens.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✉️ 2. CADASTRAR NOVA MENSAGEM
  // =============================================================
  async cadastrarmensagens(request, response) {
    try {
      const { cond_id, userap_id, msg_mensagem, oco_id } = request.body;

      if (!cond_id || !userap_id || !msg_mensagem) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios (cond_id, userap_id, msg_mensagem) não informados.',
        });
      }

      const sqlInsert = `
        INSERT INTO mensagens 
          (cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status, oco_id)
        VALUES (?, ?, ?, NOW(), 'Enviada', ?);
      `;
      const [result] = await db.query(sqlInsert, [cond_id, userap_id, msg_mensagem, oco_id || null]);
      const insertedId = result.insertId;

      const sqlSelect = `
        SELECT 
          m.msg_id, 
          m.msg_mensagem, 
          m.msg_data_envio, 
          m.msg_status,
          ua.userap_id AS moradorId, 
          u.user_nome AS moradorNome, 
          u.user_tipo
        FROM mensagens AS m
        JOIN usuario_apartamentos AS ua ON m.userap_id = ua.userap_id
        JOIN usuarios AS u ON ua.user_id = u.user_id
        WHERE m.msg_id = ?;
      `;
      const [rows] = await db.query(sqlSelect, [insertedId]);

      const msg = rows[0];
      const dados = {
        id: msg.msg_id,
        remetente: 'sindico',
        texto: msg.msg_mensagem,
        data: new Date(msg.msg_data_envio).toLocaleString('pt-BR'),
        lida: false,
      };

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Mensagem enviada com sucesso.',
        dados,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar mensagem.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📝 3. EDITAR MENSAGEM
  // =============================================================
  async editarmensagens(request, response) {
    try {
      const { cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status } = request.body;
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O ID da mensagem é obrigatório.',
        });
      }

      const sql = `
        UPDATE mensagens
        SET cond_id = ?, userap_id = ?, msg_mensagem = ?, msg_data_envio = ?, msg_status = ?
        WHERE msg_id = ?;
      `;
      const values = [cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status, id];
      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Mensagem ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Mensagem ${id} atualizada com sucesso.`,
        dados: { cond_id, userap_id, msg_mensagem, msg_status },
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar mensagem.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ 4. APAGAR MENSAGEM
  // =============================================================
  async apagarmensagens(request, response) {
    try {
      const { id } = request.params;

      const sql = 'DELETE FROM mensagens WHERE msg_id = ?;';
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Mensagem ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Mensagem ${id} excluída com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao excluir mensagem.',
        dados: error.message,
      });
    }
  },
};
