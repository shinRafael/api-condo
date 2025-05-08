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
            //parâmetros recebidos pelo corpo da requisição 
            const {  nome, endereco, cidade } = request.body;
            //parâmetro recebido pela URL via params ex: /usuario/1
            const { id } = request.params;
            // instrução SQL
            const sql = `
               UPDATE condominio SET cond_nome = ?, cond_endereco = ?, cond_cidade = ?
               WHERE cond_id = ?
           `;
           //preparo do array com dados que serão atualizados 
           const values = [nome, endereco, cidade, id];
           //execução e obtenção de confirmação da atualização realizada
           const atualizaDados = await bd.query(sql, values);
        

         return response.status(200).json({
                sucesso: true,
                mensagem: `Usuário ${id} atualizado com sucesso!`,
                dados: atualizaDados[0].affectedRows
                //mensSql: atualizaDados
             });
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                mensagem: 'Erro na requisição.',
                dados: error.message
             });

        }
    },
    async apagarCondominio(request, response) {
        try {
            // parâmetro passado via URL na chamada da API pelo front-end
            const { id } = request.params;
    
            // comando de exclusão
            const sql = 'DELETE FROM condominio WHERE cond_id = ?';
    
            // array com parâmetros da exclusão
            const values = [id];
    
            // executa a instrução no banco de dados
            const [result] = await db.query(sql, values);
    
            // se nenhum registro foi afetado, condomínio não existe
            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Condomínio ${id} não encontrado!`,
                    dados: null
                });
            }
    
            // sucesso na exclusão
            return response.status(200).json({
                sucesso: true,
                mensagem: `Condomínio ${id} excluído com sucesso`,
                dados: null
            });
    
        } catch (error) {
            // erro interno
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na requisição.',
                dados: error.message
            });
        }
    },
}       