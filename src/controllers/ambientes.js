const db = require('../database/connection');

module.exports ={
    async listarAmbientes (request, response) {
        try {

            const sql = `
            SELECT cond_id, amb_descricao, 
            amb_nome, amb_capacidade
            FROM ambientes;
        `;
        const [row] = await db.query(sql);
        const nItens = row.length;

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de Ambientes.',
                nItens,
                dados: row
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de Ambientes.',
                dados: error.message
            
            });
        }   
    },
    async cadastrarAmbientes(request, response) {
        try {
            const { cond, nome, descricao, capacidade } = request.body;
    
            const sql = `
                INSERT INTO ambientes
                    (cond_id, amb_nome, amb_descricao, amb_capacidade)
                VALUES
                    (?, ?, ?, ?);
            `;
    
            const values = [cond, nome, descricao, capacidade];
            const [result] = await db.query(sql, values);
    
            const dados = {
                id: result.insertId,
                cond,
                nome,
                descricao,
                capacidade
            };
    
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Cadastro de Ambientes realizado com sucesso.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no Cadastro de Ambientes.',
                dados: error.message
            });
        }
    },
            async editarAmbientes (request, response) {
                try {
        const { nome, descricao, capacidade } = request.body;
        const { id } = request.params;

        const sql = `
            UPDATE ambientes SET
            amb_nome = ?, amb_descricao = ?, amb_capacidade = ?
            WHERE amb_id = ?;
        `;

        const values = [nome, descricao, capacidade, id];


                const [result] = await db.query(sql, values);

                if (result.affectedRows ===0) {
                    return response.status(404).json({
                        sucesso : false,
                        mensagem: `Ambiente ${id} não encontrado!`,
                        dados : null
                    })
                }
                
                const dados = {
                    nome,
                    descricao,
                    capacidade
                };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ambiente ${id} editado com sucesso.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na edição de Ambientes.',
                dados: error.message
            
            });
        }   
    },
    async apagarAmbientes (request, response) {
        try {

            const { id } = request.params;

            const sql = `DELETE FROM ambientes WHERE amb_id = ?;`;
            const values = [id];

            const [result] = await db.query(sql, values);

            if (result.affectedRows ===0) {
                return response.status(404).json({
                    sucesso : false,
                    mensagem: `Ambiente ${id} não encontrado!`,
                    dados : null
                })
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ambiente ${id} removido com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Remoção de Ambientes.',
                dados: error.message
            
            });
        }   
    },
}