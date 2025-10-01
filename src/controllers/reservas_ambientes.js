const db = require('../dataBase/connection');

module.exports = {
    async listarreservas_ambientes(request, response) {
        try {
            const sql = `
                SELECT 
                    res.*, 
                    amb.amd_nome 
                FROM 
                    reservas_ambientes res
                INNER JOIN 
                    ambientes amb ON res.amd_id = amb.amd_id;
            `;
            const [dados] = await db.query(sql);

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de reservas de ambientes.',
                dados: dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na requisição.',
                dados: error.message
            });
        }
    },

    async cadastrarreservas_ambientes(request, response) {
        try {
            const { userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva } = request.body;

            const sql = `
                INSERT INTO reservas_ambientes 
                (userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva)
                VALUES (?, ?, ?, ?, ?, ?);
            `;

            const values = [userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva];

            const [result] = await db.query(sql, values);

            const dados = {
                res_id: result.insertId,
                userap_id,
                amd_id,
                res_horario_inicio,
                res_horario_fim,
                res_status,
                res_data_reserva,
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Reserva cadastrada com sucesso.',
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro no cadastro de reservas_ambientes.',
                dados: error.message
            });
        }
    },

    async editarreservas_ambientes(request, response) {
    try {
        const { id } = request.params;
        const camposParaAtualizar = request.body; // Pega tudo que foi enviado no corpo (ex: { "res_status": "Cancelado" })

        // Validação para garantir que algo foi enviado para atualização
        if (Object.keys(camposParaAtualizar).length === 0) {
            return response.status(400).json({
                sucesso: false,
                mensagem: "Nenhum campo para atualizar foi fornecido.",
            });
        }

        // Monta a query SQL dinamicamente
        // Ex: "SET res_status = ?, res_data_reserva = ?"
        const campos = Object.keys(camposParaAtualizar).map(chave => `${chave} = ?`).join(', ');
        const valores = Object.values(camposParaAtualizar);

        const sql = `UPDATE reservas_ambientes SET ${campos} WHERE res_id = ?;`;
        
        // Adiciona o ID ao final do array de valores para o "WHERE"
        valores.push(id);

        const [result] = await db.query(sql, valores);

        if (result.affectedRows === 0) {
            return response.status(404).json({
                sucesso: false,
                mensagem: `Reserva com ID ${id} não encontrada.`,
            });
        }

        return response.status(200).json({
            sucesso: true,
            mensagem: `Reserva ${id} atualizada com sucesso.`,
        });

    } catch (error) {
        console.error("Erro no controller ao editar reserva:", error); // Log do erro no console da API
        return response.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao editar reserva.',
            dados: error.message
        });
    }
},
    async apagarreservas_ambientes(request, response) {
        try {
            const { id } = request.params;

            const sql = `DELETE FROM reservas_ambientes WHERE res_id = ?`;
            const values = [id];

            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Reserva com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            return response.status(200).json({
                sucesso: true,
                mensagem: `Reserva ${id} excluída com sucesso.`,
                dados: null
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao apagar reserva_ambientes.',
                dados: error.message
            });
        }
    },
};

// Adicione este bloco no final do arquivo
const express = require('express');
const router = express.Router();

// A rota GET que o seu frontend precisa
router.get('/reservas_ambientes', module.exports.listarreservas_ambientes);

// Para usar, você precisará exportar o router.
// A forma mais simples é adicionar o router ao module.exports
module.exports.router = router;



    // //async filtrarreservas_ambientes (request, response) {
    //     try {
    //         const sql = `
    //         SELECT res_id, userap_id, amb_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva FROM Reservas_Ambientes;
    //     `;

    //     const valueCheck = [produto, ingrediente];
    //     const [check] = await bd.query(sqlCheck, valueCheck);

    //     if (check.length > 0) {
    //         return response.status(409).json({
    //             sucesso: false,
    //             mensagem: 'Este ingrediente já está relacionado a este produto.',
    //             dados: null
    //         });
    //     }
    //     }
    // },
