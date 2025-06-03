const bd = require('../database/connection');

module.exports = {
    async listarUsuario (request, response){
        try{
               const sql = 'select user_id, user_nome, user_email, user_senha, cpf , user_telefone, user_tipo from Usuarios';
                const [rows] = await bd.query(sql);
                const nItem = rows.length;
        
            return response.status(200).json({
                sucesso: true,
                nmensagem: 'Lista de usuario.',
                dados: rows
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de usuario.',
                dados: error.message
             });

        }
    },
    async cadrastoUsuario (request, response){
        try{
            const { user_id, user_nome, user_email, user_telefone, user_senha, user_tipo, cpf } = request.body;
            const user_ativo = 1;
            
            // instrução SQL
            const sql = `
                INSERT INTO usuarios
                (user_id, user_nome, user_email, user_telefone, user_senha, user_tipo, cpf )
                VALUES
                (?, ?, ?, ?, ?, ?,?);
            `;
            
            const values = [user_id, user_nome, user_email, user_telefone, user_senha, user_tipo, cpf];
            
            const [result] = await bd.query(sql, values);
            
            const dados = {
                id: result.insertId,
                user_nome,
                cpf,
                user_email,
                user_tipo,
            };            


         return response.status(200).json({
                sucesso: true,
                nmensagem: 'Cadrasto usuario.',
                dados: dados
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de usuario.',
                dados: error.message
             });

        }
    },
    async editarUsuario(request, response) {
        try {
          const { id } = request.params; // ID vindo da URL
          const { user_nome, user_email, user_telefone, user_senha, user_tipo, cpf } = request.body;
      
          // Atualizando os dados no banco
          const sql = `
            UPDATE usuarios
            SET user_nome = ?, user_email = ?, user_telefone = ?, user_senha = ?, user_tipo = ?, cpf = ?
            WHERE user_id = ?
          `;
      
          const values = [user_nome, user_email, user_telefone, user_senha, user_tipo, cpf, id];
      
          const [result] = await bd.query(sql, values);
      
          if (result.affectedRows === 0) {
            return response.status(404).json({
              sucesso: false,
              nmensagem: 'Usuário não encontrado para atualizar.',
              dados: null
            });
          }
      
          return response.status(200).json({
            sucesso: true,
            nmensagem: 'Usuário atualizado com sucesso.',
            dados: {
              user_id: id,
              user_nome,
              user_email,
              user_telefone,
              user_tipo,
              cpf
            }
          });
        } catch (error) {
          return response.status(500).json({
            sucesso: false,
            nmensagem: 'Erro ao atualizar o usuário.',
            dados: error.message
          });
        }
      },
      
      async apagarUsuario(request, response) {
        try {
          const { id } = request.params;
      
          const sql = 'DELETE FROM usuarios WHERE user_id = ?';
          const values = [id];
      
          const [result] = await bd.query(sql, values);
      
          if (result.affectedRows === 0) {
            return response.status(404).json({
              sucesso: false,
              nmensagem: 'Usuário não encontrado para deletar.',
              dados: null
            });
          }
      
          return response.status(200).json({
            sucesso: true,
            nmensagem: 'Usuário deletado com sucesso.',
            dados: { user_id: id }
          });
        } catch (error) {
          return response.status(500).json({
            sucesso: false,
            nmensagem: 'Erro ao deletar o usuário.',
            dados: error.message
          });
        }
      },
}
//ola