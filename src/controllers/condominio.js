const bd = require('../dataBase/connection');

module.exports = {
    async listarcondominio (request, response){
        try{

         const sql = `
             SELECT cond_id, cond_nome, cond_endereco,
              cond_cidade FROM Condominio;
         `;
         const [rows] = await bd.query(sql);

         return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de condominio.',
                itens: rows.length, 
                dados: rows
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    },
    async cadrastocondominio (request, response){
        try{
           const { nome, endereco, cidade } = request.body;
           const cond_ativo = 1;

           // instrução SQL
           const sql = `
               INSERT INTO condominio
                    (cond_nome, cond_endereco, cond_cidade)
               VALUES 
               (?, ?, ?);
           `;

           // definição dos dados a serem inseridos em um array
           const values = [ nome, endereco, cidade];

           //execução da instrução sql passando os parâmetros
           const [result] = await bd.query(sql, values);

           //Identificação do ID do registro inserido 
           const dados = {
            id: result.insertId,
            nome,
            endereco,
            cidade
           };

         return response.status(200).json({
                sucesso: true,
                mensagem: 'Cadrasto condominio.',
                dados: dados
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                mensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    },
    async editarcondominio (request, response){
        try{
         return response.status(200).json({
                sucesso: true,
                mensagem: 'Editar condominio.',
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
    async apagarcondominio (request, response){
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