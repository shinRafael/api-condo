const bd = require('../dataBase/connection');

module.exports = {
    async listarGerenciamento(request, response) {
        try {
            const sql = `
                SELECT 
                  ger.ger_id,
                  ger.cond_id,
                  cond.cond_nome,
                  DATE_FORMAT(ger.ger_data, '%d/%m/%Y') AS ger_data,
                  ger.ger_descricao,
                  ger.ger_valor
                FROM gerenciamento ger
                INNER JOIN condominio cond 
                  ON ger.cond_id = cond.cond_id;
            `;
            const [rows] = await bd.query(sql);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de gerenciamento.',
                itens: rows.length,
                dados: rows
            })
        } catch (error) {
            return response.status(500).json({ // <-- corrigido
                sucesso: false,
                mensagem: 'Erro na listagem de gerenciamento.',
                dados: error.message
            });
        }
    },

    async cadastrarGerenciamento(request, response) {
        try {
            const { cond_id, ger_data, ger_descricao, ger_valor } = request.body;

            const sql = `
                INSERT INTO gerenciamento
                    (cond_id, ger_data, ger_descricao, ger_valor)
                VALUES (?, ?, ?, ?);
            `;

            const values = [cond_id, ger_data, ger_descricao, ger_valor];
            const [result] = await bd.query(sql, values);

            const [cond] = await bd.query(
                "SELECT cond_nome FROM condominio WHERE cond_id = ?",
                [cond_id]
            );

            const dados = {
                ger_id: result.insertId,
                cond_id,
                cond_nome: cond.length > 0 ? cond[0].cond_nome : null,
                ger_data,
                ger_descricao,
                ger_valor
            };

            return response.status(201).json({ // <-- 201 para cadastro
                sucesso: true,
                mensagem: 'Cadastro de gerenciamento realizado.',
                dados
            });
        } catch (error) {
            return response.status(500).json({ // <-- corrigido
                sucesso: false,
                mensagem: 'Erro ao cadastrar gerenciamento.',
                dados: error.message
            });
        }
    },

    async editargerenciamento(request, response) {
        try {
            const { cond_id, ger_data, ger_descricao, ger_valor } = request.body;
            const { id } = request.params;

            const sql = `
                UPDATE gerenciamento
                SET cond_id = ?, ger_data = ?, ger_descricao = ?, ger_valor = ?
                WHERE ger_id = ?
            `;
            const values = [cond_id, ger_data, ger_descricao, ger_valor, id];
            const [result] = await bd.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Gerenciamento com ID ${id} não encontrado!`,
                    dados: null
                });
            }

            const dados = {
                ger_id: id, // <-- corrigido
                cond_id,
                ger_data,
                ger_descricao,
                ger_valor
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Gerenciamento ${id} atualizado com sucesso!`,
                dados
            });

        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na requisição.',
                dados: error.message
            });
        }
    },

    async apagargerenciamento(request, response) {
        try {
            const { id } = request.params;
            const sql = 'DELETE FROM gerenciamento WHERE ger_id = ?';
            const [result] = await bd.query(sql, [id]);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Gerenciamento ${id} não encontrado!`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Gerenciamento ${id} excluído com sucesso`,
                dados: null
            });

        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na requisição.',
                dados: error.message
            });
        }
    },

    async filtrarGerenciamento(request, response) {
        try {
            const { condominio, descricao } = request.query;

            let sql = 'SELECT * FROM gerenciamento WHERE 1=1 ';
            const params = [];

            if (condominio) {
                sql += 'AND cond_id = ? ';
                params.push(condominio);
            }

            if (descricao) {
                sql += 'AND ger_descricao LIKE ? ';
                params.push(`%${descricao}%`);
            }

            const [rows] = await bd.query(sql, params);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Gerenciamentos filtrados com sucesso!',
                dados: rows
            });
        } catch (error) {
            response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao filtrar gerenciamento.',
                dados: error.message
            });
        }
    }
};
