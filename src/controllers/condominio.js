const bd = require('../dataBase/connection');

module.exports = {
    async listarcondominio (request, response){
        try{

         const sql = `
             SELECT cond_id, cond_nome, cond_endereco,
              cond_cidade FROM Condominio;
         `;
         const [row] = await bd.query(sql);
         const nItens = row.length;

         return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de condominio.',
                nItens,
                dados: row
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
           const cond_id = 1;

           // instrução SQL
           const sql = `
               INSERT INTO cond 
                    (cond_nome, cond_endereco, cond_cidade)
               VALUES 
               (?, ?, ?);
           `;

           // definição dos dados a serem inseridos em um array
           const values = [nome]

         return response.status(200).json({
                sucesso: true,
                mensagem: 'Cadrasto condominio.',
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