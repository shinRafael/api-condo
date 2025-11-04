// ===============================================================
// 📂 controllers/dashboard.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

// ===============================================================
// 🔹 Função auxiliar para identificar o tipo de evento
// ===============================================================
const getEventType = (source, item) => {
  if (source === 'notificacao') {
    switch (item.not_tipo) {
      case 'Entrega': return 'PACKAGE_RECEIVED';
      case 'Aviso': return 'GENERAL_ANNOUNCEMENT';
      default: return 'MESSAGE';
    }
  }
  if (source === 'reserva') return 'RESERVATION_CONFIRMED';
  if (source === 'encomenda') return 'PACKAGE_RECEIVED';
  if (source === 'visitante_entrada') return 'VISITOR_ENTRY';
  if (source === 'visitante_saida') return 'VISITOR_EXIT';
  if (source === 'ocorrencia') return 'OCCURRENCE_UPDATE';
  return 'GENERAL_ANNOUNCEMENT';
};

// ===============================================================
// 📊 Controller principal — Dashboard
// ===============================================================
module.exports = {
  async getLatestUpdates(request, response) {
    try {
      const { userap_id } = request.params;
      const limit = 10;

      if (!userap_id) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'O ID do usuário (userap_id) é obrigatório.'
        });
      }

      let allUpdates = [];

      // =========================================================
      // 1️⃣ NOTIFICAÇÕES
      // =========================================================
      const sqlNotifications = `
        SELECT not_id, not_mensagem, not_data_envio, not_tipo 
        FROM notificacoes 
        WHERE userap_id = ? 
        ORDER BY not_data_envio DESC 
        LIMIT ?;
      `;
      const [notifications] = await db.query(sqlNotifications, [userap_id, limit]);
      notifications.forEach(item => allUpdates.push({
        id: item.not_id,
        type: getEventType('notificacao', item),
        message: item.not_mensagem,
        timestamp: item.not_data_envio
      }));

      // =========================================================
      // 2️⃣ RESERVAS DE AMBIENTES
      // =========================================================
      const sqlReservas = `
        SELECT r.res_id, r.res_data_reserva, a.amd_nome, r.res_horario_inicio 
        FROM reservas_ambientes r 
        JOIN ambientes a ON r.amd_id = a.amd_id 
        WHERE r.userap_id = ? 
        ORDER BY r.res_data_reserva DESC 
        LIMIT ?;
      `;
      const [reservas] = await db.query(sqlReservas, [userap_id, limit]);
      reservas.forEach(item => {
        const eventTimestamp = new Date(item.res_data_reserva);
        eventTimestamp.setHours(item.res_horario_inicio ? parseInt(item.res_horario_inicio.split(':')[0]) : 12, 0, 0);
        allUpdates.push({
          id: item.res_id,
          type: getEventType('reserva', item),
          message: `A sua reserva do ambiente "${item.amd_nome}" foi confirmada.`,
          timestamp: eventTimestamp
        });
      });

      // =========================================================
      // 3️⃣ ENCOMENDAS
      // =========================================================
      const sqlEncomendas = `
        SELECT enc_id, enc_nome_loja, enc_data_chegada 
        FROM encomendas 
        WHERE userap_id = ? 
        AND enc_status = 'Aguardando' 
        ORDER BY enc_data_chegada DESC 
        LIMIT ?;
      `;
      const [encomendas] = await db.query(sqlEncomendas, [userap_id, limit]);
      encomendas.forEach(item => allUpdates.push({
        id: item.enc_id,
        type: getEventType('encomenda', item),
        message: `Nova encomenda da loja ${item.enc_nome_loja} registrada na portaria.`,
        timestamp: item.enc_data_chegada
      }));

      // =========================================================
      // 4️⃣ VISITANTES - ENTRADA
      // =========================================================
      const sqlVisitantesEntrada = `
        SELECT vst_id, vst_nome, vst_data_entrada 
        FROM visitantes 
        WHERE userap_id = ? 
        AND vst_status = 'Entrou' 
        ORDER BY vst_data_entrada DESC 
        LIMIT ?;
      `;
      const [visitantesEntrada] = await db.query(sqlVisitantesEntrada, [userap_id, limit]);
      visitantesEntrada.forEach(item => allUpdates.push({
        id: item.vst_id,
        type: getEventType('visitante_entrada', item),
        message: `O seu visitante ${item.vst_nome} entrou no condomínio.`,
        timestamp: item.vst_data_entrada
      }));

      // =========================================================
      // 5️⃣ VISITANTES - SAÍDA
      // =========================================================
      const sqlVisitantesSaida = `
        SELECT vst_id, vst_nome, vst_data_saida 
        FROM visitantes 
        WHERE userap_id = ? 
        AND vst_status = 'Finalizado' 
        AND vst_data_saida IS NOT NULL 
        ORDER BY vst_data_saida DESC 
        LIMIT ?;
      `;
      const [visitantesSaida] = await db.query(sqlVisitantesSaida, [userap_id, limit]);
      visitantesSaida.forEach(item => allUpdates.push({
        id: item.vst_id,
        type: getEventType('visitante_saida', item),
        message: `O seu visitante ${item.vst_nome} saiu do condomínio.`,
        timestamp: item.vst_data_saida
      }));

      // =========================================================
      // 6️⃣ OCORRÊNCIAS
      // =========================================================
      const sqlOcorrencias = `
        SELECT oco_id, oco_protocolo, oco_status, oco_data 
        FROM ocorrencias 
        WHERE userap_id = ? 
        AND oco_status != 'Aberta' 
        ORDER BY oco_data DESC 
        LIMIT ?;
      `;
      const [ocorrencias] = await db.query(sqlOcorrencias, [userap_id, limit]);
      ocorrencias.forEach(item => allUpdates.push({
        id: item.oco_id,
        type: getEventType('ocorrencia', item),
        message: `A ocorrência ${item.oco_protocolo} foi atualizada para: ${item.oco_status}.`,
        timestamp: item.oco_data
      }));

      // =========================================================
      // 🔹 Ordenar e limitar resultados finais
      // =========================================================
      allUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const finalUpdates = allUpdates.slice(0, 5);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Últimas atualizações recuperadas com sucesso.',
        dados: finalUpdates
      });

    } catch (error) {
      console.error('Erro no controller do dashboard:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao obter atualizações do dashboard.',
        dados: error.message
      });
    }
  }
};
