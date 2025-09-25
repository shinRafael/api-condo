const db = require('../dataBase/connection');
const { v4: uuidv4 } = require('uuid'); // Importe uma biblioteca para gerar IDs únicos

module.exports = {
  /**
   * Lista todas as autorizações de visitantes. No futuro, pode ser filtrado por status ou data.
   */
  async listarVisitantes(request, response) {
    try {
      const sql = `
        SELECT 
          vst_id, 
          userap_id,
          vst_nome, 
          vst_documento, 
          vst_validade_inicio, 
          vst_validade_fim, 
          vst_status,
          vst_data_entrada,
          vst_data_saida
        FROM Visitantes 
        ORDER BY vst_validade_inicio DESC;
      `;
      
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        message: "Lista de autorizações de visitantes recuperada com sucesso.",
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        message: "Erro no servidor.",
        dados: error.message,
      });
    }
  },

  /**
   * Cadastra uma NOVA autorização de visitante (pré-cadastro pelo morador).
   */
  async cadastrarAutorizacao(request, response) {
    try {
      // Recebe os dados do app do morador
      const { 
        userap_id, 
        vst_nome, 
        vst_documento, 
        vst_validade_inicio, 
        vst_validade_fim 
      } = request.body;

      // Validação dos dados
      if (!userap_id || !vst_nome || !vst_validade_inicio || !vst_validade_fim) {
        return response.status(400).json({
          sucesso: false,
          message: "Campos obrigatórios não foram preenchidos.",
        });
      }

      // Gera um hash único para o QR Code
      const vst_qrcode_hash = uuidv4();

      const sql = `
        INSERT INTO Visitantes (userap_id, vst_nome, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      
      const values = [userap_id, vst_nome, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash];
      const [result] = await db.query(sql, values);

      const dados = {
        vst_id: result.insertId,
        vst_nome,
        vst_qrcode_hash // Retorna o hash para o app gerar o QR Code
      };

      return response.status(201).json({
        sucesso: true,
        message: "Autorização de visitante cadastrada com sucesso.",
        dados
      });

    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        message: "Erro no servidor ao cadastrar autorização.",
        dados: error.message,
      });
    }
  },

  /**
   * Registra a ENTRADA de um visitante (usado pela portaria).
   */
  async registrarEntrada(request, response) {
    try {
        const { id } = request.params; // vst_id

        const sql = `
            UPDATE Visitantes
            SET 
                vst_status = 'Entrou',
                vst_data_entrada = NOW()
            WHERE vst_id = ? AND vst_status = 'Aguardando'; 
        `;
        
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return response.status(404).json({
                sucesso: false,
                message: `Autorização ${id} não encontrada ou visitante já entrou.`,
            });
        }

        return response.status(200).json({ 
            sucesso: true,
            message: `Entrada do visitante registrada com sucesso!`, 
        });

    } catch (error) {
        return response.status(500).json({
            sucesso: false,
            message: "Erro no servidor ao registrar entrada.",
            dados: error.message,
        });
    }
  },

  /**
   * Registra a SAÍDA de um visitante (usado pela portaria).
   */
  async registrarSaida(request, response) {
    try {
        const { id } = request.params; // vst_id

        const sql = `
            UPDATE Visitantes
            SET 
                vst_status = 'Finalizado',
                vst_data_saida = NOW()
            WHERE vst_id = ? AND vst_status = 'Entrou';
        `;
        
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return response.status(404).json({
                sucesso: false,
                message: `Autorização ${id} não encontrada ou visitante não havia registrado entrada.`,
            });
        }

        return response.status(200).json({ 
            sucesso: true,
            message: `Saída do visitante registrada com sucesso!`, 
        });
        
    } catch (error) {
        return response.status(500).json({
            sucesso: false,
            message: "Erro no servidor ao registrar saída.",
            dados: error.message,
        });
    }
  },

  /**
   * Cancela uma autorização de visitante (usado pelo morador).
   */
  async cancelarAutorizacao(request, response) {
    try {
      const { id } = request.params; // vst_id

      const sql = `
        UPDATE Visitantes
        SET vst_status = 'Cancelado'
        WHERE vst_id = ? AND vst_status = 'Aguardando';
      `;
      
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          message: `Autorização ${id} não encontrada ou não pode mais ser cancelada.`,
        });
      }

      return response.status(200).json({ 
        sucesso: true,
        message: `Autorização ${id} cancelada com sucesso!`, 
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        message: "Erro no servidor ao cancelar autorização.",
        dados: error.message,
      });
    }
  },
};