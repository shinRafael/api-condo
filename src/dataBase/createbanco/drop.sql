-- SCRIPT PARA EXCLUIR TODAS AS TABELAS NA ORDEM CORRETA --
-- (A ordem de exclusão é o inverso da ordem de criação)

-- 1. Excluir as tabelas mais dependentes primeiro
DROP TABLE IF EXISTS ocorrencia_mensagens;
DROP TABLE IF EXISTS mensagens;
DROP TABLE IF EXISTS ocorrencias;
DROP TABLE IF EXISTS reservas_ambientes;
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS encomendas;
DROP TABLE IF EXISTS visitantes;

-- 2. Excluir a tabela de ligação principal
DROP TABLE IF EXISTS usuario_apartamentos;

-- 3. Excluir as tabelas de estrutura
DROP TABLE IF EXISTS apartamentos;
DROP TABLE IF EXISTS ambientes;
DROP TABLE IF EXISTS bloco;
DROP TABLE IF EXISTS gerenciamento;
DROP TABLE IF EXISTS documentos;

-- 4. Excluir as tabelas "Mãe"
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS condominio;