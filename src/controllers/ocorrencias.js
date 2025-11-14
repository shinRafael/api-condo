// ===============================================================
// ⚙️ controllers/ocorrencias.js — versão padronizada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');
const { notificarNovaOcorrencia, notificarOcorrenciaAtualizada, notificarMensagemOcorrencia } = require('../helpers/notificationHelper');

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
      const { userap_id, oco_categoria, oco_descricao, oco_localizacao, oco_prioridade, oco_imagem } = request.body;

      const anoAtual = new Date().getFullYear();
      const [resultadoBusca] = await db.query(
        `SELECT COUNT(*) AS total_no_ano FROM ocorrencias WHERE YEAR(oco_data) = ?;`,
        [anoAtual]
      );

      const proximoNumero = resultadoBusca[0].total_no_ano + 1;
      const protocoloFormatado = `OCO-${anoAtual}-${proximoNumero.toString().padStart(4, '0')}`;
      const prioridadePadrao = oco_prioridade || 'Média';

      const sqlInsert = `
        INSERT INTO ocorrencias 
          (userap_id, oco_protocolo, oco_categoria, oco_descricao, oco_localizacao, oco_data, oco_status, oco_prioridade, oco_imagem)
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?);
      `;
      const values = [userap_id, protocoloFormatado, oco_categoria, oco_descricao, oco_localizacao, 'Aberta', prioridadePadrao, oco_imagem];
      const [result] = await db.query(sqlInsert, values);

      // 🔔 Notificar morador sobre nova ocorrência
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
        [result.insertId]
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
      const remetente_user_id = 3; // ⚠️ Substituir pelo ID real do usuário logado
      const { ocomsg_mensagem } = request.body;

      if (!ocomsg_mensagem) {
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

      const sqlInsert = `
        INSERT INTO ocorrencia_mensagens (oco_id, user_id, ocomsg_mensagem, ocomsg_data_envio)
        VALUES (?, ?, ?, NOW());
      `;
      const [result] = await db.query(sqlInsert, [id, remetente_user_id, ocomsg_mensagem]);

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
        dados: error.message,
      });
    }
  },
};
