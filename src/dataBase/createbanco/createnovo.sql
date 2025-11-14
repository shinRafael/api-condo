A Ordem Correta das Tabelas
Aqui está a sequência correta para criar todas as suas tabelas, respeitando todas as dependências:

Condominio (Não depende de ninguém)

Usuarios (Não depende de ninguém)

Gerenciamento (Depende do Condominio)

Bloco (Depende do Condominio)

Ambientes (Depende do Condominio)

Apartamentos (Depende do Bloco)

Usuario_Apartamentos (Depende de Usuarios e Apartamentos)

Visitantes (Agora depende de Usuario_Apartamentos)

Encomendas (Depende de Usuario_Apartamentos)

Mensagens (Depende de Condominio e Usuario_Apartamentos)

Notificacoes (Depende de Usuario_Apartamentos)

Reservas_Ambientes (Depende de Usuario_Apartamentos e Ambientes)

Ocorrencias (Depende de Usuario_Apartamentos)

Documentos (Depende de Condominio)

Dicionário de Dados Completo e na Ordem Correta
Aqui está seu dicionário de dados completo, reorganizado na ordem correta de execução e com um pequeno ajuste no nome da tabela Reservas_Ambientes para consistência.

SQL

-- 1 - CONDOMINIO (Tabela Mãe)
CREATE TABLE condominio (
    cond_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_nome VARCHAR(60) NOT NULL,
    cond_endereco VARCHAR(130),
    cond_cidade VARCHAR(60),
    cond_estado VARCHAR(2),
    cond_taxa_base DECIMAL(10, 2) DEFAULT 0.00 -- ✅ ADICIONADO: Valor da taxa condominial base
) ENGINE=InnoDB;

-- 2 - USUARIOS (Tabela Mãe)
CREATE TABLE usuarios (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_nome VARCHAR(60) NOT NULL,
    user_email VARCHAR(60) UNIQUE NOT NULL,
    user_senha VARCHAR(60) NOT NULL,
    user_telefone VARCHAR(30),
    user_tipo ENUM('ADM', 'Sindico', 'Funcionario', 'Morador') NOT NULL,
    user_foto VARCHAR(255) NULL DEFAULT NULL, -- ✅ ADICIONADO: URL/Caminho para foto de perfil
    user_push_token VARCHAR(255) NULL UNIQUE,
    user_data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_reset_token VARCHAR(10) NULL, -- ✅ ADICIONADO: Token para recuperação de senha
    user_reset_expires DATETIME NULL -- ✅ ADICIONADO: Data de expiração do token
) ENGINE=InnoDB;

-- 3 - GERENCIAMENTO (Depende de 'condominio')
CREATE TABLE gerenciamento (
    ger_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    ger_data DATE,
    ger_descricao VARCHAR(60),
    ger_valor DECIMAL(10,2),
    FOREIGN KEY (cond_id) REFERENCES condominio(cond_id)
) ENGINE=InnoDB;

-- 4 - BLOCO (Depende de 'condominio')
CREATE TABLE bloco (
    bloc_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    bloc_nome VARCHAR(60),
    FOREIGN KEY (cond_id) REFERENCES condominio(cond_id)
) ENGINE=InnoDB;

-- 5 - AMBIENTES (Depende de 'condominio')
CREATE TABLE ambientes (
    amd_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    amd_descricao VARCHAR(100),
    amd_nome VARCHAR(40),
    amd_capacidade INT,
    FOREIGN KEY (cond_id) REFERENCES condominio(cond_id)
) ENGINE=InnoDB;

-- 6 - DOCUMENTOS (Depende de 'condominio')
CREATE TABLE documentos (
    doc_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    doc_nome VARCHAR(100) NOT NULL,
    doc_categoria VARCHAR(50) NOT NULL,
    doc_data DATE NOT NULL,
    doc_tamanho VARCHAR(20),
    doc_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (cond_id) REFERENCES condominio(cond_id)
) ENGINE=InnoDB;

-- 7 - APARTAMENTOS (Depende de 'bloco')
CREATE TABLE apartamentos (
    ap_id INT AUTO_INCREMENT PRIMARY KEY,
    bloc_id INT NOT NULL,
    ap_numero VARCHAR(15) NOT NULL,
    ap_andar INT,
    FOREIGN KEY (bloc_id) REFERENCES bloco(bloc_id)
) ENGINE=InnoDB;

-- 8 - USUARIO_APARTAMENTOS (Tabela de Ligação)
CREATE TABLE usuario_apartamentos (
    userap_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ap_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id),
    FOREIGN KEY (ap_id) REFERENCES apartamentos(ap_id)
) ENGINE=InnoDB;

-- 9 - VISITANTES (Depende de 'usuario_apartamentos')
CREATE TABLE visitantes (
    vst_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    vst_nome VARCHAR(60) NOT NULL,
    vst_documento VARCHAR(20) NULL,
    vst_celular VARCHAR(20) NULL,
    vst_validade_inicio DATETIME NOT NULL,
    vst_validade_fim DATETIME NOT NULL,
    vst_qrcode_hash VARCHAR(255) NOT NULL UNIQUE,
    vst_status VARCHAR(30) NOT NULL DEFAULT 'Aguardando',
    vst_data_entrada DATETIME NULL,
    vst_data_saida DATETIME NULL,
    FOREIGN KEY (userap_id) REFERENCES usuario_apartamentos(userap_id)
) ENGINE=InnoDB;

-- 10 - ENCOMENDAS (Depende de 'usuario_apartamentos')
CREATE TABLE encomendas (
    enc_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    enc_nome_loja VARCHAR(225),
    enc_codigo_rastreio VARCHAR(225),
    enc_status ENUM('Aguardando', 'Entregue') DEFAULT 'Aguardando',
    enc_data_chegada DATETIME,
    enc_data_retirada DATETIME,
    FOREIGN KEY (userap_id) REFERENCES usuario_apartamentos(userap_id)
) ENGINE=InnoDB;

-- 11 - NOTIFICACOES (Depende de 'usuario_apartamentos')
CREATE TABLE notificacoes (
    not_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    not_titulo VARCHAR(100) NOT NULL,
    not_mensagem TEXT NOT NULL,
    not_data_envio DATETIME,
    not_lida TINYINT(1) DEFAULT 0,
    not_prioridade ENUM('Baixa', 'Media', 'Alta') DEFAULT 'Media' NOT NULL,
    not_tipo ENUM('Entrega', 'Aviso', 'Mensagem') NOT NULL,
    FOREIGN KEY (userap_id) REFERENCES usuario_apartamentos(userap_id)
) ENGINE=InnoDB;

-- 12 - RESERVAS_AMBIENTES (Depende de 'usuario_apartamentos' e 'ambientes')
CREATE TABLE reservas_ambientes (
    res_id INT AUTO_INCREMENT PRIMARY KEY,
    userap_id INT NOT NULL,
    amd_id INT NOT NULL,
    res_horario_inicio TIME NOT NULL,
    res_horario_fim TIME NOT NULL,
    res_data_reserva DATE NOT NULL,
    res_status ENUM('Pendente', 'Reservado', 'Cancelado') DEFAULT 'Reservado',
    FOREIGN KEY (userap_id) REFERENCES usuario_apartamentos(userap_id),
    FOREIGN KEY (amd_id) REFERENCES ambientes(amd_id)
) ENGINE=InnoDB;

-- 13 - OCORRENCIAS (Depende de 'usuario_apartamentos')
-- (Deve ser criada ANTES de 'mensagens' e 'ocorrencia_mensagens')
CREATE TABLE ocorrencias (
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
    FOREIGN KEY (userap_id) REFERENCES usuario_apartamentos(userap_id)
) ENGINE=InnoDB;

-- 14 - MENSAGENS (Depende de 'condominio', 'usuario_apartamentos' e 'ocorrencias')
CREATE TABLE mensagens (
    msg_id INT AUTO_INCREMENT PRIMARY KEY,
    cond_id INT NOT NULL,
    userap_id INT NOT NULL,
    msg_mensagem VARCHAR(130) NOT NULL,
    msg_data_envio DATETIME,
    msg_status ENUM('Enviada', 'Lida', 'Pendente') DEFAULT 'Enviada',
    oco_id INT NULL,
    FOREIGN KEY (cond_id) REFERENCES condominio(cond_id),
    FOREIGN KEY (userap_id) REFERENCES usuario_apartamentos(userap_id),
    FOREIGN KEY (oco_id) REFERENCES ocorrencias(oco_id)
) ENGINE=InnoDB;

-- 15 - OCORRENCIA_MENSAGENS (Depende de 'ocorrencias' e 'usuarios')
CREATE TABLE ocorrencia_mensagens (
    ocomsg_id INT AUTO_INCREMENT PRIMARY KEY,
    oco_id INT NOT NULL,
    user_id INT NOT NULL, 
    ocomsg_mensagem TEXT NOT NULL,
    ocomsg_data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ocomsg_lida TINYINT(1) DEFAULT 0, 
    FOREIGN KEY (oco_id) REFERENCES ocorrencias(oco_id) ON DELETE CASCADE, 
    FOREIGN KEY (user_id) REFERENCES usuarios(user_id)
) ENGINE=InnoDB;

CREATE INDEX idx_oco_id ON ocorrencia_mensagens (oco_id);