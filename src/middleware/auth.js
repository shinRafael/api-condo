const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_trocar_em_prod';

function verificarToken(request, response, next) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({ 
            sucesso: false, 
            mensagem: 'Token de autenticação não fornecido.' 
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return response.status(401).json({ 
            sucesso: false, 
            mensagem: 'Token mal formatado. Use: Bearer <token>' 
        });
    }

    const token = parts[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        // Normaliza o tipo de usuário para minúsculas
        const normalizar = (valor) => String(valor || '').trim().toLowerCase();

        request.user = {
            ...payload,
            userId: payload.userId,
            userType: normalizar(payload.userType)
        };

        console.log(`Usuário autenticado: ${request.user.userId} (${request.user.userType})`);
        next();
    } catch (error) {
        return response.status(401).json({ 
            sucesso: false, 
            mensagem: 'Token inválido ou expirado.' 
        });
    }
}

// ====== CONTROLE DE ACESSO POR TIPO DE USUÁRIO ======

// Síndico
const isSindico = (request, response, next) => {
    const tipo = request.user?.userType;
    if (tipo === 'sindico' || tipo === 'adm') return next();

    return response.status(403).json({ 
        sucesso: false, 
        mensagem: 'Acesso negado. Requer privilégios de Síndico.' 
    });
};

// Síndico ou Funcionário (porteiro)
const isSindicoOrFuncionario = (request, response, next) => {
    const tipo = request.user?.userType;
    if (tipo === 'sindico' || tipo === 'funcionario' || tipo === 'adm') return next();

    return response.status(403).json({ 
        sucesso: false, 
        mensagem: 'Acesso negado. Requer privilégios de Síndico ou Funcionário.' 
    });
};

// Morador
const isMorador = (request, response, next) => {
    const tipo = request.user?.userType;
    if (tipo === 'morador' || tipo === 'adm') return next();

    return response.status(403).json({ 
        sucesso: false, 
        mensagem: 'Acesso negado. Requer privilégios de Morador.' 
    });
};

module.exports = {
    verificarToken,
    isSindico,
    isSindicoOrFuncionario,
    isMorador
};