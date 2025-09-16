const bd = require('../dataBase/connection');

module.exports = {
    // FUNÇÃO PARA O SÍNDICO (WEB) - Lista tudo
    async listarTodasEncomendas(request, response) {
        try {
            const sql = `
                SELECT enc_id, userap_id, enc_nome_loja, enc_codigo_rastreio,
                       enc_status, enc_data_chegada, enc_data_retirada
                FROM Encomendas;
            `;
            const [rows] = await bd.query(sql);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de todas as encomendas.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na listagem de encomendas.',
                dados: error.message
            });
        }
    },

    // FUNÇÃO PARA O MORADOR (APP) - Lista por userap_id
    async listarEncomendasDoMorador(request, response) {
        try {
            const { userap_id } = request.params;
            const sql = `
                SELECT enc_id, userap_id, enc_nome_loja, enc_codigo_rastreio,
                       enc_status, enc_data_chegada, enc_data_retirada
                FROM Encomendas 
                WHERE userap_id = ? 
                ORDER BY enc_data_chegada DESC;
            `;
            const values = [userap_id];
            const [rows] = await bd.query(sql, values);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de encomendas do morador.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar encomendas do morador.',
                dados: error.message
            });
        }
    },


    // CADASTRAR
    async cadastrarEncomendas(request, response) {
        try {
            const { userap_id, enc_nome_loja, enc_codigo_rastreio, enc_status, enc_data_retirada } = request.body;

            const sql = `
                INSERT INTO Encomendas
                    (userap_id, enc_nome_loja, enc_codigo_rastreio, enc_status, enc_data_retirada)
                VALUES (?, ?, ?, ?, ?)
            `;

            const values = [
                userap_id,
                enc_nome_loja,
                enc_codigo_rastreio ?? null,
                enc_status ?? 'aguardando_retirada',
                enc_data_retirada ?? null
            ];

            const [result] = await bd.query(sql, values);

            return response.status(201).json({
                sucesso: true,
                mensagem: 'Encomenda cadastrada com sucesso.',
                dados: {
                    id: result.insertId,
                    userap_id,
                    enc_nome_loja,
                    enc_codigo_rastreio: enc_codigo_rastreio ?? null,
                    enc_status: enc_status ?? 'aguardando_retirada',
                    enc_data_retirada: enc_data_retirada ?? null
                }
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao cadastrar encomenda.',
                dados: error.message
            });
        }
    },

    async editarEncomendas(request, response) {
        try {
            const { id } = request.params;
            const { enc_nome_loja, enc_codigo_rastreio, enc_status, enc_data_retirada } = request.body;

            const sql = `
                UPDATE Encomendas
                SET enc_nome_loja = ?, enc_codigo_rastreio = ?, enc_status = ?, enc_data_retirada = ?
                WHERE enc_id = ?
            `;

            const values = [
                enc_nome_loja,
                enc_codigo_rastreio ?? null,
                enc_status ?? 'aguardando_retirada',
                enc_data_retirada ?? null,
                id
            ];

            const [result] = await bd.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Encomenda ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Encomenda ${id} atualizada com sucesso.`,
                dados: result.affectedRows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao atualizar encomenda.',
                dados: error.message
            });
        }
    },

    async apagarEncomendas(request, response) {
        try {
            const { id } = request.params;
            const sql = 'DELETE FROM Encomendas WHERE enc_id = ?';
            const [result] = await bd.query(sql, [id]);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Encomenda ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Encomenda ${id} excluída com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao excluir encomenda.',
                dados: error.message
            });
        }
    }
};
