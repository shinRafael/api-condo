// ===============================================================
// 🧩 controllers/reservas_ambientes.js — versão padronizada 2025
// ===============================================================

const db = require('../dataBase/connection');

module.exports = {
  // =============================================================
  // 📋 LISTAR TODAS AS RESERVAS
  // =============================================================
  async listarreservas_ambientes(request, response) {
    try {
      const sql = `
        SELECT 
          res.*, 
          amb.amd_nome 
        FROM reservas_ambientes AS res
        INNER JOIN ambientes AS amb ON res.amd_id = amb.amd_id
        ORDER BY res.res_data_reserva DESC;
      `;
      const [dados] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de reservas de ambientes obtida com sucesso.',
        dados,
      });
    } catch (error) {
      console.error('❌ Erro ao listar reservas:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao buscar reservas.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🏗️ CADASTRAR NOVA RESERVA (Morador ou Síndico)
  // =============================================================
  async cadastrarreservas_ambientes(request, response) {
    try {
      const { userType } = request.user || {};
      if (!['Morador', 'Sindico'].includes(userType)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Apenas moradores ou síndicos podem criar reservas.',
        });
      }

      const {
        userap_id,
        amd_id,
        res_horario_inicio,
        res_horario_fim,
        res_status,
        res_data_reserva,
      } = request.body;

      if (!userap_id || !amd_id || !res_horario_inicio || !res_data_reserva) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios ausentes.',
        });
      }

      const sql = `
        INSERT INTO reservas_ambientes 
          (userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      const values = [
        userap_id,
        amd_id,
        res_horario_inicio,
        res_horario_fim || null,
        res_status || 'Pendente',
        res_data_reserva,
      ];

      const [result] = await db.query(sql, values);

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Reserva criada com sucesso.',
        dados: {
          res_id: result.insertId,
          userap_id,
          amd_id,
          res_horario_inicio,
          res_horario_fim,
          res_status: res_status || 'Pendente',
          res_data_reserva,
        },
      });
    } catch (error) {
      console.error('❌ Erro ao cadastrar reserva:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao cadastrar reserva.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR RESERVA (Somente Síndico ou Funcionário)
  // =============================================================
  async editarreservas_ambientes(request, response) {
    try {
      const { id } = request.params;
      const { userType } = request.user || {};
      const camposParaAtualizar = request.body;

      if (!['Sindico', 'Funcionario'].includes(userType)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Apenas síndicos ou funcionários podem editar reservas.',
        });
      }

      if (Object.keys(camposParaAtualizar).length === 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Nenhum campo para atualizar foi fornecido.',
        });
      }

      const campos = Object.keys(camposParaAtualizar)
        .map((c) => `${c} = ?`)
        .join(', ');
      const valores = Object.values(camposParaAtualizar);
      valores.push(id);

      const sql = `UPDATE reservas_ambientes SET ${campos} WHERE res_id = ?;`;
      const [result] = await db.query(sql, valores);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Reserva com ID ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Reserva ${id} atualizada com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao editar reserva:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao editar reserva.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR RESERVA (Somente Síndico)
  // =============================================================
  async apagarreservas_ambientes(request, response) {
    try {
      const { id } = request.params;
      const { userType } = request.user || {};

      if (userType !== 'Sindico') {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Apenas o síndico pode excluir reservas.',
        });
      }

      const [result] = await db.query(
        'DELETE FROM reservas_ambientes WHERE res_id = ?;',
        [id]
      );

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Reserva com ID ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Reserva ${id} excluída com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao excluir reserva:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao excluir reserva.',
        dados: error.message,
      });
    }
  },
};

// =============================================================
// 🧪 ROTAS OPCIONAIS PARA TESTE LOCAL
// =============================================================
const express = require('express');
const router = express.Router();

router.get('/reservas_ambientes', module.exports.listarreservas_ambientes);
router.post('/reservas_ambientes', module.exports.cadastrarreservas_ambientes);
router.patch('/reservas_ambientes/:id', module.exports.editarreservas_ambientes);
router.delete('/reservas_ambientes/:id', module.exports.apagarreservas_ambientes);

module.exports.router = router;
