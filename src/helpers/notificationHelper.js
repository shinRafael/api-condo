// ===============================================================
// 🔔 helpers/notificationHelper.js — Sistema de Notificações Automáticas
// ===============================================================

const db = require('../dataBase/connection');

/**
 * Cria notificação para um usuário específico
 */
async function criarNotificacao(userap_id, titulo, mensagem, tipo, prioridade = 'Media') {
  try {
    const sql = `
      INSERT INTO notificacoes 
        (userap_id, not_titulo, not_mensagem, not_data_envio, not_lida, not_prioridade, not_tipo)
      VALUES (?, ?, ?, NOW(), 0, ?, ?);
    `;
    
    await db.query(sql, [userap_id, titulo, mensagem, prioridade, tipo]);
    console.log(`✅ [Notificação] Criada para userap_id ${userap_id}: ${titulo}`);
    
    return { sucesso: true };
  } catch (error) {
    console.error('❌ [Notificação] Erro ao criar:', error.message);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Notificação: Nova encomenda chegou
 */
async function notificarNovaEncomenda(userap_id, nomeLoja, codigoRastreio) {
  const titulo = '📦 Encomenda Recebida';
  const mensagem = `Sua encomenda da ${nomeLoja}${codigoRastreio ? ` (${codigoRastreio})` : ''} chegou na portaria.`;
  
  // Encomendas são rotineiras -> prioridade baixa
  return await criarNotificacao(userap_id, titulo, mensagem, 'Entrega', 'Baixa');
}

/**
 * Notificação: Encomenda foi retirada
 */
async function notificarEncomendaRetirada(userap_id, nomeLoja) {
  const titulo = '✅ Encomenda Retirada';
  const mensagem = `Sua encomenda da ${nomeLoja} foi retirada com sucesso.`;
  
  return await criarNotificacao(userap_id, titulo, mensagem, 'Entrega', 'Baixa');
}

/**
 * Notificação: Reserva confirmada
 */
async function notificarReservaConfirmada(userap_id, nomeAmbiente, data, horario) {
  const titulo = '✅ Reserva Confirmada';
  const mensagem = `Sua reserva do ${nomeAmbiente} para ${data} às ${horario} foi confirmada!`;
  
  // Reservas confirmadas são informativas -> prioridade baixa
  return await criarNotificacao(userap_id, titulo, mensagem, 'Aviso', 'Baixa');
}

/**
 * Notificação: Reserva cancelada
 */
async function notificarReservaCancelada(userap_id, nomeAmbiente, data) {
  const titulo = '❌ Reserva Cancelada';
  const mensagem = `Sua reserva do ${nomeAmbiente} para ${data} foi cancelada.`;
  
  return await criarNotificacao(userap_id, titulo, mensagem, 'Aviso', 'Alta');
}

/**
 * Notificação: Visitante autorizado
 */
async function notificarVisitanteAutorizado(userap_id, nomeVisitante, dataValidade) {
  const titulo = '👤 Visitante Autorizado';
  const mensagem = `Autorização para ${nomeVisitante} criada com sucesso. Válida até ${dataValidade}.`;
  
  return await criarNotificacao(userap_id, titulo, mensagem, 'Aviso', 'Baixa');
}

/**
 * Notificação: Visitante chegou na portaria
 */
async function notificarVisitanteChegou(userap_id, nomeVisitante) {
  const titulo = '🔔 Visitante na Portaria';
  const mensagem = `${nomeVisitante} acaba de chegar e está aguardando na portaria.`;
  
  return await criarNotificacao(userap_id, titulo, mensagem, 'Aviso', 'Alta');
}

/**
 * Notificação: Nova ocorrência registrada
 */
async function notificarNovaOcorrencia(userap_id, protocolo, categoria) {
  const titulo = '📝 Ocorrência Registrada';
  const mensagem = `Sua ocorrência ${protocolo} sobre "${categoria}" foi registrada. Acompanhe o status pelo app.`;
  
  // Registro de ocorrência inicial: rotina -> prioridade baixa
  return await criarNotificacao(userap_id, titulo, mensagem, 'Aviso', 'Baixa');
}

/**
 * Notificação: Ocorrência teve status atualizado
 */
async function notificarOcorrenciaAtualizada(userap_id, protocolo, novoStatus) {
  const titulo = '🔄 Ocorrência Atualizada';
  let mensagem;
  
  switch (novoStatus) {
    case 'Em Andamento':
      mensagem = `Sua ocorrência ${protocolo} está sendo atendida.`;
      break;
    case 'Resolvida':
      mensagem = `Sua ocorrência ${protocolo} foi resolvida!`;
      break;
    case 'Cancelada':
      mensagem = `Sua ocorrência ${protocolo} foi cancelada.`;
      break;
    default:
      mensagem = `Status da sua ocorrência ${protocolo} foi alterado para: ${novoStatus}`;
  }
  
  // Somente alterações críticas ganham prioridade Alta
  const prioridade = (novoStatus === 'Resolvida' || novoStatus === 'Cancelada') ? 'Alta' : 'Baixa';
  return await criarNotificacao(userap_id, titulo, mensagem, 'Aviso', prioridade);
}

/**
 * Notificação: Mensagem recebida na ocorrência
 */
async function notificarMensagemOcorrencia(userap_id, protocolo) {
  const titulo = '💬 Nova Mensagem';
  const mensagem = `Você recebeu uma nova mensagem na ocorrência ${protocolo}.`;
  
  // Mensagens em ocorrência são conversas rotineiras -> prioridade baixa
  return await criarNotificacao(userap_id, titulo, mensagem, 'Mensagem', 'Baixa');
}

module.exports = {
  criarNotificacao,
  notificarNovaEncomenda,
  notificarEncomendaRetirada,
  notificarReservaConfirmada,
  notificarReservaCancelada,
  notificarVisitanteAutorizado,
  notificarVisitanteChegou,
  notificarNovaOcorrencia,
  notificarOcorrenciaAtualizada,
  notificarMensagemOcorrencia,
};
