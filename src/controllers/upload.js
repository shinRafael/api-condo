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

module.exports = { upload, uploadPerfil, uploadAnexo };
