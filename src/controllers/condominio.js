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
    },
    async cadrastacondominio (request, response){
        try{
         return response.status(200).json({
                sucesso: true,
                nmensagem: 'Cadrasto condominio.',
                dados: null
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    },
    async editarcondominio (request, response){
        try{
         return response.status(200).json({
                sucesso: true,
                nmensagem: 'Editar condominio.',
                dados: null
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    },
    async apagarcondominio (request, response){
        try{
         return response.status(200).json({
                sucesso: true,
                nmensagem: 'Apagar condominio.',
                dados: null
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                nmensagem: 'Erro na listagem de condominio.',
                dados: error.message
             });

        }
    },
}