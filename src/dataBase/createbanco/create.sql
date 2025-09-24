-- 1 - CONDOMINIO
CREATE TABLE Condominio (
    cond_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_nome VARCHAR(60) NOT NULL,
    cond_endereco VARCHAR(130),
    cond_cidade VARCHAR(60)
) ENGINE=InnoDB;

-- 2 - USUARIOS
CREATE TABLE Usuarios (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_nome VARCHAR(60) NOT NULL,
    user_email VARCHAR(60) UNIQUE NOT NULL,
    user_senha VARCHAR(60) NOT NULL,
    user_telefone VARCHAR(30),
    user_tipo ENUM('ADM', 'Sindico', 'Funcionario', 'Morador') NOT NULL
) ENGINE=InnoDB;

-- 3 - GERENCIAMENTO
CREATE TABLE Gerenciamento (
    ger_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    ger_data DATE,
    ger_descricao VARCHAR(60),
    ger_valor DECIMAL(10,3),
    FOREIGN KEY (cond_id) REFERENCES Condominio(cond_id)
) ENGINE=InnoDB;

-- 4 - BLOCO
CREATE TABLE Bloco (
    bloc_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    bloc_nome VARCHAR(60),
    FOREIGN KEY (cond_id) REFERENCES Condominio(cond_id)
) ENGINE=InnoDB;

-- 5 - AMBIENTES
CREATE TABLE Ambientes (
    amd_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    amd_descricao VARCHAR(100),
    amd_nome VARCHAR(40),
    amd_capacidade INT,
    FOREIGN KEY (cond_id) REFERENCES Condominio(cond_id)
) ENGINE=InnoDB;

-- 6 – APARTAMENTOS’
CREATE TABLE Apartamentos (
    ap_id INT AUTO_INCREMENT PRIMARY KEY,
    bloco_id INT NOT NULL,
    ap_numero VARCHAR(15) NOT NULL,
    ap_andar INT,
    FOREIGN KEY (bloco_id) REFERENCES Bloco(bloc_id)
) ENGINE=InnoDB;

-- 7 - VISITANTES
CREATE TABLE Visitantes (
    vst_id INT AUTO_INCREMENT PRIMARY KEY,
    vst_nome VARCHAR(60) NOT NULL,
    vst_documento VARCHAR(60),
    ap_id INT NOT NULL,
    vst_data_visita DATETIME,
    vst_data_saida DATETIME,
    FOREIGN KEY (ap_id) REFERENCES Apartamentos(ap_id)
) ENGINE=InnoDB;

-- 8 - USUARIO_APARTAMENTOS
CREATE TABLE Usuario_Apartamentos (
    userap_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ap_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Usuarios(user_id),
    FOREIGN KEY (ap_id) REFERENCES Apartamentos(ap_id)
) ENGINE=InnoDB;

-- 9 - ENCOMENDAS
CREATE TABLE Encomendas (
    enc_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    enc_nome_loja VARCHAR(225),
    enc_codigo_rastreio VARCHAR(225),
    enc_status ENUM('Aguardando', 'Entregue') DEFAULT 'Aguardando',
    enc_data_chegada DATETIME,
    enc_data_retirada DATETIME,
    FOREIGN KEY (userap_id) REFERENCES Usuario_Apartamentos(userap_id)
) ENGINE=InnoDB;

-- 10 - MENSAGENS
CREATE TABLE Mensagens (
    msg_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    userap_id INT NOT NULL,
    msg_mensagem VARCHAR(130) NOT NULL,
    msg_data_envio DATETIME,
    msg_status ENUM('Enviada', 'Lida', 'Pendente') DEFAULT 'Enviada',
    FOREIGN KEY (cond_id) REFERENCES Condominio(cond_id),
    FOREIGN KEY (userap_id) REFERENCES Usuario_Apartamentos(userap_id)
) ENGINE=InnoDB;

-- 11 - NOTIFICACOES
CREATE TABLE Notificacoes (
    not_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    not_titulo VARCHAR(100) NOT NULL, -- Novo campo para título da notificação
    not_mensagem TEXT NOT NULL,
    not_data_envio DATETIME,
    not_lida TINYINT(1) DEFAULT 0,
    not_prioridade ENUM('Baixa', 'Media', 'Alta') DEFAULT 'Media' NOT NULL, -- Novo campo para prioridade
    not_tipo ENUM('Entrega', 'Aviso', 'Mensagem') NOT NULL,
    FOREIGN KEY (userap_id) REFERENCES Usuario_Apartamentos(userap_id)
) ENGINE=InnoDB;

-- 12 - RESERVAS_AMBIENTES
CREATE TABLE Reservas_Ambientes (
    res_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    amd_id INT NOT NULL,
    res_horario_inicio TIME NOT NULL,
    res_horario_fim TIME NOT NULL,
    res_data_reserva DATE NOT NULL,
    res_status ENUM('Reservado', 'Cancelado') DEFAULT 'Reservado',
    FOREIGN KEY (userap_id) REFERENCES Usuario_Apartamento(userap_id),
    FOREIGN KEY (amd_id) REFERENCES Ambientes(amd_id)
) ENGINE=InnoDB;

-- 13 - OCORRENCIAS
CREATE TABLE Ocorrencias (
    oco_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    oco_protocolo VARCHAR(50) UNIQUE NOT NULL,
    oco_categoria VARCHAR(50) NOT NULL,
    oco_descricao TEXT NOT NULL,
    oco_localizacao VARCHAR(100),
    oco_data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    oco_status ENUM('Aberta', 'Em Andamento', 'Resolvida', 'Cancelada') DEFAULT 'Aberta',
    oco_prioridade ENUM('Baixa', 'Média', 'Alta', 'Urgente') DEFAULT 'Média',
    oco_imagem VARCHAR(255),
    FOREIGN KEY (userap_id) REFERENCES Usuario_Apartamentos(userap_id)
) ENGINE=InnoDB;

-- 14 - DOCUMENTOS
CREATE TABLE Documentos (
    doc_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    doc_nome VARCHAR(100) NOT NULL,
    doc_categoria VARCHAR(50) NOT NULL,
    doc_data DATE NOT NULL,
    doc_tamanho VARCHAR(20),
    doc_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (cond_id) REFERENCES Condominio(cond_id)
) ENGINE=InnoDB;
