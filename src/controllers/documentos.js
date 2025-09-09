const db = require('../database/connection');

module.exports = {
    // LISTAR
    async listardocumentos(request, response) {
        try {
            const sql = `
                SELECT 
                    doc_id, 
                    cond_id, 
                    doc_nome, 
                    doc_categoria, 
                    doc_data, 
                    doc_tamanho, 
                    doc_url
                FROM documentos;
            `;

            const [rows] = await db.query(sql);
            const nItens = rows.length;

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de documentos.',
                nItens,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na listagem de documentos.',
                dados: error.message
            });
        }
    },

    // CADASTRAR
    async cadastrardocumentos(request, response) {
        try {
            const { cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url } = request.body;

            const sql = `
                INSERT INTO documentos 
                (cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url)
                VALUES (?, ?, ?, ?, ?, ?);
            `;

            const values = [cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url];

            const [result] = await db.query(sql, values);

            const dados = {
                doc_id: result.insertId,
                cond_id,
                doc_nome,
                doc_categoria,
                doc_data,
                doc_tamanho,
                doc_url
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Documento cadastrado com sucesso.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no cadastro de documentos.',
                dados: error.message
            });
        }
    },

    // EDITAR
    async editardocumentos(request, response) {
        try {
            const { cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url } = request.body;
            const { id } = request.params;

            const sql = `
                UPDATE documentos 
                SET cond_id = ?, doc_nome = ?, doc_categoria = ?, doc_data = ?, doc_tamanho = ?, doc_url = ?
                WHERE doc_id = ?;
            `;

            const values = [cond_id, doc_nome, doc_categoria, doc_data, doc_tamanho, doc_url, id];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Documento com ID ${id} não encontrado.`,
                    dados: null
                });
            }

            const dados = {
                doc_id: id,
                cond_id,
                doc_nome,
                doc_categoria,
                doc_data,
                doc_tamanho,
                doc_url
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Documento ${id} atualizado com sucesso.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao editar documento.',
                dados: error.message
            });
        }
    },

    // APAGAR
    async apagardocumentos(request, response) {
        try {
            const { id } = request.params;

            const sql = `DELETE FROM documentos WHERE doc_id = ?`;
            const values = [id];

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Documento com ID ${id} não encontrado.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Documento ${id} excluído com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao apagar documento.',
                dados: error.message
            });
        }
    },
};
