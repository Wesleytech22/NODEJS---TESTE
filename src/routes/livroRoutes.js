import express from 'express';
import Livro from '../models/Livro.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware de autenticação
const autenticarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido ou expirado',
      });
    }
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro na autenticação',
    });
  }
};

// GET todos os livros
router.get('/', async (req, res) => {
  try {
    const { pagina = 1, limite = 10 } = req.query;
    const paginaNum = parseInt(pagina);
    const limiteNum = Math.min(100, parseInt(limite));
    const skip = (paginaNum - 1) * limiteNum;
    
    const [livros, total] = await Promise.all([
      Livro.find().skip(skip).limit(limiteNum).lean(),
      Livro.countDocuments(),
    ]);
    
    res.json({
      sucesso: true,
      dados: livros,
      meta: {
        total,
        pagina: paginaNum,
        limite: limiteNum,
        totalPaginas: Math.ceil(total / limiteNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar livros',
    });
  }
});

// GET livro por ID
router.get('/:id', async (req, res) => {
  try {
    const livro = await Livro.findById(req.params.id);
    
    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
      });
    }
    
    res.json({
      sucesso: true,
      dados: livro,
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar livro',
    });
  }
});

// POST criar livro (autenticado)
router.post('/', autenticarToken, async (req, res) => {
  try {
    const livro = new Livro(req.body);
    const livroSalvo = await livro.save();
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Livro criado com sucesso',
      dados: livroSalvo,
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: error.message,
    });
  }
});

// PUT atualizar livro (autenticado)
router.put('/:id', autenticarToken, async (req, res) => {
  try {
    const livro = await Livro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Livro atualizado com sucesso',
      dados: livro,
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: error.message,
    });
  }
});

// DELETE livro (autenticado)
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const livro = await Livro.findByIdAndDelete(req.params.id);
    
    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Livro deletado com sucesso',
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar livro',
    });
  }
});

// GET busca livros
router.get('/busca/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    
    const livros = await Livro.find({
      $or: [
        { titulo: { $regex: termo, $options: 'i' } },
        { autor: { $regex: termo, $options: 'i' } },
        { editora: { $regex: termo, $options: 'i' } },
      ],
    }).limit(20);
    
    res.json({
      sucesso: true,
      termo,
      resultados: livros.length,
      dados: livros,
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro na busca',
    });
  }
});

export const livroRouter = router;
export default router;