const db = require('../dataBase/connection');

module.exports = {
    async listarreservas_ambientes(request, response) {
        try {
            const sql = `
                SELECT res_id, userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva 
                FROM reservas_ambientes;
            `;

            const [rows] = await db.query(sql);
            const nItens = rows.length;

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Lista de reservas_ambientes.',
                nItens,
                dados: rows
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro na listagem de reservas_ambientes.',
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
            const { userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva } = request.body;
            const { id } = request.params;

            const sql = `
                UPDATE reservas_ambientes 
                SET userap_id = ?, amd_id = ?, res_horario_inicio = ?, res_horario_fim = ?, res_status = ?, res_data_reserva = ? 
                WHERE res_id = ?;
            `;

            const values = [userap_id, amd_id, res_horario_inicio, res_horario_fim, res_status, res_data_reserva, id];
            const [result] = await db.query(sql, values);

            if (result.affectedRows === 0) {
                return response.status(404).json({
                    sucesso: false,
                    mensagem: `Reserva com ID ${id} não encontrada.`,
                    dados: null
                });
            }

            const dados = {
                res_id: id,
                userap_id,
                amd_id,
                res_horario_inicio,
                res_horario_fim,
                res_status,
                res_data_reserva
            };

            return response.status(200).json({
                sucesso: true,
                mensagem: `Reserva ${id} atualizada com sucesso.`,
                dados
            });
        } catch (error) {
            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao editar reserva_ambientes.',
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
