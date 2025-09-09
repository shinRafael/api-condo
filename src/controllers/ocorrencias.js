const db = require('../database/connection');

module.exports = {
    // LISTAR
    async listarocorrencias(request, response) {
        try {
            const sql = `
                SELECT 
                    oco_id, 
                    userap_id, 
                    oco_protocolo, 
                    oco_categoria, 
                    oco_descricao, 
                    oco_localizacao, 
                    oco_data, 
                    oco_status,
                    oco_prioridade,
                    oco_imagem
                FROM ocorrencias;
            `;

            const [rows] = await db.query(sql);
            const nItens = rows.length;

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de ocorrências.',
                nItens,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na listagem de ocorrências.',
                dados: error.message
            });
        }
    },

    // CADASTRAR
    async cadastrarocorrencias(request, response) {
        try {
            const { userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem } = request.body;

            const sql = `
                INSERT INTO ocorrencias 
                (userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;

            const values = [userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem];

            const [result] = await db.query(sql, values);

            const dados = {
                oco_id: result.insertId,
                userap_id,
                oco_protocolo,
                oco_categoria,
                oco_descricao,
                oco_localizacao,
                oco_data,
                oco_status,
                oco_prioridade,
                oco_imagem
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Ocorrência cadastrada com sucesso.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no cadastro de ocorrências.',
                dados: error.message
            });
        }
    },

    // EDITAR
    async editarocorrencias(request, response) {
        try {
            const { userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem } = request.body;
            const { id } = request.params;

            const sql = `
                UPDATE ocorrencias 
                SET userap_id = ?, oco_protocolo = ?, oco_categoria = ?, oco_descricao = ?, oco_localizacao = ?, oco_data = ?, oco_status = ?, oco_prioridade = ?, oco_imagem = ?
                WHERE oco_id = ?;
            `;

            const values = [userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem, id];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Ocorrência com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            const dados = {
                oco_id: id,
                userap_id,
                oco_protocolo,
                oco_categoria,
                oco_descricao,
                oco_localizacao,
                oco_data,
                oco_status,
                oco_prioridade,
                oco_imagem
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ocorrência ${id} atualizada com sucesso.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao editar ocorrência.',
                dados: error.message
            });
        }
    },

    // APAGAR
    async apagarocorrencias(request, response) {
        try {
            const { id } = request.params;

            const sql = `DELETE FROM ocorrencias WHERE oco_id = ?`;
            const values = [id];

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Ocorrência com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ocorrência ${id} excluída com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao apagar ocorrência.',
                dados: error.message
            });
        }
    },
};
