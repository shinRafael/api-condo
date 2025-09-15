const bd = require('../dataBase/connection');

module.exports = {
    // LISTAR
    async listarEncomendas(request, response) {
        try {
            const sql = `
                SELECT enc_id, userap_id, enc_nome_loja, enc_codigo_rastreio,
                       enc_status, enc_data_chegada, enc_data_retirada
                FROM Encomendas;
            `;
            const [rows] = await bd.query(sql);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de encomendas.',
                itens: rows.length,
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
