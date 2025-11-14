// ===============================================================
// 🧩 controllers/visitantes.js — versão final CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');
const { randomUUID } = require('crypto');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const { notificarVisitanteAutorizado, notificarVisitanteChegou } = require('../helpers/notificationHelper');

// ===============================================================
// 🔧 Função auxiliar — formata telefones no padrão brasileiro
// ===============================================================
function formatarTelefone(telefone) {
  if (!telefone) return null;
  const numeroLimpo = telefone.replace(/\D/g, '');
  if (numeroLimpo.length === 11) {
    return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7)}`;
  }
  return telefone;
}

// ===============================================================
// 🧩 Controlador principal
// ===============================================================
module.exports = {

  // =============================================================
  // 📋 1. LISTAR VISITANTES (morador)
  // =============================================================
  async listarvisitantes(request, response) {
    try {
      const sql = `
        SELECT 
          v.vst_id AS id,
          v.vst_nome AS nome,
          v.vst_celular AS celular,
          v.vst_documento AS documento,
          v.vst_status AS status,
          v.vst_validade_inicio AS validadeInicio,
          v.vst_validade_fim AS validadeFim,
          a.ap_numero AS unidade,
          u.user_nome AS morador
        FROM visitantes v
        JOIN usuario_apartamentos ua ON v.userap_id = ua.userap_id
        JOIN usuarios u ON ua.user_id = u.user_id
        JOIN apartamentos a ON ua.ap_id = a.ap_id
        ORDER BY v.vst_validade_inicio DESC;
      `;
      
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: "Lista de autorizações de visitantes recuperada com sucesso.",
        nItens: rows.length,
        dados: rows
      });
    } catch (error) {
      console.error("❌ Erro ao listar visitantes:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao listar visitantes.",
        dados: error.message
      });
    }
  },

  // =============================================================
  // 📊 2. LISTAR VISITANTES PARA DASHBOARD (portaria / gestão)
  // =============================================================
  async listarvisitantesdashboard(request, response) {
    try {
      const sql = `
        SELECT 
          v.vst_id AS id,
          v.vst_nome AS nome,
          v.vst_status AS status,
          v.vst_data_entrada AS dataEntrada,
          v.vst_data_saida AS dataSaida,
          a.ap_numero AS unidade,
          u.user_nome AS morador
        FROM visitantes v
        JOIN usuario_apartamentos ua ON v.userap_id = ua.userap_id
        JOIN usuarios u ON ua.user_id = u.user_id
        JOIN apartamentos a ON ua.ap_id = a.ap_id
        WHERE v.vst_status IN ('Aguardando', 'Entrou')
        ORDER BY 
          CASE 
            WHEN v.vst_status = 'Aguardando' THEN 1
            WHEN v.vst_status = 'Entrou' THEN 2
            ELSE 3
          END,
          v.vst_data_entrada DESC,
          v.vst_id DESC
        LIMIT 20;
      `;

      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: "Lista de visitantes para o dashboard.",
        dados: rows
      });
    } catch (error) {
      console.error("❌ Erro ao listar visitantes do dashboard:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao buscar visitantes para o dashboard.",
        dados: error.message
      });
    }
  },

  // =============================================================
  // 🧾 3. CADASTRAR AUTORIZAÇÃO (morador)
  // =============================================================
  async cadastravisitante(request, response) {
    try {
      const { userap_id, vst_nome, vst_celular, vst_documento, vst_validade_inicio, vst_validade_fim } = request.body;

      if (!userap_id || !vst_nome || !vst_validade_inicio || !vst_validade_fim) {
        return response.status(400).json({ sucesso: false, mensagem: "Campos obrigatórios não foram preenchidos." });
      }

      const celularFormatado = formatarTelefone(vst_celular);
      const vst_qrcode_hash = randomUUID();

      const sql = `
        INSERT INTO visitantes (userap_id, vst_nome, vst_celular, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash, vst_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Aguardando');
      `;
      
      const [result] = await db.query(sql, [
        userap_id, vst_nome, celularFormatado, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash
      ]);

      // 🔔 Notificar morador sobre visitante autorizado
      await notificarVisitanteAutorizado(userap_id, vst_nome, vst_validade_fim);

      return response.status(201).json({
        sucesso: true,
        mensagem: "Autorização de visitante cadastrada com sucesso.",
        dados: {
          id: result.insertId,
          nome: vst_nome,
          celular: celularFormatado,
          qrcode: vst_qrcode_hash
        }
      });

    } catch (error) {
      console.error("❌ Erro ao cadastrar visitante:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao cadastrar autorização.",
        dados: error.message
      });
    }
  },

  // =============================================================
  // 🔔 4. NOTIFICAR VISITANTE INESPERADO (portaria)
  // =============================================================
  async notificarvisitante(request, response) {
    try {
      const { userap_id } = request.params;
      const { vst_nome } = request.body;

      if (!vst_nome) {
        return response.status(400).json({ sucesso: false, mensagem: "O nome do visitante é obrigatório." });
      }

      const sql = `
        SELECT u.user_push_token, u.user_nome
        FROM usuario_apartamentos ua
        JOIN usuarios u ON ua.user_id = u.user_id
        WHERE ua.userap_id = ?;
      `;
      const [rows] = await db.query(sql, [userap_id]);

      if (rows.length === 0) {
        return response.status(404).json({ sucesso: false, mensagem: "Morador não encontrado." });
      }

      const pushToken = rows[0].user_push_token;
      if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        console.warn("⚠️ Token de notificação inválido:", pushToken);
        return response.status(200).json({ sucesso: true, mensagem: "Visitante registrado sem push (token inválido)." });
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title: 'Visitante na Portaria',
        body: `${vst_nome} solicita acesso à sua unidade.`,
        data: { vst_nome, userap_id }
      };

      await expo.sendPushNotificationsAsync([message]);

      const insertNotif = `
        INSERT INTO notificacoes (userap_id, not_titulo, not_mensagem, not_data_envio, not_tipo, not_prioridade)
        VALUES (?, 'Visitante na Portaria', ?, NOW(), 'Aviso', 'Alta');
      `;
      await db.query(insertNotif, [userap_id, `${vst_nome} solicita acesso. Autorize ou negue pelo aplicativo.`]);

      return response.status(200).json({ sucesso: true, mensagem: "Notificação enviada com sucesso ao morador." });

    } catch (error) {
      console.error("❌ Erro ao notificar morador:", error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro ao enviar notificação de visitante.",
        dados: error.message
      });
    }
  },

  // =============================================================
  // 🚪 5. AUTORIZAR ENTRADA IMEDIATA (portaria)
  // =============================================================
  async autorizarentrada(request, response) {
    try {
      const { userap_id, vst_nome, vst_celular, vst_documento } = request.body;

      if (!userap_id || !vst_nome) {
        return response.status(400).json({ sucesso: false, mensagem: "O ID do morador e o nome do visitante são obrigatórios." });
      }

      const celularFormatado = formatarTelefone(vst_celular);
      const vst_qrcode_hash = randomUUID();
      const agora = new Date();
      const fimDoDia = new Date(agora);
      fimDoDia.setHours(23, 59, 59, 999);

      const sql = `
        INSERT INTO visitantes (
          userap_id, vst_nome, vst_celular, vst_documento,
          vst_validade_inicio, vst_validade_fim, vst_qrcode_hash,
          vst_status, vst_data_entrada
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Entrou', NOW());
      `;
      const [result] = await db.query(sql, [
        userap_id, vst_nome, celularFormatado, vst_documento, agora, fimDoDia, vst_qrcode_hash
      ]);

      return response.status(201).json({
        sucesso: true,
        mensagem: `Entrada de ${vst_nome} autorizada com sucesso.`,
        dados: { id: result.insertId, nome: vst_nome, status: 'Entrou' }
      });

    } catch (error) {
      console.error('❌ Erro ao autorizar entrada imediata:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao processar a autorização.",
        dados: error.message
      });
    }
  },

  // =============================================================
  // ✅ 6. REGISTRAR ENTRADA / SAÍDA (portaria)
  // =============================================================
  async registrarentrada(request, response) {
    try {
      const { id } = request.params;
      
      // Buscar dados do visitante antes de atualizar
      const [visitante] = await db.query('SELECT userap_id, vst_nome FROM visitantes WHERE vst_id = ?', [id]);
      
      if (visitante.length === 0) {
        return response.status(404).json({ sucesso: false, mensagem: `Visitante ${id} não encontrado.` });
      }
      
      const sql = `
        UPDATE visitantes
        SET vst_status = 'Entrou', vst_data_entrada = NOW()
        WHERE vst_id = ? AND vst_status = 'Aguardando';
      `;
      const [result] = await db.query(sql, [id]);

      if (!result.affectedRows) {
        return response.status(404).json({ sucesso: false, mensagem: `Autorização ${id} não encontrada ou já registrada.` });
      }

      // 🔔 Notificar morador que visitante chegou
      await notificarVisitanteChegou(visitante[0].userap_id, visitante[0].vst_nome);

      return response.status(200).json({
        sucesso: true,
        mensagem: "Entrada registrada com sucesso.",
        dados: { id, status: 'Entrou', horario: new Date().toLocaleString('pt-BR') }
      });

    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao registrar entrada.",
        dados: error.message
      });
    }
  },

  async registrarsaida(request, response) {
    try {
      const { id } = request.params;
      const sql = `
        UPDATE visitantes
        SET vst_status = 'Finalizado', vst_data_saida = NOW()
        WHERE vst_id = ? AND vst_status = 'Entrou';
      `;
      const [result] = await db.query(sql, [id]);

      if (!result.affectedRows) {
        return response.status(404).json({ sucesso: false, mensagem: `Visitante ${id} não encontrado ou ainda não entrou.` });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: "Saída registrada com sucesso.",
        dados: { id, status: 'Finalizado', horario: new Date().toLocaleString('pt-BR') }
      });

    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao registrar saída.",
        dados: error.message
      });
    }
  },

  // =============================================================
  // ❌ 7. CANCELAR AUTORIZAÇÃO (morador)
  // =============================================================
  async cancelarautorizacao(request, response) {
    try {
      const { id } = request.params;

      const sql = `
        UPDATE visitantes
        SET vst_status = 'Cancelado'
        WHERE vst_id = ? AND vst_status = 'Aguardando';
      `;
      const [result] = await db.query(sql, [id]);

      if (!result.affectedRows) {
        return response.status(404).json({ sucesso: false, mensagem: `Autorização ${id} não encontrada ou não pode mais ser cancelada.` });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: "Autorização cancelada com sucesso.",
        dados: { id, status: 'Cancelado' }
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor ao cancelar autorização.",
        dados: error.message
      });
    }
  }
};
