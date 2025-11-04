const db = require('../dataBase/connection');

module.exports = {
    // FUNÇÃO PARA O SÍNDICO (WEB) - Lista tudo agrupado por status
    async listarTodasOcorrencias(request, response) {
        try {
            const sql = `
                SELECT
                    o.oco_id, o.userap_id, o.oco_protocolo, o.oco_categoria,
                    o.oco_descricao, o.oco_localizacao, o.oco_data,
                    o.oco_status, o.oco_prioridade, o.oco_imagem,
                    u.user_nome AS morador_nome,
                    CONCAT('Bloco ', b.bloc_nome, ' - AP ', a.ap_numero) AS apartamento
                FROM ocorrencias o
                JOIN usuario_apartamentos ua ON o.userap_id = ua.userap_id
                JOIN usuarios u ON ua.user_id = u.user_id
                JOIN apartamentos a ON ua.ap_id = a.ap_id
                JOIN bloco b ON a.bloc_id = b.bloc_id
                ORDER BY o.oco_data DESC;
            `;

            const [rows] = await db.query(sql);

            // Agrupa os resultados por status
            const agrupados = {
                Aberta: [],
                'Em Andamento': [], // Mantém a chave com espaço
                Resolvida: [],
                Cancelada: []
            };

            rows.forEach(o => {
                // Garante que o status existe no objeto 'agrupados'
                const statusKey = o.oco_status && agrupados.hasOwnProperty(o.oco_status) ? o.oco_status : 'Aberta';
                agrupados[statusKey].push(o);
            });

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de ocorrências agrupadas por status.',
                dados: agrupados // Retorna o objeto com os arrays agrupados
            });
        } catch (error) {
            console.error("Erro ao listar ocorrências:", error);
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar ocorrências.',
                dados: error.message
            });
        }
    },

    // FUNÇÃO PARA O MORADOR (APP) - Lista por userap_id (sem JOINs)
    async listarOcorrenciasDoMorador(request, response) {
        try {
            const { userap_id } = request.params;
            const sql = `
                SELECT
                    oco_id, userap_id, oco_protocolo, oco_categoria, oco_descricao,
                    oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem
                FROM ocorrencias
                WHERE userap_id = ?
                ORDER BY oco_data DESC;
            `;
            const values = [userap_id];
            const [rows] = await db.query(sql, values);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de ocorrências do morador.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar ocorrências do morador.',
                dados: error.message
            });
        }
    },

    // CADASTRAR OCORRÊNCIA
    async cadastrarocorrencias(request, response) {
         try {
            const { userap_id, oco_categoria, oco_descricao, oco_localizacao, oco_prioridade, oco_imagem } = request.body;
            const anoAtual = new Date().getFullYear();
            const sqlBusca = `SELECT COUNT(*) as total_no_ano FROM ocorrencias WHERE YEAR(oco_data) = ?;`;
            const [resultadoBusca] = await db.query(sqlBusca, [anoAtual]);
            const proximoNumero = resultadoBusca[0].total_no_ano + 1;
            const protocoloFormatado = `OCO-${anoAtual}-${proximoNumero.toString().padStart(4, '0')}`;
            const sqlInsert = `INSERT INTO ocorrencias (userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?);`;
            const prioridadePadrao = oco_prioridade || 'Média';
            const values = [userap_id, protocoloFormatado, oco_categoria, oco_descricao, oco_localizacao, "Aberta", prioridadePadrao, oco_imagem];
            const [result] = await db.query(sqlInsert, values);

            // Busca o que foi inserido para retornar dados completos
            const [insertedRow] = await db.query(
                `SELECT
                    o.*,
                    u.user_nome AS morador_nome,
                    CONCAT('Bloco ', b.bloc_nome, ' - AP ', a.ap_numero) AS apartamento
                 FROM ocorrencias o
                 LEFT JOIN usuario_apartamentos ua ON o.userap_id = ua.userap_id
                 LEFT JOIN usuarios u ON ua.user_id = u.user_id
                 LEFT JOIN apartamentos a ON ua.ap_id = a.ap_id
                 LEFT JOIN bloco b ON a.bloc_id = b.bloc_id
                 WHERE o.oco_id = ?`,
                [result.insertId]
            );

            return response.status(201).json({
                sucesso: true,
                mensagem: 'Ocorrência cadastrada.',
                dados: insertedRow[0] // Retorna o item completo
            });
        } catch (error) {
            console.error("Erro ao cadastrar ocorrência:", error);
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no cadastro de ocorrências.',
                dados: error.message
            });
        }
    },

    // EDITAR OCORRÊNCIA (STATUS E/OU PRIORIDADE)
    async editarocorrencias(request, response) {
         try {
            const { id } = request.params;
            const { oco_status, oco_prioridade } = request.body;

             if (!oco_status && !oco_prioridade) {
                 return response.status(400).json({
                    sucesso: false,
                    mensagem: "É necessário fornecer 'oco_status' ou 'oco_prioridade' para atualizar.",
                    dados: null
                });
             }

             const statusValidos = ['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'];
             const prioridadesValidas = ['Baixa', 'Média', 'Alta', 'Urgente'];

             if (oco_status && !statusValidos.includes(oco_status)) {
                 return response.status(400).json({ sucesso: false, mensagem: "Status inválido."});
             }
             if (oco_prioridade && !prioridadesValidas.includes(oco_prioridade)) {
                 return response.status(400).json({ sucesso: false, mensagem: "Prioridade inválida."});
             }

            const camposParaAtualizar = [];
            const values = [];
            if (oco_status) {
                camposParaAtualizar.push('oco_status = ?');
                values.push(oco_status);
            }
            if (oco_prioridade) {
                camposParaAtualizar.push('oco_prioridade = ?');
                values.push(oco_prioridade);
            }
            values.push(id);

            const sql = `UPDATE ocorrencias SET ${camposParaAtualizar.join(', ')} WHERE oco_id = ?;`;

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                 return response.status(404).json({
                    sucesso: false,
                    mensagem: `Ocorrência com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            const dadosAtualizados = {};
            if (oco_status) dadosAtualizados.oco_status = oco_status;
            if (oco_prioridade) dadosAtualizados.oco_prioridade = oco_prioridade;

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ocorrência ${id} atualizada.`,
                dados: dadosAtualizados
            });
        } catch (error) {
             console.error("Erro ao editar ocorrência:", error);
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao editar ocorrência.',
                dados: error.message
            });
        }
    },

    // APAGAR OCORRÊNCIA
    async apagarocorrencias(request, response) {
        try {
            const { id } = request.params;
            const sql = `DELETE FROM ocorrencias WHERE oco_id = ?`;
            const [result] = await db.query(sql, [id]);
            if (result.affectedRows === 0) {
                 return response.status(404).json({
                    sucesso: false,
                    mensagem: `Ocorrência com ID ${id} não encontrada.`,
                    dados: null
                });
            }
            return response.status(200).json({
                sucesso: true,
                mensagem: `Ocorrência ${id} excluída.`
            });
        } catch (error) {
             console.error("Erro ao apagar ocorrência:", error);
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao apagar ocorrência.',
                dados: error.message
            });
        }
    },

    // ===========================================
    // NOVAS FUNÇÕES: CHAT DA OCORRÊNCIA
    // ===========================================

    // LISTAR MENSAGENS DE UMA OCORRÊNCIA
    async listarMensagensDaOcorrencia(request, response) {
        try {
            const { id } = request.params; // ID da ocorrência (oco_id)
            const sql = `
                SELECT
                    om.ocomsg_id, om.oco_id, om.user_id, om.ocomsg_mensagem,
                    om.ocomsg_data_envio, om.ocomsg_lida,
                    u.user_nome AS remetente_nome,
                    u.user_tipo AS remetente_tipo
                FROM Ocorrencia_Mensagens om
                JOIN Usuarios u ON om.user_id = u.user_id
                WHERE om.oco_id = ?
                ORDER BY om.ocomsg_data_envio ASC;
            `;
            const [rows] = await db.query(sql, [id]);
            return response.status(200).json({
                sucesso: true,
                mensagem: `Mensagens da ocorrência ${id}.`,
                dados: rows
            });
        } catch (error) {
             console.error("Erro ao listar mensagens da ocorrência:", error);
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao buscar mensagens da ocorrência.',
                dados: error.message
            });
        }
    },

    // ENVIAR NOVA MENSAGEM PARA UMA OCORRÊNCIA
    async enviarMensagemParaOcorrencia(request, response) {
        try {
            const { id } = request.params; // ID da ocorrência (oco_id)
            // ***** IMPORTANTE: Substitua '3' pelo ID real do usuário logado (síndico/adm) *****
            // Em um sistema real, isso viria do 'request.user.id' (após um middleware de auth)
            const remetente_user_id = 3;
            const { ocomsg_mensagem } = request.body;

            if (!ocomsg_mensagem) {
                return response.status(400).json({ sucesso: false, mensagem: "A mensagem não pode estar vazia." });
            }

            const sqlInsert = `INSERT INTO Ocorrencia_Mensagens (oco_id, user_id, ocomsg_mensagem, ocomsg_data_envio) VALUES (?, ?, ?, NOW());`;
            const [result] = await db.query(sqlInsert, [id, remetente_user_id, ocomsg_mensagem]);
            const novaMensagemId = result.insertId;

            // Busca a mensagem recém-criada para retornar ao front-end
            const sqlSelect = `
                SELECT
                    om.ocomsg_id, om.oco_id, om.user_id, om.ocomsg_mensagem,
                    om.ocomsg_data_envio, om.ocomsg_lida,
                    u.user_nome AS remetente_nome,
                    u.user_tipo AS remetente_tipo
                FROM Ocorrencia_Mensagens om
                JOIN Usuarios u ON om.user_id = u.user_id
                WHERE om.ocomsg_id = ?;
            `;
            const [rows] = await db.query(sqlSelect, [novaMensagemId]);

            return response.status(201).json({
                sucesso: true,
                mensagem: 'Mensagem enviada.',
                dados: rows[0]
            });
        } catch (error) {
            console.error("Erro ao enviar mensagem para ocorrência:", error);
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao enviar mensagem.',
                dados: error.message
            });
        }
    },
};