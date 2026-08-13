// ===============================================================
// 📦 controllers/encomendas.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');
const { notificarNovaEncomenda, notificarEncomendaRetirada } = require('../helpers/notificationHelper');
const { verificarPosseUserAp } = require('../middleware/ownership');

module.exports = {
  // =============================================================
  // 🏢 LISTAR TODAS AS ENCOMENDAS (SÍNDICO / WEB)
  // =============================================================
  async listarTodasEncomendas(request, response) {
    try {
      const sql = `
        SELECT 
          enc_id, 
          userap_id, 
          enc_nome_loja, 
          enc_codigo_rastreio,
          enc_status, 
          enc_data_chegada, 
          enc_data_retirada
        FROM encomendas
        ORDER BY enc_data_chegada DESC;
      `;
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de todas as encomendas.',
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro na listagem de encomendas.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📱 LISTAR ENCOMENDAS DO MORADOR (APP)
  // =============================================================
  async listarEncomendasDoMorador(request, response) {
    try {
      const { userap_id } = request.params;

      // 🔒 Anti-IDOR: morador só acessa as encomendas da própria unidade
      // (equipe — Síndico/Funcionário/ADM — tem acesso amplo)
      if (!verificarPosseUserAp(request.user, userap_id)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode listar as encomendas da sua unidade.',
        });
      }

      if (!userap_id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O parâmetro userap_id é obrigatório.',
        });
      }

      const sql = `
        SELECT 
          enc_id, 
          userap_id, 
          enc_nome_loja, 
          enc_codigo_rastreio,
          enc_status, 
          enc_data_chegada, 
          enc_data_retirada
        FROM encomendas 
        WHERE userap_id = ? 
        ORDER BY enc_data_chegada DESC;
      `;
      const [rows] = await db.query(sql, [userap_id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de encomendas do morador.',
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar encomendas do morador.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🧾 CADASTRAR ENCOMENDA
  // =============================================================
  async cadastrarEncomendas(request, response) {
    try {
      const {
        userap_id,
        enc_nome_loja,
        enc_codigo_rastreio,
        enc_status,
        enc_data_chegada,
        enc_data_retirada,
      } = request.body;

      if (!userap_id || !enc_nome_loja) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios (userap_id e enc_nome_loja) não informados.',
        });
      }

      const sql = `
        INSERT INTO encomendas
        (userap_id, enc_nome_loja, enc_codigo_rastreio, enc_status, enc_data_chegada, enc_data_retirada)
        VALUES (?, ?, ?, ?, NOW(), ?);
      `;
      const values = [
        userap_id,
        enc_nome_loja,
        enc_codigo_rastreio ?? null,
        enc_status ?? 'Aguardando',
        enc_data_retirada ?? null,
      ];

      const [result] = await db.query(sql, values);

      // 🔔 Notificar morador sobre nova encomenda
      await notificarNovaEncomenda(userap_id, enc_nome_loja, enc_codigo_rastreio);

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Encomenda cadastrada com sucesso.',
        dados: {
          id: result.insertId,
          userap_id,
          enc_nome_loja,
          enc_codigo_rastreio: enc_codigo_rastreio ?? null,
          enc_status: enc_status ?? 'Aguardando',
          enc_data_chegada: new Date(),
          enc_data_retirada: enc_data_retirada ?? null,
        },
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar encomenda.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR ENCOMENDA
  // =============================================================
  async editarEncomendas(request, response) {
    try {
      const { id } = request.params;
      const { enc_nome_loja, enc_codigo_rastreio, enc_status, enc_data_retirada } = request.body;

      if (!id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'ID da encomenda não informado.',
        });
      }

      // Buscar dados da encomenda antes de atualizar
      const [encomendaAtual] = await db.query('SELECT * FROM encomendas WHERE enc_id = ?', [id]);
      
      if (encomendaAtual.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Encomenda ${id} não encontrada.`,
        });
      }

      const sql = `
        UPDATE encomendas
        SET enc_nome_loja = ?, enc_codigo_rastreio = ?, enc_status = ?, enc_data_retirada = ?
        WHERE enc_id = ?;
      `;
      const values = [
        enc_nome_loja,
        enc_codigo_rastreio ?? null,
        enc_status ?? 'Aguardando',
        enc_data_retirada ?? null,
        id,
      ];

      const [result] = await db.query(sql, values);

      // 🔔 Notificar morador se status mudou para "Entregue"
      if (enc_status === 'Entregue' && encomendaAtual[0].enc_status !== 'Entregue') {
        await notificarEncomendaRetirada(encomendaAtual[0].userap_id, enc_nome_loja);
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Encomenda ${id} atualizada com sucesso.`,
        dados: { id, enc_nome_loja, enc_status },
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao atualizar encomenda.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✅ MARCAR ENCOMENDA COMO ENTREGUE (portaria / síndico)
  // =============================================================
  // Nota: a tabela encomendas NÃO possui coluna enc_retirado_por
  // (verificado no createnovo.sql) — registramos status + data de retirada.
  async marcarEncomendaEntregue(request, response) {
    try {
      const { id } = request.params;

      // Buscar dados antes de atualizar (para notificação e validação)
      const [encomenda] = await db.query(
        'SELECT userap_id, enc_nome_loja, enc_status FROM encomendas WHERE enc_id = ?',
        [id]
      );

      if (encomenda.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Encomenda ${id} não encontrada.`,
        });
      }

      const sql = `
        UPDATE encomendas
        SET enc_status = 'Entregue', enc_data_retirada = NOW()
        WHERE enc_id = ? AND enc_status = 'Aguardando';
      `;
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(409).json({
          sucesso: false,
          mensagem: `Encomenda ${id} já foi entregue ou não está mais aguardando.`,
        });
      }

      // 🔔 Notificar morador que a encomenda foi entregue/retirada
      await notificarEncomendaRetirada(encomenda[0].userap_id, encomenda[0].enc_nome_loja);

      return response.status(200).json({
        sucesso: true,
        mensagem: `Encomenda ${id} marcada como entregue.`,
        dados: { enc_id: Number(id), enc_status: 'Entregue', enc_data_retirada: new Date() },
      });
    } catch (error) {
      console.error('❌ Erro ao marcar encomenda como entregue:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao marcar encomenda como entregue.',
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR ENCOMENDA
  // =============================================================
  async apagarEncomendas(request, response) {
    try {
      const { id } = request.params;

      const sql = 'DELETE FROM encomendas WHERE enc_id = ?;';
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Encomenda ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Encomenda ${id} excluída com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao excluir encomenda.',
        dados: error.message,
      });
    }
  },
};

// =============================================================
// 🚀 Export extra (rota standalone opcional para debug)
// =============================================================
const express = require('express');
const router = express.Router();
router.get('/encomendas', module.exports.listarTodasEncomendas);
module.exports.router = router;
