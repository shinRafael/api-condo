// ===============================================================
// 🧩 controllers/reservas_ambientes.js — versão padronizada 2025
// ===============================================================

const db = require('../dataBase/connection');
const { notificarReservaConfirmada, notificarReservaCancelada } = require('../helpers/notificationHelper');

module.exports = {
  // =============================================================
  // 🏢 LISTAR AMBIENTES DISPONÍVEIS
  // =============================================================
  async listarAmbientes(request, response) {
    try {
      const sql = `
        SELECT 
          amd_id,
          cond_id,
          amd_nome,
          amd_descricao,
          amd_capacidade
        FROM ambientes
        ORDER BY amd_nome ASC;
      `;
      const [dados] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Ambientes listados com sucesso.',
        dados,
      });
    } catch (error) {
      console.error('❌ Erro ao listar ambientes:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao buscar ambientes.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📋 LISTAR RESERVAS (Com filtro automático por tipo de usuário)
  // =============================================================
  async listarreservas_ambientes(request, response) {
    try {
      const { userType, userApId } = request.user;
      
      let sql = `
        SELECT 
          res.*, 
          amb.amd_nome,
          u.user_nome,
          a.ap_numero
        FROM reservas_ambientes AS res
        INNER JOIN ambientes AS amb ON res.amd_id = amb.amd_id
        LEFT JOIN usuario_apartamentos AS ua ON res.userap_id = ua.userap_id
        LEFT JOIN usuarios AS u ON ua.user_id = u.user_id
        LEFT JOIN apartamentos AS a ON ua.ap_id = a.ap_id
      `;

      const params = [];

      // 🔐 Filtro de segurança por tipo de usuário
      if (userType === 'Morador') {
        // Morador vê apenas suas próprias reservas
        sql += ` WHERE res.userap_id = ?`;
        params.push(userApId);
      }
      // Sindico/Funcionario/ADM veem todas as reservas

      sql += ` ORDER BY res.res_data_reserva DESC, res.res_horario_inicio DESC;`;
      
      const [dados] = await db.query(sql, params);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de reservas obtida com sucesso.',
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
  // 🔍 OBTER DETALHES DE UMA RESERVA
  // =============================================================
  async obterReserva(request, response) {
    try {
      const { id } = request.params;
      const { userType, userApId } = request.user;

      let sql = `
        SELECT 
          res.*,
          amb.amd_nome,
          amb.amd_descricao,
          amb.amd_capacidade,
          u.user_nome,
          u.user_telefone,
          a.ap_numero
        FROM reservas_ambientes AS res
        INNER JOIN ambientes AS amb ON res.amd_id = amb.amd_id
        LEFT JOIN usuario_apartamentos AS ua ON res.userap_id = ua.userap_id
        LEFT JOIN usuarios AS u ON ua.user_id = u.user_id
        LEFT JOIN apartamentos AS a ON ua.ap_id = a.ap_id
        WHERE res.res_id = ?
      `;

      const params = [id];

      // 🔐 Morador só pode ver suas próprias reservas
      if (userType === 'Morador') {
        sql += ` AND res.userap_id = ?`;
        params.push(userApId);
      }

      const [dados] = await db.query(sql, params);

      if (dados.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Reserva não encontrada ou você não tem permissão para visualizá-la.',
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Reserva obtida com sucesso.',
        dados: dados[0],
      });
    } catch (error) {
      console.error('❌ Erro ao obter reserva:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao buscar reserva.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📅 LISTAR RESERVAS DE UM AMBIENTE ESPECÍFICO
  // =============================================================
  async listarReservasPorAmbiente(request, response) {
    try {
      const { amd_id } = request.params;
      const { data } = request.query; // Opcional: filtrar por data

      let sql = `
        SELECT 
          res.res_id,
          res.res_data_reserva,
          res.res_horario_inicio,
          res.res_horario_fim,
          res.res_status,
          u.user_nome,
          a.ap_numero
        FROM reservas_ambientes AS res
        LEFT JOIN usuario_apartamentos AS ua ON res.userap_id = ua.userap_id
        LEFT JOIN usuarios AS u ON ua.user_id = u.user_id
        LEFT JOIN apartamentos AS a ON ua.ap_id = a.ap_id
        WHERE res.amd_id = ?
      `;

      const params = [amd_id];

      if (data) {
        sql += ` AND res.res_data_reserva = ?`;
        params.push(data);
      }

      sql += ` ORDER BY res.res_data_reserva ASC, res.res_horario_inicio ASC;`;

      const [dados] = await db.query(sql, params);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Reservas do ambiente listadas com sucesso.',
        dados,
      });
    } catch (error) {
      console.error('❌ Erro ao listar reservas do ambiente:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao buscar reservas.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ❌ CANCELAR RESERVA
  // =============================================================
  async cancelarReserva(request, response) {
    try {
      const { id } = request.params;
      const { userType, userApId } = request.user;

      // Verificar se a reserva existe e se o usuário tem permissão
      let sqlCheck = `
        SELECT r.res_id, r.userap_id, r.res_status, r.res_data_reserva, a.amd_nome 
        FROM reservas_ambientes r
        JOIN ambientes a ON r.amd_id = a.amd_id
        WHERE r.res_id = ?
      `;
      const paramsCheck = [id];

      if (userType === 'Morador') {
        sqlCheck += ` AND r.userap_id = ?`;
        paramsCheck.push(userApId);
      }

      const [reservas] = await db.query(sqlCheck, paramsCheck);

      if (reservas.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Reserva não encontrada ou você não tem permissão para cancelá-la.',
        });
      }

      if (reservas[0].res_status === 'Cancelado') {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Esta reserva já está cancelada.',
        });
      }

      // Cancelar a reserva
      const sqlUpdate = `UPDATE reservas_ambientes SET res_status = 'Cancelado' WHERE res_id = ?`;
      await db.query(sqlUpdate, [id]);

      // 🔔 Notificar morador sobre cancelamento
      const { userap_id, amd_nome, res_data_reserva } = reservas[0];
      await notificarReservaCancelada(userap_id, amd_nome, res_data_reserva);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Reserva cancelada com sucesso.',
        dados: { res_id: id, res_status: 'Cancelado' },
      });
    } catch (error) {
      console.error('❌ Erro ao cancelar reserva:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno ao cancelar reserva.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🏗️ CADASTRAR NOVA RESERVA
  // =============================================================
  async cadastrarreservas_ambientes(request, response) {
    try {
      const { userApId } = request.user; // Pega do token JWT

      const {
        amd_id,
        res_horario_inicio,
        res_horario_fim,
        res_data_reserva,
      } = request.body;

      if (!amd_id || !res_horario_inicio || !res_data_reserva) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Campos obrigatórios: amd_id, res_horario_inicio, res_data_reserva.',
        });
      }

      // Validar se o ambiente existe
      const [ambiente] = await db.query('SELECT amd_nome FROM ambientes WHERE amd_id = ?', [amd_id]);
      if (ambiente.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Ambiente não encontrado.',
        });
      }

      const sql = `
        INSERT INTO reservas_ambientes 
          (userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      const values = [
        userApId, // Usa o userap_id do token (segurança)
        amd_id,
        res_horario_inicio,
        res_horario_fim || null,
        'Pendente', // Status padrão
        res_data_reserva,
      ];

      const [result] = await db.query(sql, values);

      // 🔔 Notificar morador sobre nova reserva
      const nomeAmbiente = ambiente[0].amd_nome;
      await notificarReservaConfirmada(userApId, nomeAmbiente, res_data_reserva, res_horario_inicio);

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Reserva criada com sucesso.',
        dados: {
          res_id: result.insertId,
          userap_id: userApId,
          amd_id,
          res_horario_inicio,
          res_horario_fim,
          res_status: 'Pendente',
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

      // Campos permitidos para atualização
      const camposPermitidos = [
        'res_data_reserva',
        'res_horario_inicio',
        'res_horario_fim',
        'res_status',
        'amd_id',
        'userap_id'
      ];

      // Filtra apenas campos permitidos
      const camposValidados = {};
      Object.keys(camposParaAtualizar).forEach((campo) => {
        if (camposPermitidos.includes(campo)) {
          camposValidados[campo] = camposParaAtualizar[campo];
        }
      });

      if (Object.keys(camposValidados).length === 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Nenhum campo válido foi fornecido para atualização.',
        });
      }

      const campos = Object.keys(camposValidados)
        .map((c) => `${c} = ?`)
        .join(', ');
      const valores = Object.values(camposValidados);
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

// Remover as rotas de teste no final do arquivo - não são mais necessárias
