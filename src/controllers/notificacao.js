const db = require('../dataBase/connection');

// Função auxiliar para garantir que a prioridade seja enviada no formato correto do ENUM do banco de dados
const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return 'Media'; // Valor padrão
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

module.exports = {
    // ==================================================================
    // FUNÇÕES PARA O PAINEL WEB (VISÃO AGRUPADA)
    // ==================================================================

    /**
     * Busca a lista de envios de forma agrupada pelos dados existentes.
     * Não requer a coluna 'envio_id'.
     */
    async listarEnviosAgrupados(request, response) {
        try {
            const sql = `
                SELECT 
                    not_titulo, 
                    not_mensagem, 
                    not_prioridade,
                    not_tipo,
                    MAX(not_data_envio) as data_ultimo_envio,
                    COUNT(userap_id) as total_destinatarios
                FROM 
                    Notificacoes
                GROUP BY 
                    not_titulo, not_mensagem, not_prioridade, not_tipo
                ORDER BY 
                    data_ultimo_envio DESC;
            `;
            const [rows] = await db.query(sql);
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de envios de notificação agrupados.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar envios agrupados.',
                dados: error.message
            });
        }
    },

    /**
 * Edita um grupo inteiro de notificações.
 * Encontra o grupo pelo conteúdo ORIGINAL e o atualiza com o NOVO conteúdo.
 */
async editarEnvioAgrupado(request, response) {
    try {
        const { original, novo } = request.body;

        if (!original || !novo || !original.not_titulo || !novo.not_titulo) {
            return response.status(400).json({ sucesso: false, mensagem: "Dados insuficientes para a edição. É necessário o conteúdo original e o novo." });
        }

        // Garante a capitalização correta para os ENUMs do banco
        const prioridadeOriginalFormatada = capitalize(original.not_prioridade);
        const prioridadeNovaFormatada = capitalize(novo.not_prioridade);

        const sql = `
            UPDATE Notificacoes
            SET 
                not_titulo = ?, 
                not_mensagem = ?, 
                not_prioridade = ?
            WHERE 
                not_titulo = ? AND 
                not_mensagem = ? AND 
                not_prioridade = ? AND 
                not_tipo = ?;
        `;

        const values = [
            novo.not_titulo,
            novo.not_mensagem,
            prioridadeNovaFormatada,
            original.not_titulo,
            original.not_mensagem,
            prioridadeOriginalFormatada,
            original.not_tipo
        ];
        
        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return response.status(404).json({ sucesso: false, mensagem: "Nenhum envio correspondente encontrado para edição." });
        }

        return response.status(200).json({
            sucesso: true,
            mensagem: `${result.affectedRows} notificações foram atualizadas com sucesso.`
        });
    } catch (error) {
        return response.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao editar envio agrupado.',
            dados: error.message
        });
    }
},

    /**
     * Apaga um grupo inteiro de notificações com base no seu conteúdo.
     */
    async apagarEnvioAgrupado(request, response) {
        try {
            const { not_titulo, not_mensagem, not_prioridade, not_tipo } = request.body;
            
            if (!not_titulo || !not_mensagem || !not_prioridade || !not_tipo) {
                return response.status(400).json({ sucesso: false, mensagem: "Dados insuficientes para exclusão." });
            }

            const prioridadeFormatada = capitalize(not_prioridade);

            const sql = `
                DELETE FROM Notificacoes 
                WHERE 
                    not_titulo = ? AND 
                    not_mensagem = ? AND 
                    not_prioridade = ? AND 
                    not_tipo = ?;
            `;
            const values = [not_titulo, not_mensagem, prioridadeFormatada, not_tipo];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({ sucesso: false, mensagem: "Nenhum envio correspondente encontrado para exclusão." });
            }
            return response.status(200).json({
                sucesso: true,
                mensagem: `${result.affectedRows} notificações foram excluídas com sucesso.`
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao excluir envio agrupado.',
                dados: error.message
            });
        }
    },

    // Rota para o APP: Lista notificações de um morador específico
    async listarnotificacao(request, response) {
        try {
            const { userap_id } = request.params;
            // Removido not_tipo da query
            const sql = `
                SELECT not_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_prioridade 
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
                WHERE not_prioridade = 'alta'
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


    async cadastrarnotificacao(request, response) {
        try {
            // Removido not_tipo do corpo da requisição
            const { not_titulo, not_mensagem, not_prioridade, alvo } = request.body;
            
            if (!not_titulo || !not_mensagem) {
                return response.status(400).json({ 
                    sucesso: false, 
                    mensagem: 'O título e a mensagem da notificação são obrigatórios.' 
                });
            }

            let listaDeUserApIds = [];

            if (alvo === 'todos') {
                const [rows] = await db.query('SELECT userap_id FROM usuario_Apartamentos');
                listaDeUserApIds = rows.map(r => r.userap_id);
            } else if (alvo.startsWith('bloco-')) {
                const blocId = alvo.split('-')[1];
                const [rows] = await db.query(`
                    SELECT ua.userap_id FROM usuario_Apartamentos ua
                    JOIN Apartamentos a ON ua.ap_id = a.ap_id
                    WHERE a.bloco_id = ?;
                `, [blocId]);
                listaDeUserApIds = rows.map(r => r.userap_id);
            } else if (alvo.startsWith('ap-')) {
                 const apId = alvo.split('-')[1];
                 const sql = `SELECT userap_id FROM usuario_Apartamentos WHERE ap_id = ?;`;
                 const [rows] = await db.query(sql, [apId]);
                 listaDeUserApIds = rows.map(r => r.userap_id);
            } else {
                 return response.status(400).json({ sucesso: false, mensagem: 'Alvo inválido.' });
            }

            if (listaDeUserApIds.length === 0) {
                return response.status(400).json({ sucesso: false, mensagem: 'Nenhum destinatário encontrado.' });
            }

            for (const userap_id of listaDeUserApIds) {
                const sqlInsert = `
                    INSERT INTO Notificacoes 
                    (userap_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_prioridade)
                    VALUES (?, ?, ?, NOW(), 0, ?);
                `;
                // Removido not_tipo dos valores
                const values = [userap_id, not_titulo, not_mensagem, not_prioridade || 'baixa'];
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
            // Removido not_tipo do corpo da requisição
            const { not_titulo, not_mensagem, not_lida, not_prioridade } = request.body;
            const { id } = request.params;

            const sql = `
                UPDATE Notificacoes
                SET not_titulo = ?, not_mensagem = ?, not_lida = ?, not_prioridade = ?
                WHERE not_id = ?
            `;
            // Removido not_tipo dos valores
            const values = [not_titulo, not_mensagem, not_lida, not_prioridade, id];
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