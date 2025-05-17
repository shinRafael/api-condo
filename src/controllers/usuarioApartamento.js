const db = require('../database/connection');

module.exports ={
    async listarUsuariosApartamento (request, response) {
        try {

            const sql = `
                SELECT userap_id, userid, ap_id 
                FROM usuario_apartamento;
            `;

            const [row] = await db.query(sql);
            const nItens = row.length;


            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de usuários.',
                nItens,
                dados: row
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de usuários.',
                dados: error.message
            
            });
        }   
    },
    async cadastrarUsuariosApartamento (request, response) {
        try {
            const { userid, ap_id } = request.body;
    
            const sql = `
                INSERT INTO Usuario_apartamento
                    (userid, ap_id)
                VALUES
                    (?, ?);
            `;
    
            const values = [userid, ap_id];
            const [result] = await db.query(sql, values);
    
            const dados = {
                id: result.insertId,
                userid,
                ap_id,
            };
    
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Cadastro de Usuário realizado com sucesso.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no Cadastro de Usuário.',
                dados: error.message
            });
        }
    },
    async editarUsuariosApartamento (request, response) {
        try {
            const { userid, ap_id } = request.body;

            const { id } = request.params;

            const sql = `
            UPDATE usuario_apartamento SET
            userid = ?, ap_id = ?
            WHERE
            userap_id = ?;
            `

            const values = [userid, ap_id, id];

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: 'Usuário não encontrado.',
                    dados: null
                });
            }

            const dados = {
                id,
                userid,
                ap_id,
            };



            return response.status(200).json({
                sucesso: true,
                mensagem: `Usuario_apartamento ${id} atualizado com sucesso.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na edição de usuários.',
                dados: error.message
            
            });
        }   
    },
    async apagarUsuariosApartamento (request, response) {
        try {

            const { id } = request.params;
            const sql = `DELETE FROM usuario_apartamento WHERE userap_id = ?;`;
            const values = [id];
            const [result] = await db.query(sql, values);
            if (result.affectedRows ===0) {
                return response.status(404)({
                    sucesso: false,
                    mensagem: `Usuario ${userap_id} não encontrado!`,
                    dados: null
                });
            }
            return response.status(200).json({
                sucesso: true,
                mensagem: `Usuario ${userap_id} removido com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na remoção de usuários.',
                dados: error.message
            
            });
        }   
    },
}