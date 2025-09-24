const db = require('../dataBase/connection');

module.exports = {
    async listablocos (request, response) {
        try {
            const sql = `SELECT bloc_id, 
            cond_id, bloc_nome FROM Bloco;
            `;
           
            const [row] = await db.query(sql);
            const nItens = row.length;
            
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de blocos.',
                nItens,
                dados: row
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de blocos.',
                dados: error.message
            
            });
        }   
    },
    async cadastrarblocos (request, response) {
        try {
            const { cond_id, bloc_nome } = request.body;
            const bloc_ativa = 1;

            const sql = `
            INSERT INTO Bloco
                (cond_id, bloc_nome)
            VALUES
                (?, ?);
            `;
            
            const values = [cond_id, bloc_nome];
            const [result] = await db.query(sql,values);
            const dados = {
                id: result.insertID,
                cond_id,
                bloc_nome                    
                };

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Cadastrar bloco.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de blocos.',
                dados: error.message
            
            });
        }   
    },

    async editarblocos (request, response) {
        try {
            const { cond_id, bloc_nome } = request.body;
            const { id } = request.params;

            const sql = `
            UPDATE Bloco SET
                cond_id = ?, bloc_nome = ? 
            WHERE 
                bloc_id = ?;
            `;
            const values = [cond_id, bloc_nome, id];
            const [result] = await db.query(sql,values);
            
            if (result.affectedRows == 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Bloco ${id}não encontrado.`,
                    dados
                });
            }
            const dados = {
                cond_id,
                bloc_nome,
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Bloco ${id} editado.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de blocos.',
                dados: error.message
            
            });
        }   
    },
    async apagarblocos (request, response) {
        try {
            const { id } = request.params;
            const sql = `DELETE FROM Bloco WHERE bloc_id = ?;`;
            const values = [id];
            const [result] = await db.query(sql,values);
            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Bloco ${bloc_id}não encontrado.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Bloco ${id} apagado com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de blocos.',
                dados: error.message
            
            });
        }   
    },
}