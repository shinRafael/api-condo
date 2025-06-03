INSERT INTO Condominio (id, nome, endereco) VALUES
(1, 'Condomínio Jardim das Flores', 'Rua das Acácias, 123'),
(2, 'Condomínio Sol Nascente', 'Av. Central, 456'),
(3, 'Condomínio Vila Verde', 'Rua das Palmeiras, 789'),
(4, 'Condomínio Parque Real', 'Rua dos Jacarandás, 321');

INSERT INTO Bloco (id, id_condominio, nome) VALUES
(1, 1, 'Bloco A'),
(2, 1, 'Bloco B'),
(3, 2, 'Bloco Único'),
(4, 3, 'Bloco C');

INSERT INTO Apartamentos (id, id_bloco, numero) VALUES
(1, 1, '101'),
(2, 1, '102'),
(3, 2, '201'),
(4, 3, '301');


INSERT INTO Usuarios (id, nome, email, senha, tipo) VALUES
(1, 'João da Silva', 'joao@email.com', 'senha123', 'morador'),
(2, 'Maria Oliveira', 'maria@email.com', 'senha456', 'sindico'),
(3, 'Lucas Pereira', 'lucas@email.com', 'senha789', 'porteiro'),
(4, 'Ana Costa', 'ana@email.com', 'senhaabc', 'morador');

INSERT INTO Usuario_Apartamentos (id_usuario, id_apartamento) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

INSERT INTO Gerenciamento (id, id_usuario, id_condominio, cargo) VALUES
(1, 2, 1, 'Síndico'),
(2, 3, 1, 'Porteiro'),
(3, 2, 2, 'Síndico'),
(4, 3, 3, 'Porteiro');


INSERT INTO Mensagens (id, id_remetente, id_destinatario, mensagem, data_envio) VALUES
(1, 1, 2, 'A luz do corredor está queimada.', '2025-05-30 08:00:00'),
(2, 4, 2, 'Gostaria de reservar o salão.', '2025-05-30 09:00:00'),
(3, 2, 1, 'Problema resolvido, obrigado.', '2025-05-30 10:00:00'),
(4, 3, 2, 'Visitante chegou na portaria.', '2025-05-30 11:00:00');

INSERT INTO Ambientes (id, nome, descricao) VALUES
(1, 'Salão de Festas', 'Espaço para festas e eventos'),
(2, 'Churrasqueira', 'Área com churrasqueira e mesas'),
(3, 'Piscina', 'Piscina com acesso controlado'),
(4, 'Academia', 'Espaço com equipamentos de musculação');


INSERT INTO Reservas_Ambientes (id, id_ambiente, id_usuario, data_reserva, horario_inicio, horario_fim) VALUES
(1, 1, 1, '2025-06-01', '18:00:00', '22:00:00'),
(2, 2, 4, '2025-06-02', '12:00:00', '16:00:00'),
(3, 3, 1, '2025-06-03', '09:00:00', '11:00:00'),
(4, 4, 4, '2025-06-04', '07:00:00', '08:30:00');

INSERT INTO Visitantes (id, nome, documento, id_apartamento, data_visita) VALUES
(1, 'Carlos Souza', '123456789', 1, '2025-05-30'),
(2, 'Fernanda Lima', '987654321', 2, '2025-05-30'),
(3, 'Roberto Nunes', '456789123', 3, '2025-05-30'),
(4, 'Paula Dias', '654321987', 4, '2025-05-30');

INSERT INTO Notificacoes (id, id_usuario, titulo, mensagem, data_envio) VALUES
(1, 1, 'Encomenda entregue', 'Sua encomenda está na portaria.', '2025-05-30 10:15:00'),
(2, 2, 'Reunião marcada', 'Reunião marcada para dia 05/06.', '2025-05-30 11:00:00'),
(3, 4, 'Reserva confirmada', 'Sua reserva foi aprovada.', '2025-05-30 12:00:00'),
(4, 3, 'Visitante liberado', 'Visitante chegou na portaria.', '2025-05-30 12:30:00');

