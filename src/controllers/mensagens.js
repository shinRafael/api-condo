const db = require('../database/connection');

module.exports = {
    async listamensagens (request, response) {
        try {

            const sql = `SELECT
             msg_id, cond_id, userap_id, msg_mensagem,
             msg_data_envio, msg_status
             FROM mensagens;
             `;
            

             const [row] = await db.query(sql);
             const nItens = row.lenght;

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de mensagens.',
                nItens,
                dados: row
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de mensagens.',
                dados: error.message
            
            });
        }   
    },

    async cadastrarmensagens (request, response) {
        try {
            const { cond, userap, mensagem, dt_envio, msg_status} = request.body;
            const msg_ativa = 1;

            //introdução SQL
            const sql = `
            INSERT INTO mensagens
             (cond_id, userap_id, msg_mensagem, msg_data_envio, msg_status)
             VALUES
                (?, ?, ?, ?, ? );
             `;

             // definição dos dados a serem inseridos em um array
             const values = [cond, userap, mensagem, dt_envio, msg_status];
             
             //execução da instrução sql passando os parametros
             const [result] = await db.query(sql,values);

             // indentificação do ID do registro inserido
             const dados = {
                id: result.insertID,
                cond,
                userap,
                mensagem,   
                dt_envio,
                msg_status
             }
             

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Cadastrar mensagens.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de mensagens.',
                dados: error.message
            
            });
        }   
    },

    async editarmensagens (request, response) {
        try {
            const { cond, userap, mensagem, dt_envio, msg_status} = request.body;

            const { id } = request.params;

            const sql = `
            UPDATE mensagens SET
                cond_id = ?, userap_id = ?, msg_mensagem = ?, msg_data_envio = ?, msg_status = ?
            WHERE 
                msg_id = ?;
            `;

            const values = [cond, userap, mensagem, dt_envio, msg_status, id];
            
            const [result] = await db.query(sql, values);

            if  (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Mensagem ${id} não encontrada.`,
                    dados: null
                });
            }

            const dados = {
                cond,
                userap,
                mensagem,
                dt_envio,
                msg_status
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Mensagem ${id} editada com sucesso.`,
                dados
            });

        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na Listagem de mensagens.',
                dados: error.message
            
            });
        }   
    },
    async apagarmensagens (request, response) {
        try {
            const { id } = request.params;
            const sql = `DELETE FROM mensagens WHERE msg_id = ?;`;
            const values = [id];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Mensagem ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Mensagem ${id} apagada com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na requisição de mensagens.',
                dados: error.message
            
            });
        }   
    },
}

  
