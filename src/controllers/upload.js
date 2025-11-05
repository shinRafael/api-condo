const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração de armazenamento (local)
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

// Filtro de tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: JPEG, PNG, PDF, DOC ou DOCX'));
  }
};

// Configuração do multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
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

module.exports = { upload, uploadAnexo };
