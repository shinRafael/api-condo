const bd = require('../dataBase/connection');

module.exports = {
    async listarcondominio (request, response){
        try{
         return response.status(200).json({
                sucesso: true,
                nmensagem: 'Lista de condominio.',
                dados: null
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    }
}