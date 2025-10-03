// Este é um middleware temporário que libera todas as requisições.
function verificarToken(request, response, next) {
    console.log("Middleware de verificação pulado (modo de desenvolvimento).");
    next(); // Apenas diz para a requisição "pode passar".
}

module.exports = verificarToken;