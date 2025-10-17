const db = require('../dataBase/connection');

// Função auxiliar para agrupar as mensagens em conversas
const agruparMensagensPorMorador = (mensagens) => {
    if (!Array.isArray(mensagens) || mensagens.length === 0) {
        return [];
    }
    const conversasMap = new Map();
    mensagens.forEach(msg => {
        if (!conversasMap.has(msg.moradorId)) {
            conversasMap.set(msg.moradorId, {
                moradorId: msg.moradorId,
                cond_id: msg.cond_id,
                moradorNome: msg.moradorNome,
                apartamento: `Bloco ${msg.blocoNome} - ${msg.apNumero}`,
                mensagens: [],
            });
        }
        conversasMap.get(msg.moradorId).mensagens.push({
            id: msg.msg_id,
            remetente: msg.user_tipo === 'Morador' ? 'morador' : 'sindico',
            texto: msg.msg_mensagem,
            data: new Date(msg.msg_data_envio).toLocaleString("pt-BR"),
            lida: msg.msg_status === 'Lida',
        });
    });
    return Array.from(conversasMap.values());
};

module.exports = {
    async listamensagens (request, response) {
        try {
            const sql = `
                SELECT 
                    m.msg_id, m.msg_mensagem, m.msg_data_envio, m.msg_status, m.cond_id,
                    ua.userap_id AS moradorId,
                    u.user_nome AS moradorNome, u.user_tipo,
                    a.ap_numero AS apNumero,
                    b.bloc_nome AS blocoNome
                FROM mensagens m
                JOIN usuario_apartamentos ua ON m.userap_id = ua.userap_id
                JOIN usuarios u ON ua.user_id = u.user_id
                JOIN apartamentos a ON ua.ap_id = a.ap_id
                JOIN bloco b ON a.bloco_id = b.bloc_id
                ORDER BY m.msg_data_envio ASC;
            `;
            const [rows] = await db.query(sql);
            const conversasAgrupadas = agruparMensagensPorMorador(rows);
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de conversas agrupadas por morador.',
                dados: conversasAgrupadas
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar mensagens.',
                dados: error.message
            });
        }   
    },

    async cadastrarmensagens (request, response) {
        try {
            const { cond_id, userap_id, msg_mensagem } = request.body;
            
            if (!cond_id || !userap_id || !msg_mensagem) {
                return response.status(400).json({sucesso: false, mensagem: "Dados insuficientes."});
            }

            const sqlInsert = `
                INSERT INTO mensagens (cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status)
                VALUES (?, ?, ?, NOW(), ?);
            `;
             
            const values = [cond_id, userap_id, msg_mensagem, 'Enviada'];
            const [result] = await db.query(sqlInsert, values);
            const insertedId = result.insertId;

            const sqlSelect = `
                SELECT 
                    m.msg_id, m.msg_mensagem, m.msg_data_envio, m.msg_status,
                    ua.userap_id AS moradorId, u.user_nome AS moradorNome, u.user_tipo
                FROM mensagens m
                JOIN usuario_apartamentos ua ON m.userap_id = ua.userap_id
                JOIN usuarios u ON ua.user_id = u.user_id
                WHERE m.msg_id = ?;
            `;
            const [rows] = await db.query(sqlSelect, [insertedId]);
            const novaMensagemCompleta = rows[0];

            const dados = {
                id: novaMensagemCompleta.msg_id,
                remetente: 'sindico',
                texto: novaMensagemCompleta.msg_mensagem,
                data: new Date(novaMensagemCompleta.msg_data_envio).toLocaleString("pt-BR"),
                lida: false
            };
             
            return response.status(201).json({
                sucesso: true,
                mensagem: 'Mensagem enviada com sucesso.',
                dados: dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao cadastrar mensagem.',
                dados: error.message
            });
        }   
    },

    async editarmensagens (request, response) {
        try {
            const { cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status} = request.body;
            const { id } = request.params;

            const sql = `
            UPDATE mensagens SET
                cond_id = ?, userap_id = ?, msg_mensagem = ?, msg_data_envio = ?, msg_status = ?
            WHERE 
                msg_id = ?;
            `;

            const values = [cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status, id];
            const [result] = await db.query(sql, values);

            if  (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Mensagem ${id} não encontrada.`,
                    dados: null
                });
            }

            const dados = {
                cond_id,
                userap_id,
                msg_mensagem,
                msg_data_envio,
                msg_status
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Mensagem ${id} editada com sucesso.`,
                dados
            });

        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na edição de mensagens.',
                dados: error.message
            });
        }   
    },
    
    async apagarmensagens (request, response) {
        try {
            const { id } = request.params;
            const sql = `DELETE FROM mensagens WHERE msg_id = ?;`;
            const values = [id];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Mensagem ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Mensagem ${id} apagada com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na requisição de mensagens.',
                dados: error.message
            });
        }   
    },
};