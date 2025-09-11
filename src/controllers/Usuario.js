const bd = require('../database/connection');

module.exports = {
    async listarUsuario (request, response){
        try{
               const sql = 'select user_id, user_nome, user_email, user_senha, user_telefone, user_tipo from Usuarios';
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
            const { user_id, user_nome, user_email, user_telefone, user_senha, user_tipo,} = request.body;
            const user_ativo = 1;
            
            // instrução SQL
            const sql = `
                INSERT INTO usuarios
                (user_id, user_nome, user_email, user_telefone, user_senha, user_tipo)
                VALUES
                (?, ?, ?, ?, ?, ?);
            `;
            
            const values = [user_id, user_nome, user_email, user_telefone, user_senha, user_tipo];
            
            const [result] = await bd.query(sql, values);
            
            const dados = {
                id: result.insertId,
                user_nome,
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
          const { user_nome, user_email, user_telefone, user_senha, user_tipo} = request.body;
      
          // Atualizando os dados no banco
          const sql = `
            UPDATE usuarios
            SET user_nome = ?, user_email = ?, user_telefone = ?, user_senha = ?, user_tipo = ?
            WHERE user_id = ?
          `;
      
          const values = [user_nome, user_email, user_telefone, user_senha, user_tipo, id];
      
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

      async loginUsuario(request, response) {
        try {
            const { user_email, user_senha } = request.body;

            // 1. Validação básica de entrada
            if (!user_email || !user_senha) {
                return response.status(400).json({
                    sucesso: false,
                    mensagem: "E-mail e senha são obrigatórios."
                });
            }

            // SQL com JOIN para buscar os dados do usuário e o userap_id
            const sql = `
                SELECT 
                    u.user_id, u.user_nome, u.user_email, u.user_telefone, u.user_tipo,
                    ua.userap_id 
                FROM 
                    Usuarios u
                JOIN 
                    Usuario_Apartamento ua ON u.user_id = ua.user_id
                WHERE 
                    u.user_email = ? AND u.user_senha = ?;
            `;
            
            const values = [user_email, user_senha];
            
            // ATENÇÃO: Em um projeto real, a senha nunca deve ser armazenada como texto puro.
            // Você deve usar uma biblioteca como 'bcrypt' para comparar a senha enviada com um 'hash' salvo no banco.

            const [rows] = await bd.query(sql, values);

            // 3. Verifica se o usuário foi encontrado
            if (rows.length === 0) {
                return response.status(401).json({
                    sucesso: false,
                    mensagem: 'E-mail ou senha inválidos.'
                });
            }

            const usuario = rows[0];
            
            // 4. Remove a senha do objeto antes de enviar a resposta
            delete usuario.user_senha;

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Login bem-sucedido.',
                dados: usuario
            });

        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno no servidor ao tentar fazer login.',
                dados: error.message
            });
        }
    }
}
//ola