const db = require('../dataBase/connection');
const { v4: uuidv4 } = require('uuid'); // Importe uma biblioteca para gerar IDs únicos

module.exports = {

  /**
   * NOVO MÉTODO - Lista visitantes relevantes para o Dashboard.
   * Pega apenas quem está 'Aguardando' ou 'Entrou'.
   */
  async listarVisitantesParaDashboard(request, response) {
    try {
      const sql = `
        SELECT 
          vst_id, 
          vst_nome, 
          vst_status,
          vst_data_entrada,
          vst_data_saida
        FROM Visitantes 
        WHERE vst_status IN ('Aguardando', 'Entrou')
        ORDER BY 
          CASE 
            WHEN vst_status = 'Aguardando' THEN 1
            WHEN vst_status = 'Entrou' THEN 2
            ELSE 3
          END, 
          vst_data_entrada DESC, 
          vst_id DESC
        LIMIT 10;
      `;
      
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        message: "Lista de visitantes para o dashboard.",
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        message: "Erro no servidor ao buscar visitantes para o dashboard.",
        dados: error.message,
      });
    }
  },

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
   * FUNÇÃO ADICIONADA: Notifica um morador sobre um visitante inesperado.
   */
  async notificarVisitanteInesperado(request, response) {
    try {
        const { userap_id } = request.params;
        const { vst_nome } = request.body;

        if (!vst_nome) {
            return response.status(400).json({ sucesso: false, message: "O nome do visitante é obrigatório." });
        }

        const sql = `
            SELECT u.user_push_token, u.user_nome
            FROM Usuario_Apartamentos ua
            JOIN Usuarios u ON ua.user_id = u.user_id
            WHERE ua.userap_id = ?;
        `;
        const [rows] = await db.query(sql, [userap_id]);

        if (rows.length === 0 || !rows[0].user_push_token) {
            return response.status(404).json({ sucesso: false, message: "Morador não encontrado ou não possui dispositivo para notificações." });
        }

        const pushToken = rows[0].user_push_token;
        if (!Expo.isExpoPushToken(pushToken)) {
            return response.status(400).json({ sucesso: false, message: "Token de notificação inválido." });
        }

        const message = {
            to: pushToken,
            sound: 'default',
            title: 'Visitante na Portaria',
            body: `${vst_nome} solicita acesso à sua unidade.`,
            data: { vst_nome: vst_nome, userap_id: userap_id },
        };

        await expo.sendPushNotificationsAsync([message]);

        // Opcional: Registrar na tabela de Notificações
        const not_titulo = 'Visitante na Portaria';
        const not_mensagem = `${vst_nome} solicita acesso. Autorize ou negue pelo aplicativo.`;
        const insertNotificacaoSql = `
            INSERT INTO Notificacoes (userap_id, not_titulo, not_mensagem, not_data_envio, not_tipo, not_prioridade)
            VALUES (?, ?, ?, NOW(), 'Aviso', 'Alta');
        `;
        await db.query(insertNotificacaoSql, [userap_id, not_titulo, not_mensagem]);

        return response.status(200).json({ sucesso: true, message: `Notificação enviada com sucesso para o morador.` });
    } catch (error) {
        return response.status(500).json({ sucesso: false, message: "Erro ao enviar notificação de visitante.", dados: error.message });
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