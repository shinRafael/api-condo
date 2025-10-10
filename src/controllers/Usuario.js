const bd = require('../dataBase/connection');

module.exports = {
      async listarUsuario (request, response){
        try{
            const sql = 'SELECT user_id, user_nome, user_email, user_telefone, user_tipo FROM Usuarios';
            const [rows] = await bd.query(sql);
    
            return response.status(200).json({
                sucesso: true,
                nmensagem: 'Lista de usuários.',
                dados: rows
            });
        } catch (error){
            return response.status(500).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de usuários.',
                dados: error.message
            });
        }
    },
    // =============================================================
    // FUNÇÃO PARA BUSCAR O PERFIL COMPLETO (ID NA URL)
    // =============================================================
async buscarPerfilCompleto(request, response) {
    try {
        const userId = request.params.id;

        if (!userId) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'ID do usuário não fornecido.'
            });
        }

        // Query completa com JOINS para buscar todos os dados necessários
        const sql = `
            SELECT 
                u.user_id,
                u.user_nome,
                u.user_email,
                u.user_telefone,
                u.user_tipo,
                u.user_push_token,
                u.user_data_cadastro,
                ua.userap_id,
                a.ap_id,
                a.ap_numero,
                a.ap_andar,
                b.bloc_id,
                b.bloc_nome,
                c.cond_id,
                c.cond_nome,
                c.cond_endereco,
                c.cond_cidade,
                c.cond_estado
            FROM usuarios u
            LEFT JOIN usuario_apartamentos ua ON u.user_id = ua.user_id
            LEFT JOIN apartamentos a ON ua.ap_id = a.ap_id
            LEFT JOIN bloco b ON a.bloco_id = b.bloc_id
            LEFT JOIN condominio c ON b.cond_id = c.cond_id
            WHERE u.user_id = ?
            LIMIT 1
        `;

        const [rows] = await bd.query(sql, [userId]);

        if (rows.length === 0) {
            return response.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado.'
            });
        }

        const perfil = rows[0];
        
        // Remove senha se existir (segurança)
        if (perfil.user_senha) delete perfil.user_senha;

        return response.status(200).json({
            sucesso: true,
            mensagem: 'Perfil do usuário carregado com sucesso.',
            dados: perfil
        });

    } catch (error) {
        console.error('❌ Erro ao buscar perfil completo:', error);
        return response.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar perfil completo.',
            erro: error.message
        });
    }
},

    async cadastrarUsuario (request, response){
        try{
            const { user_nome, user_email, user_telefone, user_senha, user_tipo } = request.body;
            
            // --- MUDANÇA: Adicionamos o user_push_token como nulo ---
            // Isso garante que o campo seja preenchido no banco de dados.
            const user_push_token = null; 

            if (user_tipo === 'ADM') {
                return response.status(403).json({
                    sucesso: false,
                    nmensagem: 'A criação de novos administradores não é permitida.'
                });
            }

            // --- MUDANÇA: Adicionamos a nova coluna no INSERT ---
            const sql = `
                INSERT INTO usuarios (user_nome, user_email, user_telefone, user_senha, user_tipo, user_push_token)
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            
            // --- MUDANÇA: Adicionamos o valor nulo no array de valores ---
            const values = [user_nome, user_email, user_telefone, user_senha, user_tipo, user_push_token];
            const [result] = await bd.query(sql, values);
            
            const dados = {
                user_id: result.insertId,
                user_nome,
                user_email,
                user_tipo,
            };            

            return response.status(201).json({
                sucesso: true,
                nmensagem: 'Usuário cadastrado com sucesso.',
                dados: dados
            });
        } catch (error){
            // Log do erro no console da API para depuração
            console.error("Erro no controller ao cadastrar:", error); 
            return response.status(500).json({
                sucesso: false,
                nmensagem: 'Erro ao cadastrar usuário.',
                dados: error.message
            });
        }
    },

    async editarUsuario(request, response) {
        try {
          const { id } = request.params;
          const { user_nome, user_email, user_telefone, user_senha, user_tipo } = request.body;

          if (user_tipo === 'ADM') {
              return response.status(403).json({
                  sucesso: false,
                  nmensagem: 'Não é permitido alterar um usuário para o tipo ADM.'
              });
          }
      
          let sql;
          let values;
          // Se uma nova senha foi enviada, o SQL inclui o campo da senha
          if (user_senha) {
            sql = `UPDATE usuarios SET user_nome = ?, user_email = ?, user_telefone = ?, user_senha = ?, user_tipo = ? WHERE user_id = ?`;
            values = [user_nome, user_email, user_telefone, user_senha, user_tipo, id];
          } else { // Senão, o SQL não mexe na senha atual
            sql = `UPDATE usuarios SET user_nome = ?, user_email = ?, user_telefone = ?, user_tipo = ? WHERE user_id = ?`;
            values = [user_nome, user_email, user_telefone, user_tipo, id];
          }
      
          const [result] = await bd.query(sql, values);
      
          if (result.affectedRows === 0) {
            return response.status(404).json({
              sucesso: false,
              nmensagem: 'Usuário não encontrado para atualizar.',
            });
          }
      
          return response.status(200).json({
            sucesso: true,
            nmensagem: 'Usuário atualizado com sucesso.',
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
          const [result] = await bd.query(sql, [id]);
      
          if (result.affectedRows === 0) {
            return response.status(404).json({
              sucesso: false,
              nmensagem: 'Usuário não encontrado para deletar.',
            });
          }
      
          return response.status(200).json({
            sucesso: true,
            nmensagem: 'Usuário deletado com sucesso.',
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
                    Usuario_Apartamentos ua ON u.user_id = ua.user_id
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