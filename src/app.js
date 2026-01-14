import express from 'express';
import livro from './models/Livro.js';

const app = express();

// Middlewares
app.use(express.json()); // Parsing de JSON
app.use(express.urlencoded({ extended: true })); // Parsing de formulários

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware de CORS (simplificado)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    mensagem: 'Bem-vindo à API de Livraria',
    desenvolvedor: 'Wesley Rodrigues',
    versao: '1.0.0',
    endpoints: {
      livros: {
        todos: 'GET /livros',
        criar: 'POST /livros',
        detalhes: 'GET /livros/:id',
        atualizar: 'PUT /livros/:id',
        deletar: 'DELETE /livros/:id',
      },
      docs: 'Em desenvolvimento',
      status: 'API operacional',
    },
  });
});

// Rota de status/health check
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ========== CRUD DE LIVROS ==========

// GET /livros - Listar todos os livros
app.get('/livros', async (req, res) => {
  try {
    const { pagina = 1, limite = 10, ordenar = 'titulo', direcao = 'asc' } = req.query;
    
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);
    const skip = (paginaNum - 1) * limiteNum;
    
    const ordenacao = {};
    ordenar.split(',').forEach(campo => {
      const campoLimpo = campo.trim();
      ordenacao[campoLimpo] = direcao === 'desc' ? -1 : 1;
    });
    
    const [livros, total] = await Promise.all([
      livro.find({})
        .sort(ordenacao)
        .skip(skip)
        .limit(limiteNum)
        .lean(), // Retorna objetos JS simples
      livro.countDocuments({}),
    ]);
    
    res.status(200).json({
      sucesso: true,
      dados: livros,
      paginacao: {
        total,
        pagina: paginaNum,
        limite: limiteNum,
        totalPaginas: Math.ceil(total / limiteNum),
        hasNext: paginaNum * limiteNum < total,
        hasPrev: paginaNum > 1,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro ao buscar livros:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao buscar livros',
      erro: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    });
  }
});

// GET /livros/:id - Buscar livro por ID
app.get('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido',
      });
    }
    
    const livroEncontrado = await livro.findById(id);
    
    if (!livroEncontrado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: livroEncontrado,
    });
    
  } catch (erro) {
    console.error('❌ Erro ao buscar livro:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao buscar livro',
    });
  }
});

// POST /livros - Criar novo livro
app.post('/livros', async (req, res) => {
  try {
    const novoLivro = new livro(req.body);
    const livroSalvo = await novoLivro.save();
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Livro criado com sucesso',
      dados: livroSalvo,
    });
    
  } catch (erro) {
    console.error('❌ Erro ao criar livro:', erro);
    
    if (erro.name === 'ValidationError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados inválidos',
        erros: Object.values(erro.errors).map(err => err.message),
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao criar livro',
    });
  }
});

// PUT /livros/:id - Atualizar livro
app.put('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    
    const livroAtualizado = await livro.findByIdAndUpdate(
      id,
      dadosAtualizados,
      { new: true, runValidators: true }
    );
    
    if (!livroAtualizado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
      });
    }
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Livro atualizado com sucesso',
      dados: livroAtualizado,
    });
    
  } catch (erro) {
    console.error('❌ Erro ao atualizar livro:', erro);
    
    if (erro.name === 'ValidationError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados inválidos',
        erros: Object.values(erro.errors).map(err => err.message),
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao atualizar livro',
    });
  }
});

// DELETE /livros/:id - Deletar livro
app.delete('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const livroDeletado = await livro.findByIdAndDelete(id);
    
    if (!livroDeletado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
      });
    }
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Livro deletado com sucesso',
      dados: livroDeletado,
    });
    
  } catch (erro) {
    console.error('❌ Erro ao deletar livro:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao deletar livro',
    });
  }
});

// Rota de busca por texto
app.get('/livros/busca/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    
    const livrosEncontrados = await livro.find(
      { $text: { $search: termo } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    res.status(200).json({
      sucesso: true,
      termo: termo,
      resultados: livrosEncontrados.length,
      dados: livrosEncontrados,
    });
    
  } catch (erro) {
    console.error('❌ Erro na busca:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno na busca',
    });
  }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: `Rota não encontrada: ${req.method} ${req.url}`,
    sugestao: 'Verifique a documentação em /',
  });
});

// Middleware de erro global
app.use((erro, req, res, next) => {
  console.error('🔥 Erro não tratado:', erro);
  
  res.status(erro.status || 500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor',
    erro: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? erro.stack : undefined,
  });
});

export default app;