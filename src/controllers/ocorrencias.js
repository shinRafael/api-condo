// ===============================================================
// ⚙️ controllers/ocorrencias.js — versão padronizada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');
const { notificarNovaOcorrencia, notificarOcorrenciaAtualizada, notificarMensagemOcorrencia } = require('../helpers/notificationHelper');
const { verificarPosseUserAp } = require('../middleware/ownership');

module.exports = {
  // =============================================================
  // 🧱 LISTAR TODAS AS OCORRÊNCIAS (SÍNDICO WEB)
  // =============================================================
  async listarTodasOcorrencias(request, response) {
    try {
      const sql = `
        SELECT
          o.oco_id, o.userap_id, o.oco_protocolo, o.oco_categoria,
          o.oco_descricao, o.oco_localizacao, o.oco_data,
          o.oco_status, o.oco_prioridade, o.oco_imagem,
          u.user_nome AS morador_nome,
          CONCAT('Bloco ', b.bloc_nome, ' - AP ', a.ap_numero) AS apartamento
        FROM ocorrencias AS o
        JOIN usuario_apartamentos AS ua ON o.userap_id = ua.userap_id
        JOIN usuarios AS u ON ua.user_id = u.user_id
        JOIN apartamentos AS a ON ua.ap_id = a.ap_id
        JOIN bloco AS b ON a.bloc_id = b.bloc_id
        ORDER BY o.oco_data DESC;
      `;

      const [rows] = await db.query(sql);

      // Agrupa por status
      const agrupados = {
        Aberta: [],
        'Em Andamento': [],
        Resolvida: [],
        Cancelada: [],
      };

      rows.forEach((o) => {
        const statusKey =
          o.oco_status && agrupados.hasOwnProperty(o.oco_status)
            ? o.oco_status
            : 'Aberta';
        agrupados[statusKey].push(o);
      });

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de ocorrências agrupadas por status.',
        dados: agrupados,
      });
    } catch (error) {
      console.error('❌ Erro ao listar ocorrências:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar ocorrências.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📱 LISTAR OCORRÊNCIAS DO MORADOR
  // =============================================================
  async listarOcorrenciasDoMorador(request, response) {
    try {
      const { userap_id } = request.params;

      // 🔒 Anti-IDOR: morador só acessa as ocorrências da própria unidade
      // (equipe — Síndico/Funcionário/ADM — tem acesso amplo)
      if (!verificarPosseUserAp(request.user, userap_id)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode listar as ocorrências da sua unidade.',
        });
      }

      const sql = `
        SELECT
          oco_id, userap_id, oco_protocolo, oco_categoria, oco_descricao,
          oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem
        FROM ocorrencias
        WHERE userap_id = ?
        ORDER BY oco_data DESC;
      `;
      const [rows] = await db.query(sql, [userap_id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de ocorrências do morador.',
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      console.error('❌ Erro ao listar ocorrências do morador:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar ocorrências do morador.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📝 CADASTRAR NOVA OCORRÊNCIA
  // =============================================================
  async cadastrarocorrencias(request, response) {
    try {
      const { oco_categoria, oco_descricao, oco_localizacao, oco_prioridade, oco_imagem } = request.body;

      // 🔒 Anti-IDOR/escalada: userap_id vem do JWT — nunca do body.
      // Ignora qualquer userap_id enviado pelo cliente.
      const userap_id = request.user?.userApId;
      if (!userap_id) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Token sem vínculo de unidade (userApId).',
        });
      }

      const anoAtual = new Date().getFullYear();
      const prioridadePadrao = oco_prioridade || 'Média';

      // 🔧 Protocolo derivado do AUTO_INCREMENT (oco_id) — sem race condition.
      // ANTES: SELECT MAX(oco_id)+1 + INSERT não eram atômicos → 2 requisições
      // concorrentes liam o mesmo MAX → mesmo protocolo → ER_DUP_ENTRY (500).
      // AGORA: INSERT com placeholder temporário + UPDATE imediato com o insertId
      // (AUTO_INCREMENT é único por conexão) dentro de transação — o protocolo
      // final fica OCO-AAAA-NNNN, visualmente idêntico ao formato anterior.
      const conn = await db.getConnection();
      let protocoloFormatado;
      let ocoId;
      try {
        await conn.beginTransaction();

        const sqlInsert = `
          INSERT INTO ocorrencias 
            (userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem)
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?);
      `;
        // Placeholder único por conexão (threadId) para nunca colidir com
        // requisições concorrentes na UNIQUE oco_protocolo.
        const protocoloTemporario = `OCO-${anoAtual}-TEMP-${conn.threadId || Date.now()}`;
        const values = [userap_id, protocoloTemporario, oco_categoria, oco_descricao, oco_localizacao, 'Aberta', prioridadePadrao, oco_imagem];
        const [result] = await conn.query(sqlInsert, values);

        ocoId = result.insertId;
        protocoloFormatado = `OCO-${anoAtual}-${String(ocoId).padStart(4, '0')}`;
        await conn.query(
          'UPDATE ocorrencias SET oco_protocolo = ? WHERE oco_id = ?;',
          [protocoloFormatado, ocoId]
        );

        await conn.commit();
      } catch (error) {
        try {
          await conn.rollback();
        } catch (rollbackError) {
          console.error('❌ Erro ao fazer rollback da ocorrência:', rollbackError);
        }
        throw error;
      } finally {
        conn.release();
      }

      // 🔔 Notificar morador sobre nova ocorrência (após o commit)
      await notificarNovaOcorrencia(userap_id, protocoloFormatado, oco_categoria);

      // Busca o registro recém-inserido para retornar completo
      const [insertedRow] = await db.query(
        `
        SELECT
          o.*, 
          u.user_nome AS morador_nome,
          CONCAT('Bloco ', b.bloc_nome, ' - AP ', a.ap_numero) AS apartamento
        FROM ocorrencias AS o
        LEFT JOIN usuario_apartamentos AS ua ON o.userap_id = ua.userap_id
        LEFT JOIN usuarios AS u ON ua.user_id = u.user_id
        LEFT JOIN apartamentos AS a ON ua.ap_id = a.ap_id
        LEFT JOIN bloco AS b ON a.bloc_id = b.bloc_id
        WHERE o.oco_id = ?;
        `,
        [ocoId]
      );

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Ocorrência cadastrada com sucesso.',
        dados: insertedRow[0],
      });
    } catch (error) {
      console.error('❌ Erro ao cadastrar ocorrência:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar ocorrência.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR STATUS OU PRIORIDADE DA OCORRÊNCIA
  // =============================================================
  async editarocorrencias(request, response) {
    try {
      const { id } = request.params;
      const { oco_status, oco_prioridade } = request.body;

      if (!oco_status && !oco_prioridade) {
        return response.status(400).json({
          sucesso: false,
          mensagem: "É necessário informar 'oco_status' ou 'oco_prioridade' para atualização.",
        });
      }

      const statusValidos = ['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'];
      const prioridadesValidas = ['Baixa', 'Média', 'Alta', 'Urgente'];

      if (oco_status && !statusValidos.includes(oco_status)) {
        return response.status(400).json({ sucesso: false, mensagem: 'Status inválido.' });
      }
      if (oco_prioridade && !prioridadesValidas.includes(oco_prioridade)) {
        return response.status(400).json({ sucesso: false, mensagem: 'Prioridade inválida.' });
      }

      const campos = [];
      const values = [];
      if (oco_status) {
        campos.push('oco_status = ?');
        values.push(oco_status);
      }
      if (oco_prioridade) {
        campos.push('oco_prioridade = ?');
        values.push(oco_prioridade);
      }
      values.push(id);

      // Buscar dados da ocorrência antes de atualizar
      const [ocorrenciaAtual] = await db.query(
        'SELECT userap_id, oco_protocolo, oco_status FROM ocorrencias WHERE oco_id = ?',
        [id]
      );

      if (ocorrenciaAtual.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Ocorrência com ID ${id} não encontrada.`,
        });
      }

      const sql = `UPDATE ocorrencias SET ${campos.join(', ')} WHERE oco_id = ?;`;
      const [result] = await db.query(sql, values);

      // 🔔 Notificar morador se status mudou
      if (oco_status && oco_status !== ocorrenciaAtual[0].oco_status) {
        await notificarOcorrenciaAtualizada(
          ocorrenciaAtual[0].userap_id,
          ocorrenciaAtual[0].oco_protocolo,
          oco_status
        );
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Ocorrência ${id} atualizada com sucesso.`,
        dados: { oco_status, oco_prioridade },
      });
    } catch (error) {
      console.error('❌ Erro ao editar ocorrência:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar ocorrência.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR OCORRÊNCIA
  // =============================================================
  async apagarocorrencias(request, response) {
    try {
      const { id } = request.params;
      const [result] = await db.query(`DELETE FROM ocorrencias WHERE oco_id = ?;`, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Ocorrência com ID ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Ocorrência ${id} excluída com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao apagar ocorrência:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao apagar ocorrência.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 💬 LISTAR MENSAGENS DA OCORRÊNCIA
  // =============================================================
  async listarMensagensDaOcorrencia(request, response) {
    try {
      const { id } = request.params;

      // 🔒 Anti-IDOR: só o morador dono da ocorrência (ou equipe) lê o chat
      const [oco] = await db.query('SELECT userap_id FROM ocorrencias WHERE oco_id = ?', [id]);
      if (oco.length === 0) {
        return response.status(404).json({ sucesso: false, mensagem: 'Ocorrência não encontrada.' });
      }
      if (!verificarPosseUserAp(request.user, oco[0].userap_id)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode acessar o chat das suas ocorrências.',
        });
      }

      const sql = `
        SELECT
          om.ocomsg_id, om.oco_id, om.user_id, om.ocomsg_mensagem,
          om.ocomsg_data_envio, om.ocomsg_lida,
          u.user_nome AS remetente_nome, u.user_tipo AS remetente_tipo
        FROM ocorrencia_mensagens AS om
        JOIN usuarios AS u ON om.user_id = u.user_id
        WHERE om.oco_id = ?
        ORDER BY om.ocomsg_data_envio ASC;
      `;
      const [rows] = await db.query(sql, [id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: `Mensagens da ocorrência ${id}.`,
        dados: rows,
      });
    } catch (error) {
      console.error('❌ Erro ao listar mensagens da ocorrência:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar mensagens da ocorrência.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📩 ENVIAR MENSAGEM PARA UMA OCORRÊNCIA
  // =============================================================
  async enviarMensagemParaOcorrencia(request, response) {
    try {
      const { id } = request.params;
      // Usa o ID do usuário autenticado pelo JWT (request.user é injetado pelo verificarToken)
      const remetente_user_id = request.user?.userId || request.user?.user_id || request.user?.id;
      const { ocomsg_mensagem, msg_mensagem } = request.body;
      const mensagemTexto = ocomsg_mensagem || msg_mensagem;

      if (!remetente_user_id) {
        return response.status(401).json({
          sucesso: false,
          mensagem: 'Usuário não autenticado. Não foi possível identificar o remetente.',
        });
      }

      if (!mensagemTexto || !mensagemTexto.trim()) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'A mensagem não pode estar vazia.',
        });
      }

      // Buscar dados da ocorrência
      const [ocorrencia] = await db.query(
        'SELECT userap_id, oco_protocolo FROM ocorrencias WHERE oco_id = ?',
        [id]
      );

      if (ocorrencia.length === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Ocorrência não encontrada.',
        });
      }

      // 🔒 Anti-IDOR: só o morador dono (ou equipe) pode comentar
      if (!verificarPosseUserAp(request.user, ocorrencia[0].userap_id)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode comentar nas suas ocorrências.',
        });
      }

      const sqlInsert = `
        INSERT INTO ocorrencia_mensagens (oco_id, user_id, ocomsg_mensagem, ocomsg_data_envio)
        VALUES (?, ?, ?, NOW());
      `;
      const [result] = await db.query(sqlInsert, [id, remetente_user_id, mensagemTexto]);

      // 🔔 Notificar morador sobre nova mensagem
      await notificarMensagemOcorrencia(ocorrencia[0].userap_id, ocorrencia[0].oco_protocolo);

      const [rows] = await db.query(
        `
        SELECT
          om.ocomsg_id, om.oco_id, om.user_id, om.ocomsg_mensagem,
          om.ocomsg_data_envio, om.ocomsg_lida,
          u.user_nome AS remetente_nome, u.user_tipo AS remetente_tipo
        FROM ocorrencia_mensagens AS om
        JOIN usuarios AS u ON om.user_id = u.user_id
        WHERE om.ocomsg_id = ?;
        `,
        [result.insertId]
      );

      return response.status(201).json({
        sucesso: true,
        mensagem: 'Mensagem enviada com sucesso.',
        dados: rows[0],
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem da ocorrência:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao enviar mensagem.',
      });
    }
  },

  // =============================================================
  // ✅ MARCAR MENSAGENS DA OCORRÊNCIA COMO LIDAS
  // =============================================================
  async marcarMensagensOcorrenciaComoLidas(request, response) {
    try {
      const { id } = request.params;

      // 🔒 Anti-IDOR: só o morador dono (ou equipe) marca as próprias mensagens
      const [oco] = await db.query('SELECT userap_id FROM ocorrencias WHERE oco_id = ?', [id]);
      if (oco.length === 0) {
        return response.status(404).json({ sucesso: false, mensagem: 'Ocorrência não encontrada.' });
      }
      if (!verificarPosseUserAp(request.user, oco[0].userap_id)) {
        return response.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você só pode marcar mensagens das suas ocorrências.',
        });
      }

      const [result] = await db.query(
        'UPDATE ocorrencia_mensagens SET ocomsg_lida = 1 WHERE oco_id = ?;',
        [id]
      );

      return response.status(200).json({
        sucesso: true,
        mensagem: `Mensagens da ocorrência ${id} marcadas como lidas.`,
        dados: { atualizadas: result.affectedRows },
      });
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao marcar mensagens como lidas.',
      });
    }
  },
};
