const db = require('../dataBase/connection');

module.exports ={
    async listarUsuariosApartamentos(request, response) {
        try {
            const sql = `
                SELECT userap_id, user_id, ap_id 
                FROM usuario_apartamentos;
            `;
    
            const [rows] = await db.query(sql);
            const nItens = rows.length;
    
            const dados = rows.map(item => ({
                id: item.userap_id,
                usuarioId: item.user_id,
                apartamentoId: item.ap_id
            }));
    
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de usuários vinculados aos apartamentos.',
                nItens,
                dados
            });
    
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de usuários.',
                dados: error.message
            });
        }
    },
    
    async cadastrarUsuariosApartamentos (request, response) {
        try {
            const { user_id, ap_id } = request.body;
    
            const sql = `
                INSERT INTO Usuario_apartamentos
                    (user_id, ap_id)
                VALUES
                    (?, ?);
            `;
    
            const values = [user_id, ap_id];
            const [result] = await db.query(sql, values);
    
            const dados = {
                id: result.insertId,
                user_id,
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
    async editarUsuariosApartamentos (request, response) {
        try {
            const { user_id, ap_id } = request.body;

            const { id } = request.params;

            const sql = `
            UPDATE usuario_apartamentos SET
            user_id = ?, ap_id = ?
            WHERE
            userap_id = ?;
            `

            const values = [user_id, ap_id, id];

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
                user_id,
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
    async apagarUsuariosApartamentos (request, response) {
        try {

            const { id } = request.params;
            const sql = `DELETE FROM usuario_apartamentos WHERE userap_id = ?;`;
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