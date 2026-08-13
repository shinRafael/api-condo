#!/usr/bin/env node
/* Smoke test Condoway — exercita controllers REAIS contra o banco Hostinger
 * sem subir servidor HTTP (contorna o wrapper bash que mata o background). */
require('dotenv').config();

/* 🔒 GUARD DE SEGURANÇA: este script ESCREVE em banco real (cadastro, vínculo,
 * ocorrência, comentário). Contra o banco de PRODUÇÃO (Hostinger), só roda com
 * intenção explícita: SMOKE_ALLOW_PROD=true node smoke-test.js
 * Contra qualquer outro ambiente (local/staging), roda normalmente. */
const alvoIsProd =
  /212\.85\.3\.212/.test(process.env.BD_SERVIDOR || '') ||
  /u815496249_condoway/.test(process.env.BD_BANCO || '');
if (alvoIsProd && process.env.SMOKE_ALLOW_PROD !== 'true') {
  console.error('🚫 Smoke test BLOQUEADO: este script ESCREVE no banco de PRODUÇÃO (Hostinger).');
  console.error('   Se for intencional, rode com: SMOKE_ALLOW_PROD=true node smoke-test.js');
  process.exit(1);
}

const usuario = require('./src/controllers/usuario');
const ocorrencias = require('./src/controllers/ocorrencias');

function fakeRes() {
  return {
    _status: 0, _json: null,
    status(c) { this._status = c; return this; },
    json(j) { this._json = j; },
  };
}

(async () => {
  // 1. Cadastro público (idempotente: se e-mail existe, espera 400 "já cadastrado")
  let res = fakeRes();
  await usuario.cadastrarusuarioPublico(
    { body: { user_nome: 'Hermes Smoke', user_email: 'hermes.smoke@teste.com', user_senha: 'senha123' } },
    res
  );
  console.log('[1] POST /usuario/cadastro →', res._status, res._json?.mensagem || res._json?.dados);
  const criou = res._status === 201;

  // 2. Vincular apartamento (para userApId no login) — se não existir vínculo
  const db = require('./src/dataBase/connection');
  const [rows] = await db.query("SELECT user_id FROM usuarios WHERE user_email = 'hermes.smoke@teste.com'");
  const uid = rows[0]?.user_id;
  const [vinculos] = await db.query('SELECT userap_id FROM usuario_apartamentos WHERE user_id = ?', [uid]);
  let userapId = vinculos[0]?.userap_id;
  if (!userapId) {
    const [r] = await db.query('INSERT INTO usuario_apartamentos (user_id, ap_id) VALUES (?, 1)', [uid]);
    userapId = r.insertId;
    console.log('[2] vínculo criado → userap_id', userapId);
  } else {
    console.log('[2] vínculo existente → userap_id', userapId);
  }

  // 3. Login real
  res = fakeRes();
  await usuario.loginusuario(
    { body: { user_email: 'hermes.smoke@teste.com', user_senha: 'senha123' } },
    res
  );
  const token = res._json?.dados?.token;
  const userLogin = res._json?.dados?.usuario;
  console.log('[3] POST /usuario/login →', res._status, '| token:', token ? token.slice(0, 20) + '...' : 'SEM TOKEN', '| userApId no payload:', userLogin);
  if (!token) { console.log('❌ login falhou'); process.exit(1); }
  console.log('✅ login OK');

  // 4. Listar ocorrências do morador (com ownership: userApId do token bate)
  const reqUser = { user: { userId: uid, userType: 'Morador', userApId: userapId } };
  res = fakeRes();
  await ocorrencias.listarOcorrenciasDoMorador(
    { ...reqUser, params: { userap_id: userapId } },
    res
  );
  console.log('[4] GET /ocorrencias/:userap_id →', res._status, '| nItens:', res._json?.nItens);

  // 5. Criar ocorrência (userap_id do JWT)
  res = fakeRes();
  await ocorrencias.cadastrarocorrencias(
    { ...reqUser, body: { oco_categoria: 'Vazamento', oco_descricao: 'Smoke test do chat', oco_localizacao: 'Apto 101', oco_prioridade: 'Média' } },
    res
  );
  const oco = res._json?.dados;
  console.log('[5] POST /ocorrencias →', res._status, '| protocolo:', oco?.oco_protocolo, '| userap_id:', oco?.userap_id);
  if (!oco?.oco_id) { console.log('❌ criar ocorrência falhou'); process.exit(1); }

  // 6. Enviar comentário (remetente do JWT — não hardcoded 3!)
  res = fakeRes();
  await ocorrencias.enviarMensagemParaOcorrencia(
    { ...reqUser, params: { id: oco.oco_id }, body: { ocomsg_mensagem: 'Olá síndico, teste do chat!' } },
    res
  );
  const msg = res._json?.dados;
  console.log('[6] POST /ocorrencias/:id/mensagens →', res._status, '| user_id remetente:', msg?.user_id, '(esperado', uid + ')');
  if (msg?.user_id !== uid) { console.log('❌ remetente errado (ainda hardcoded?)'); process.exit(1); }
  console.log('✅ chat: remetente = usuário do JWT (fix confirmado)');

  // 7. Listar mensagens da ocorrência
  res = fakeRes();
  await ocorrencias.listarMensagensDaOcorrencia(
    { ...reqUser, params: { id: oco.oco_id } },
    res
  );
  console.log('[7] GET /ocorrencias/:id/mensagens →', res._status, '| msgs:', res._json?.dados?.length);

  console.log('\n=== SMOKE TEST COMPLETO ✅ (cadastro → vínculo → login → ocorrência → chat) ===');
  await db.end();
  process.exit(0);
})().catch((e) => { console.error('❌ FALHA:', e.message); process.exit(1); });
