const bd = require('../dataBase/connection');

module.exports = {
    async listarcondominio (request, response) {
    try {
        const sql = `
            SELECT cond_id, cond_nome, cond_endereco,
                   cond_cidade, cond_estado
            FROM condominio;
        `;
        const [rows] = await bd.query(sql);

        return response.status(200).json({
            sucesso: true,
            mensagem: 'Lista de condomínios.',
            itens: rows.length,
            dados: rows
        });
    } catch (error) {
        return response.status(500).json({
            sucesso: false,
            mensagem: 'Erro na listagem de condomínios.',
            dados: error.message
        });
        }
    },
    async cadastrarcondominio (request, response){
        try{
           const { nome, endereco, cidade, estado} = request.body;

           // instrução SQL
           const sql = `
               INSERT INTO condominio
                    (cond_nome, cond_endereco, cond_cidade, cond_estado)
               VALUES 
               (?, ?, ?, ?);
           `;

           // definição dos dados a serem inseridos em um array
           const values = [ nome, endereco, cidade, estado ];

           //execução da instrução sql passando os parâmetros
           const [result] = await bd.query(sql, values);

           //Identificação do ID do registro inserido 
           const dados = {
            id: result.insertId,
            nome,
            endereco,
            cidade,
            estado
           };

         return response.status(200).json({
                sucesso: true,
                mensagem: 'Condominio cadastrado com sucesso.',
                dados: dados
             })
        }catch (error){
            return response.status(550).json({
                sucesso: false,
                mensagem: 'Erro no cadastro de condominio.',
                dados: error.message
             });

        }
    },
    async editarcondominio (request, response){
        try{
            //parâmetros recebidos pelo corpo da requisição 
            const {  nome, endereco, cidade, estado} = request.body;
            //parâmetro recebido pela URL via params ex: /usuario/1
            const { id } = request.params;
            // instrução SQL
            const sql = `
               UPDATE condominio SET cond_nome = ?, cond_endereco = ?, cond_cidade = ?, cond_estado = ?
               WHERE cond_id = ?
           `;
           //preparo do array com dados que serão atualizados 
           const values = [nome, endereco, cidade, estado, id];
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
    async apagarcondominio(request, response) {
        try {
            // parâmetro passado via URL na chamada da API pelo front-end
            const { id } = request.params;
    
            // comando de exclusão
            const sql = 'DELETE FROM condominio WHERE cond_id = ?';
    
            // array com parâmetros da exclusão
            const values = [id];
    
            // executa a instrução no banco de dados
            const [result] = await bd.query(sql, values);
    
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
    async filtrarCondominios(request, response) {
        try {
            const {nome} = request.query;

            let sql = 'SELECT * FROM condominio WHERE 1=1';
            const params = [];

            if (nome) {
                sql += 'AND cond_nome LIKE ?';
                params.push(`%${nome}%`);
            }
            const [rows] = await db.query(sql, params);
             
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Condomínios filtrados com sucesso!',
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mansagem: 'Erro ao filtrar condomínios.',
                dados: error.message
            });
        }
    }
};       