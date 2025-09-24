-- Exemplo 1: Visita planejada para hoje, status "Aguardando".
INSERT INTO Visitantes (userap_id, vst_nome, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash, vst_status, vst_data_entrada, vst_data_saida) 
VALUES 
(1, 'João da Silva', '123.456.789-00', '2025-09-24 19:00:00', '2025-09-24 23:59:00', 'hash_unico_para_joao_123', 'Aguardando', NULL, NULL);

-- Exemplo 2: Visita de fim de semana, com documento nulo, status "Aguardando".
INSERT INTO Visitantes (userap_id, vst_nome, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash, vst_status, vst_data_entrada, vst_data_saida) 
VALUES 
(2, 'Maria Oliveira', NULL, '2025-09-26 18:00:00', '2025-09-28 22:00:00', 'hash_unico_para_maria_456', 'Aguardando', NULL, NULL);

-- Exemplo 3: Visitante que já entrou no condomínio, status "Entrou".
INSERT INTO Visitantes (userap_id, vst_nome, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash, vst_status, vst_data_entrada, vst_data_saida) 
VALUES 
(3, 'Pedro Souza', '987.654.321-11', '2025-09-24 14:00:00', '2025-09-24 18:00:00', 'hash_unico_para_pedro_789', 'Entrou', '2025-09-24 14:05:12', NULL);

-- Exemplo 4: Visita que já foi finalizada (entrou e saiu).
INSERT INTO Visitantes (userap_id, vst_nome, vst_documento, vst_validade_inicio, vst_validade_fim, vst_qrcode_hash, vst_status, vst_data_entrada, vst_data_saida) 
VALUES 
(5, 'Ana Costa', '555.444.333-22', '2025-09-23 10:00:00', '2025-09-23 17:00:00', 'hash_unico_para_ana_101', 'Finalizado', '2025-09-23 10:15:30', '2025-09-23 16:45:00');