const bd = require('../dataBase/connection');

module.exports = {
    async listargerenciamento (request, response){
        try {
            const sql = `
                SELECT ger_id, cond_id, ger_data, ger_descricao, ger_valor
                FROM gerenciamento;
            `;
            const [rows] = await bd.query(sql);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de gerenciamento.',
                itens: rows.length,
                dados: rows
            })
        }catch (error) {
            return response.status(550).json({
                sucesso: false,
                mensagem: 'Erro na listagem de gerenciamento.',
                dados: error.message
            });
        }
    },
    async cadrastogerenciamento (request, response){
        try{
           const { cond_id, ger_data, ger_descricao, ger_valor } = request.body;
           const ger_ativo = 1;

           // instrução SQL
           const sql = `
           INSERT INTO gerenciamento
               (cond_id, ger_data, ger_descricao, ger_valor)
           VALUES 
               (?, ?, ?, ?);
       `;


           // definição dos dados a serem inseridos em um array
           const values = [cond_id, ger_data, ger_descricao, ger_valor];

           //execução da instrução sql passando os parâmetros
           const [result] = await bd.query(sql, values);

           //Identificação do ID do registro inserido 
           const dados = {
            id: result.insertId,
            cond_id,
            ger_data,
            ger_descricao,
            ger_valor
        };
        return response.status(200).json({
            sucesso: true,
            mensagem: 'Cadastro de gerenciamento realizado.',
            dados: dados
        });
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                mensagem: 'Erro ao cadastrar de gerenciamento.',
                dados: error.message
             });
        }
    },
    async editargerenciamento (request, response){
        try{    //parâmetros recebidos pelo corpo da requisição 
                const { cond_id, ger_data, ger_descricao, ger_valor } = request.body;
                //parâmetro recebido pela URL via params ex: /usuario/1
                const { id } = request.params;
                // instrução SQL
                const sql = `
                 UPDATE gerenciamento
                 SET cond_id = ?, ger_data = ?, ger_descricao = ?, ger_valor = ?
                 WHERE ger_id = ?
                 `;
               //preparo do array com dados que serão atualizados 
               const values = [cond_id, ger_data, ger_descricao, ger_valor, id];
               //execução e obtenção de confirmação da atualização realizada
               const [result] = await bd.query(sql, values);

               // Verifica se alguma linha foi afetada
        if (result.affectedRows === 0) {
            return response.status(404).json({
                sucesso: false,
                mensagem: `Gerenciamento com ID ${id} não encontrado!`,
                dados: null
            });
        }

        // Dados retornados para o frontend
        const dados = {
            id,
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
    async apagargerenciamto (request, response){
        try{
         return response.status(200).json({
                sucesso: true,
                mensagem: 'Apagar condominio.',
                dados: null
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                mensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    },
}       