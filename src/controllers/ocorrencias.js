const db = require('../dataBase/connection');

module.exports = {
    // FUNÇÃO PARA O SÍNDICO (WEB) - Lista tudo
    async listarTodasOcorrencias(request, response) {
        try {
            const sql = `
                SELECT 
                    oco_id, userap_id, oco_protocolo, oco_categoria, oco_descricao, 
                    oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem
                FROM ocorrencias;
            `;

            const [rows] = await db.query(sql);
            
            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de todas as ocorrências.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar ocorrências.',
                dados: error.message
            });
        }
    },

    // FUNÇÃO PARA O MORADOR (APP) - Lista por userap_id
    async listarOcorrenciasDoMorador(request, response) {
        try {
            const { userap_id } = request.params; // Pega o ID da URL

            const sql = `
                SELECT 
                    oco_id, userap_id, oco_protocolo, oco_categoria, oco_descricao, 
                    oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem
                FROM ocorrencias
                WHERE userap_id = ?;
            `;
            
            const values = [userap_id];
            const [rows] = await db.query(sql, values);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de ocorrências do morador.',
                nItens: rows.length,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao listar ocorrências do morador.',
                dados: error.message
            });
        }
    },


    // CADASTRAR
// ... (dentro de module.exports)

    async cadastrarocorrencias(request, response) {
        try {
            // 1. Pega os dados enviados pelo aplicativo. Note que não pegamos mais o 'oco_protocolo'.
            const { userap_id, oco_categoria, oco_descricao, oco_localizacao, oco_prioridade, oco_imagem } = request.body;
            const anoAtual = new Date().getFullYear();

            // 2. Busca no banco de dados para descobrir o número da última ocorrência do ano.
            const sqlBusca = `
                SELECT COUNT(*) as total_no_ano FROM ocorrencias 
                WHERE YEAR(oco_data) = ?;
            `;
            const [resultadoBusca] = await db.query(sqlBusca, [anoAtual]);
            const proximoNumero = resultadoBusca[0].total_no_ano + 1;

            // 3. Formata o novo protocolo com 4 dígitos (ex: 0001, 0015, etc.)
            const protocoloFormatado = `OCO-${anoAtual}-${proximoNumero.toString().padStart(4, '0')}`;

            // 4. Insere a ocorrência no banco com o protocolo gerado pela API.
            const sqlInsert = `
                INSERT INTO ocorrencias 
                (userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem)
                VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?);
            `;
            // Usamos NOW() para pegar a data e hora exatas do servidor.

            const values = [userap_id, protocoloFormatado, oco_categoria, oco_descricao, oco_localizacao, "Aberta", oco_prioridade, oco_imagem];

            const [result] = await db.query(sqlInsert, values);

            // 5. Retorna a resposta de sucesso com todos os dados, incluindo o novo protocolo.
            const dados = {
                oco_id: result.insertId,
                userap_id,
                oco_protocolo: protocoloFormatado, // Retorna o protocolo que foi gerado
                oco_categoria,
                oco_descricao,
                oco_localizacao,
                oco_data: new Date(), // Retorna a data atual
                oco_status: "Aberta",
                oco_prioridade,
                oco_imagem
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Ocorrência cadastrada com sucesso.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no cadastro de ocorrências.',
                dados: error.message
            });
        }
    },

    // ... (suas outras funções, como listar, editar, etc., continuam aqui)

    // EDITAR
    // EDITAR
    async editarocorrencias(request, response) {
        try {
            const { id } = request.params;
            const updatedFields = request.body;

            // Construir a parte SET da consulta SQL dinamicamente
            const fieldsToUpdate = Object.keys(updatedFields);
            if (fieldsToUpdate.length === 0) {
                return response.status(400).json({
                    sucesso: false,
                    mensagem: "Nenhum campo para atualizar foi fornecido.",
                    dados: null
                });
            }

            const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
            const values = fieldsToUpdate.map(field => updatedFields[field]);

            const sql = `
                UPDATE ocorrencias
                SET ${setClause}
                WHERE oco_id = ?;
            `;

            values.push(id);

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Ocorrência com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            // Apenas retorna os campos atualizados para evitar a necessidade de outra busca
            const dados = { oco_id: id, ...updatedFields };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ocorrência ${id} atualizada com sucesso.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao editar ocorrência.',
                dados: error.message
            });
        }
    },

    // APAGAR
    async apagarocorrencias(request, response) {
        try {
            const { id } = request.params;

            const sql = `DELETE FROM ocorrencias WHERE oco_id = ?`;
            const values = [id];

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Ocorrência com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Ocorrência ${id} excluída com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao apagar ocorrência.',
                dados: error.message
            });
        }
    },
};

// Adicione este bloco no final do arquivo
const express = require('express');
const router = express.Router();

// A rota GET que o seu frontend precisa
router.get('/ocorrencias', module.exports.listarTodasOcorrencias);

module.exports.router = router;
