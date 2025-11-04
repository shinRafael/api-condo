// ===============================================================
// 🔔 controllers/notificacao.js — versão revisada CondoWay 2025
// ===============================================================

const db = require('../dataBase/connection');

// ===============================================================
// 🧩 Função auxiliar: corrige o formato da prioridade ENUM
// ===============================================================
const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return 'Media';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

module.exports = {
  // =============================================================
  // 📋 LISTAR ENVIO AGRUPADO (Painel Web)
  // =============================================================
  async listarEnviosAgrupados(request, response) {
    try {
      const sql = `
        SELECT 
          not_titulo,
          not_mensagem,
          not_prioridade,
          not_tipo,
          MAX(not_data_envio) AS data_ultimo_envio,
          COUNT(userap_id) AS total_destinatarios
        FROM notificacoes
        GROUP BY not_titulo, not_mensagem, not_prioridade, not_tipo
        ORDER BY data_ultimo_envio DESC;
      `;
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de envios agrupados de notificações.',
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar envios agrupados.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✏️ EDITAR ENVIO AGRUPADO (Painel Web)
  // =============================================================
  async editarEnvioAgrupado(request, response) {
    try {
      const { original, novo } = request.body;

      if (!original || !novo || !original.not_titulo || !novo.not_titulo) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Dados insuficientes para edição. Envie o conteúdo original e o novo.',
        });
      }

      const prioridadeOriginal = capitalize(original.not_prioridade);
      const prioridadeNova = capitalize(novo.not_prioridade);

      const sql = `
        UPDATE notificacoes
        SET not_titulo = ?, not_mensagem = ?, not_prioridade = ?
        WHERE not_titulo = ? AND not_mensagem = ? AND not_prioridade = ? AND not_tipo = ?;
      `;
      const values = [
        novo.not_titulo,
        novo.not_mensagem,
        prioridadeNova,
        original.not_titulo,
        original.not_mensagem,
        prioridadeOriginal,
        original.not_tipo,
      ];
      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Nenhum envio correspondente encontrado para edição.',
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `${result.affectedRows} notificações atualizadas com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar envio agrupado.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🗑️ APAGAR ENVIO AGRUPADO
  // =============================================================
  async apagarEnvioAgrupado(request, response) {
    try {
      const { not_titulo, not_mensagem, not_prioridade, not_tipo } = request.body;

      if (!not_titulo || !not_mensagem || !not_prioridade || !not_tipo) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Dados insuficientes para exclusão.',
        });
      }

      const prioridade = capitalize(not_prioridade);

      const sql = `
        DELETE FROM notificacoes
        WHERE not_titulo = ? AND not_mensagem = ? AND not_prioridade = ? AND not_tipo = ?;
      `;
      const values = [not_titulo, not_mensagem, prioridade, not_tipo];
      const [result] = await db.query(sql, values);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: 'Nenhum envio correspondente encontrado para exclusão.',
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `${result.affectedRows} notificações excluídas com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao excluir envio agrupado.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📱 LISTAR NOTIFICAÇÕES POR MORADOR (App)
  // =============================================================
  async listarnotificacao(request, response) {
    try {
      const { userap_id } = request.params;
      const sql = `
        SELECT not_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_prioridade
        FROM notificacoes
        WHERE userap_id = ?
        ORDER BY not_data_envio DESC;
      `;
      const [rows] = await db.query(sql, [userap_id]);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de notificações do usuário.',
        nItens: rows.length,
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar notificações.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ⚠️ LISTAR AVISOS IMPORTANTES (Dashboard App)
  // =============================================================
  async listarAvisosImportantes(request, response) {
    try {
      const sql = `
        SELECT not_id, not_titulo, not_mensagem
        FROM notificacoes
        WHERE not_prioridade = 'Alta'
        ORDER BY not_data_envio DESC
        LIMIT 3;
      `;
      const [rows] = await db.query(sql);

      return response.status(200).json({
        sucesso: true,
        mensagem: 'Lista de avisos importantes.',
        dados: rows,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao listar avisos importantes.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ✅ MARCAR COMO LIDA
  // =============================================================
  async marcarComoLida(request, response) {
    try {
      const { not_id } = request.params;
      const sql = `UPDATE notificacoes SET not_lida = 1 WHERE not_id = ?;`;
      const [result] = await db.query(sql, [not_id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Notificação ${not_id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Notificação ${not_id} marcada como lida.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao marcar notificação como lida.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 📨 CADASTRAR NOTIFICAÇÃO (Envio individual ou em massa)
  // =============================================================
  async cadastrarnotificacao(request, response) {
    try {
      const { not_titulo, not_mensagem, not_prioridade, alvo } = request.body;

      if (!not_titulo || !not_mensagem) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Título e mensagem da notificação são obrigatórios.',
        });
      }

      const prioridade = capitalize(not_prioridade);
      let listaDeUserApIds = [];

      // Envio para todos os moradores
      if (alvo === 'todos') {
        const [rows] = await db.query('SELECT userap_id FROM usuario_apartamentos;');
        listaDeUserApIds = rows.map((r) => r.userap_id);
      }
      // Envio por bloco
      else if (alvo.startsWith('bloco-')) {
        const blocId = alvo.split('-')[1];
        const [rows] = await db.query(
          `
          SELECT ua.userap_id 
          FROM usuario_apartamentos AS ua
          JOIN apartamentos AS a ON ua.ap_id = a.ap_id
          WHERE a.bloc_id = ?;
        `,
          [blocId]
        );
        listaDeUserApIds = rows.map((r) => r.userap_id);
      }
      // Envio por apartamento específico
      else if (alvo.startsWith('ap-')) {
        const apId = alvo.split('-')[1];
        const [rows] = await db.query(
          'SELECT userap_id FROM usuario_apartamentos WHERE ap_id = ?;',
          [apId]
        );
        listaDeUserApIds = rows.map((r) => r.userap_id);
      } else {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Alvo inválido.',
        });
      }

      if (listaDeUserApIds.length === 0) {
        return response.status(400).json({
          sucesso: false,
          mensagem: 'Nenhum destinatário encontrado.',
        });
      }

      // Inserção em massa
      for (const userap_id of listaDeUserApIds) {
        const sqlInsert = `
          INSERT INTO notificacoes
            (userap_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_prioridade)
          VALUES (?, ?, ?, NOW(), 0, ?);
        `;
        await db.query(sqlInsert, [userap_id, not_titulo, not_mensagem, prioridade]);
      }

      return response.status(201).json({
        sucesso: true,
        mensagem: `Notificação enviada para ${listaDeUserApIds.length} destinatário(s).`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao cadastrar notificação.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // 🛠️ EDITAR NOTIFICAÇÃO (individual)
  // =============================================================
  async editarnotificacao(request, response) {
    try {
      const { id } = request.params;
      const { not_titulo, not_mensagem, not_lida, not_prioridade } = request.body;

      const sql = `
        UPDATE notificacoes
        SET not_titulo = ?, not_mensagem = ?, not_lida = ?, not_prioridade = ?
        WHERE not_id = ?;
      `;
      const [result] = await db.query(sql, [not_titulo, not_mensagem, not_lida, not_prioridade, id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Notificação ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Notificação ${id} atualizada com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao editar notificação.',
        dados: error.message,
      });
    }
  },

  // =============================================================
  // ❌ APAGAR NOTIFICAÇÃO (individual)
  // =============================================================
  async apagarnotificacao(request, response) {
    try {
      const { id } = request.params;
      const sql = 'DELETE FROM notificacoes WHERE not_id = ?;';
      const [result] = await db.query(sql, [id]);

      if (result.affectedRows === 0) {
        return response.status(404).json({
          sucesso: false,
          mensagem: `Notificação ${id} não encontrada.`,
        });
      }

      return response.status(200).json({
        sucesso: true,
        mensagem: `Notificação ${id} excluída com sucesso.`,
      });
    } catch (error) {
      return response.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao excluir notificação.',
        dados: error.message,
      });
    }
  },
};
