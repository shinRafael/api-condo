const db = require('../dataBase/connection');

const getEventType = (source, item) => {
    // ... (esta função continua igual)
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

module.exports = {
    async getLatestUpdates(request, response) {
        try {
            const { userap_id } = request.params;
            const limit = 10;
            if (!userap_id) {
                return response.status(400).json({ sucesso: false, mensagem: 'O ID do utilizador (userap_id) é obrigatório.' });
            }
            let allUpdates = [];

            // 1. Buscar Notificações (agora com not_id)
            const sqlNotifications = `SELECT not_id, not_mensagem, not_data_envio, not_tipo FROM Notificacoes WHERE userap_id = ? ORDER BY not_data_envio DESC LIMIT ?;`;
            const [notifications] = await db.query(sqlNotifications, [userap_id, limit]);
            notifications.forEach(item => allUpdates.push({
                id: item.not_id, // ID da notificação
                type: getEventType('notificacao', item),
                message: item.not_mensagem,
                timestamp: item.not_data_envio
            }));

            // 2. Buscar Reservas (agora com res_id)
            const sqlReservas = `SELECT r.res_id, r.res_data_reserva, a.amd_nome, r.res_horario_inicio FROM Reservas_Ambientes r JOIN Ambientes a ON r.amd_id = a.amd_id WHERE r.userap_id = ? ORDER BY r.res_data_reserva DESC LIMIT ?;`;
            const [reservas] = await db.query(sqlReservas, [userap_id, limit]);
            reservas.forEach(item => {
                const eventTimestamp = new Date(item.res_data_reserva);
                eventTimestamp.setHours(item.res_horario_inicio ? parseInt(item.res_horario_inicio.split(':')[0]) : 12, 0, 0);
                allUpdates.push({
                    id: item.res_id, // ID da reserva
                    type: getEventType('reserva', item),
                    message: `A sua reserva do ambiente "${item.amd_nome}" foi confirmada.`,
                    timestamp: eventTimestamp
                });
            });

            // 3. Buscar Encomendas (agora com enc_id)
            const sqlEncomendas = `SELECT enc_id, enc_nome_loja, enc_data_chegada FROM Encomendas WHERE userap_id = ? AND enc_status = 'Aguardando' ORDER BY enc_data_chegada DESC LIMIT ?;`;
            const [encomendas] = await db.query(sqlEncomendas, [userap_id, limit]);
            encomendas.forEach(item => allUpdates.push({
                id: item.enc_id, // ID da encomenda
                type: getEventType('encomenda', item),
                message: `Nova encomenda da loja ${item.enc_nome_loja} registada na portaria.`,
                timestamp: item.enc_data_chegada
            }));

            // 4. Buscar Visitantes - Entrada (agora com vst_id)
            const sqlVisitantesEntrada = `SELECT vst_id, vst_nome, vst_data_entrada FROM Visitantes WHERE userap_id = ? AND vst_status = 'Entrou' ORDER BY vst_data_entrada DESC LIMIT ?;`;
            const [visitantesEntrada] = await db.query(sqlVisitantesEntrada, [userap_id, limit]);
            visitantesEntrada.forEach(item => allUpdates.push({
                id: item.vst_id, // ID do visitante
                type: getEventType('visitante_entrada', item),
                message: `O seu visitante ${item.vst_nome} entrou no condomínio.`,
                timestamp: item.vst_data_entrada
            }));

            // 5. Buscar Visitantes - Saída (agora com vst_id)
            const sqlVisitantesSaida = `SELECT vst_id, vst_nome, vst_data_saida FROM Visitantes WHERE userap_id = ? AND vst_status = 'Finalizado' AND vst_data_saida IS NOT NULL ORDER BY vst_data_saida DESC LIMIT ?;`;
            const [visitantesSaida] = await db.query(sqlVisitantesSaida, [userap_id, limit]);
            visitantesSaida.forEach(item => allUpdates.push({
                id: item.vst_id, // ID do visitante
                type: getEventType('visitante_saida', item),
                message: `O seu visitante ${item.vst_nome} saiu do condomínio.`,
                timestamp: item.vst_data_saida
            }));

            // 6. Buscar Ocorrências (agora com oco_id)
            const sqlOcorrencias = `SELECT oco_id, oco_protocolo, oco_status, oco_data FROM Ocorrencias WHERE userap_id = ? AND oco_status != 'Aberta' ORDER BY oco_data DESC LIMIT ?;`;
            const [ocorrencias] = await db.query(sqlOcorrencias, [userap_id, limit]);
            ocorrencias.forEach(item => allUpdates.push({
                id: item.oco_id, // ID da ocorrência
                type: getEventType('ocorrencia', item),
                message: `A ocorrência ${item.oco_protocolo} foi atualizada para: ${item.oco_status}.`,
                timestamp: item.oco_data
            }));
            
            allUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const finalUpdates = allUpdates.slice(0, 5);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Últimas atualizações recuperadas com sucesso.',
                dados: finalUpdates
            });

        } catch (error) {
            console.error("Erro no controller do dashboard:", error);
            return response.status(500).json({ sucesso: false, mensagem: 'Erro no servidor.', dados: error.message });
        }
    }
};