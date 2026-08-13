const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// 📁 CONFIGURAÇÃO DE ARMAZENAMENTO GENÉRICO
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ============================================================
// 📸 CONFIGURAÇÃO DE ARMAZENAMENTO PARA PERFIL
// ============================================================
const storagePerfil = multer.diskStorage({
  destination: (req, file, cb) => {
    const perfilDir = path.join(__dirname, '../../uploads/perfil');
    if (!fs.existsSync(perfilDir)) {
      fs.mkdirSync(perfilDir, { recursive: true });
    }
    cb(null, perfilDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// ============================================================
// 🔍 FILTROS DE TIPOS DE ARQUIVO
// ============================================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens (JPEG, JPG, PNG) são permitidas.'));
  }
};

const fileFilterPerfil = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens (JPEG, JPG, PNG) são permitidas.'));
  }
};

// ============================================================
// 🛡️ VALIDAÇÃO DE MAGIC BYTES (conteúdo real do arquivo)
// ============================================================
// Lê os primeiros bytes do arquivo já gravado em disco e compara
// com as assinaturas (magic numbers) dos formatos reconhecidos:
//   JPEG: FF D8 FF | PNG: 89 50 4E 47 0D 0A 1A 0A
//   GIF:  47 49 46 38 ("GIF8") | PDF: 25 50 44 46 ("%PDF")
// Retorna o tipo detectado ('jpeg' | 'png' | 'gif' | 'pdf') ou null
// quando o conteúdo não corresponde a nenhuma assinatura conhecida.
const validarMagicBytes = (filePath) => {
  const buffer = Buffer.alloc(12);
  let fd;

  try {
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, 0);
  } catch (error) {
    return null;
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E &&
    buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A &&
    buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return 'png';
  }

  // GIF: 47 49 46 38 ("GIF8" — cobre GIF87a e GIF89a)
  if (buffer.toString('ascii', 0, 4) === 'GIF8') {
    return 'gif';
  }

  // PDF: 25 50 44 46 ("%PDF")
  if (buffer.toString('ascii', 0, 4) === '%PDF') {
    return 'pdf';
  }

  return null;
};

// ============================================================
// ⚙️ CONFIGURAÇÕES DO MULTER
// ============================================================
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const uploadPerfil = multer({
  storage: storagePerfil,
  fileFilter: fileFilterPerfil,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max para fotos de perfil
});

// Controller para upload de arquivo
const uploadAnexo = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Nenhum arquivo enviado' 
      });
    }

    // 🔒 Validação pós-gravação: confere se o conteúdo real (magic bytes)
    // bate com a extensão declarada — impede shell.php.jpg e similares.
    const tipoDetectado = validarMagicBytes(req.file.path);
    const extensao = path.extname(req.file.originalname).toLowerCase();

    // Tipos de conteúdo aceitos por extensão declarada
    // (para .jpg/.jpeg/.png, GIF também é aceito como imagem válida)
    const tiposAceitosPorExtensao = {
      '.jpg': ['jpeg', 'gif'],
      '.jpeg': ['jpeg', 'gif'],
      '.png': ['png', 'gif'],
      '.gif': ['gif'],
      '.pdf': ['pdf'],
    };

    const tiposAceitos = tiposAceitosPorExtensao[extensao];

    if (!tiposAceitos || !tiposAceitos.includes(tipoDetectado)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Erro ao remover arquivo rejeitado:', error);
      }
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Tipo de arquivo não suportado.'
      });
    }

    // Retorna informações do arquivo salvo
    res.status(200).json({
      sucesso: true,
      mensagem: 'Upload realizado com sucesso',
      dados: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao processar upload',
      erro: error.message 
    });
  }
};

module.exports = { upload, uploadPerfil, uploadAnexo, validarMagicBytes };
