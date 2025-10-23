// function verificarPermissao(permitidos = []) {
//   return (req, res, next) => {
//     const tipo = req.user?.tipo;

//     if (!tipo) {
//       return res.status(403).json({ sucesso: false, mensagem: 'Tipo de usuário não identificado.' });
//     }

//     // Síndico tem acesso total
//     if (tipo === 'sindico') return next();

//     // Se o tipo atual não estiver na lista de permitidos, bloqueia
//     if (!permitidos.includes(tipo)) {
//       return res.status(403).json({
//         sucesso: false,
//         mensagem: 'Acesso negado para este tipo de usuário.'
//       });
//     }

//     next();
//   };
// }

// module.exports = verificarPermissao;