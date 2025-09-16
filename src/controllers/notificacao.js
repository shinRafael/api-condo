const db = require('../dataBase/connection');

module.exports = {
    // Rota para o APP: Lista notificações de um morador específico
    async listarnotificacao(request, response) {
        try {
            const { userap_id } = request.params;
            const sql = `
                SELECT not_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_tipo, not_prioridade 
                FROM Notificacoes 
                WHERE userap_id = ? 
                ORDER BY not_data_envio DESC;
            `;
            const values = [userap_id];
            const [rows] = await db.query(sql, values);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de notificações do usuário.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar notificações.',
                dados: error.message
            });
        }
    },

    // Rota para o DASHBOARD do APP: Lista apenas os avisos importantes
    async listarAvisosImportantes(request, response) {
        try {
            const sql = `
                SELECT not_id, not_titulo, not_mensagem 
                FROM Notificacoes
                WHERE not_tipo = 'Aviso' AND not_prioridade = 'Alta'
                ORDER BY not_data_envio DESC
                LIMIT 3;
            `;
            const [rows] = await db.query(sql);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de avisos importantes.',
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar avisos importantes.',
                dados: error.message
            });
        }
    },

    // Rota para o APP: Marcar uma notificação como lida
    async marcarComoLida(request, response) {
        try {
            const { not_id } = request.params;
            const sql = `UPDATE Notificacoes SET not_lida = 1 WHERE not_id = ?`;
            const values = [not_id];
            const [result] = await db.query(sql, values);
            
            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Notificação ${not_id} não encontrada.`
                });
            }
            return response.status(200).json({
                sucesso: true,
                mensagem: `Notificação ${not_id} marcada como lida.`
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao marcar notificação como lida.',
                dados: error.message
            });
        }
    },


    async cadrastonotificacao(request, response) {
        try {
            const { not_titulo, not_mensagem, not_tipo, not_prioridade, alvo } = request.body;

            // ===== VALIDAÇÃO ADICIONADA AQUI =====
            // Verifica se os campos obrigatórios foram enviados pelo cliente (painel web)
            if (!not_titulo || !not_mensagem) {
                return response.status(400).json({ 
                    sucesso: false, 
                    mensagem: 'O título e a mensagem da notificação são obrigatórios.' 
                });
            }
            // =======================================

            let listaDeUserApIds = [];

            if (alvo.tipo === 'todos') {
                const [rows] = await db.query('SELECT userap_id FROM Usuario_Apartamentos');
                listaDeUserApIds = rows.map(r => r.userap_id);
            } else if (alvo.tipo === 'bloco' && alvo.id) {
                const sql = `
                    SELECT ua.userap_id FROM Usuario_Apartamentos ua
                    JOIN Apartamentos a ON ua.ap_id = a.ap_id
                    WHERE a.bloco_id = ?;
                `;
                const [rows] = await db.query(sql, [alvo.id]);
                listaDeUserApIds = rows.map(r => r.userap_id);
            } else if (alvo.tipo === 'apartamento' && alvo.ids && alvo.ids.length > 0) {
                 const sql = `SELECT userap_id FROM Usuario_Apartamentos WHERE ap_id IN (?);`;
                 const [rows] = await db.query(sql, [alvo.ids]);
                 listaDeUserApIds = rows.map(r => r.userap_id);
            }

            if (listaDeUserApIds.length === 0) {
                return response.status(400).json({ sucesso: false, mensagem: 'Nenhum destinatário encontrado.' });
            }

            for (const userap_id of listaDeUserApIds) {
                const sqlInsert = `
                    INSERT INTO Notificacoes 
                    (userap_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_tipo, not_prioridade)
                    VALUES (?, ?, ?, NOW(), 0, ?, ?);
                `;
                const values = [userap_id, not_titulo, not_mensagem, not_tipo, not_prioridade || 'Media'];
                await db.query(sqlInsert, values);
            }

            return response.status(201).json({
                sucesso: true,
                mensagem: `Notificação enviada para ${listaDeUserApIds.length} destinatário(s).`
            });

        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao cadastrar notificação.',
                dados: error.message
            });
        }
    },

    async editarnotificacao(request, response) {
        try {
            const { not_titulo, not_mensagem, not_lida, not_tipo, not_prioridade } = request.body;
            const { id } = request.params;

            const sql = `
                UPDATE Notificacoes
                SET not_titulo = ?, not_mensagem = ?, not_lida = ?, not_tipo = ?, not_prioridade = ?
                WHERE not_id = ?
            `;
            const values = [not_titulo, not_mensagem, not_lida, not_tipo, not_prioridade, id];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Notificação ${id} não encontrada.`
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Notificação ${id} atualizada com sucesso.`
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao editar notificação.',
                dados: error.message
            });
        }
    },

    async apagarnotificacao(request, response) {
        try {
            const { id } = request.params;
            const sql = `DELETE FROM notificacoes WHERE not_id = ?`;
            const [result] = await db.query(sql, [id]);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Notificação ${id} não encontrada.`
                });
            }
            return response.status(200).json({
                sucesso: true,
                mensagem: `Notificação ${id} excluída com sucesso.`
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao excluir notificação.',
                dados: error.message
            });
        }
    },
};