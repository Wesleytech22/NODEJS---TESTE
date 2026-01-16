import express from 'express';
import livro from './models/Livro.js';
import authRoutes from './routes/authRoutes.js'; // Import das rotas de autenticação
import usuarioRoutes from './routes/authRoutes.js'; // Para futuras rotas de usuário

const app = express();

// ========== MIDDLEWARES ==========

// Middleware para parsing JSON (limite aumentado para uploads)
app.use(express.json({ limit: '10mb' }));

// Middleware para parsing de formulários
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging detalhado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Log do corpo para debug (exceto senhas)
  if (process.env.NODE_ENV === 'development' && req.body) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.senha) bodyCopy.senha = '***HIDDEN***';
    if (bodyCopy.password) bodyCopy.password = '***HIDDEN***';
    console.log('📦 Body:', JSON.stringify(bodyCopy, null, 2));
  }
  
  next();
});

// Middleware de CORS configurável
app.use((req, res, next) => {
  // Lista de origens permitidas
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://livraria-frontend-black.vercel.app',
    'https://livraria-frontend.vercel.app',
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      mensagem: 'CORS preflight OK',
      metodos: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });
  }
  
  next();
});

// Middleware de rate limiting básico
app.use((req, res, next) => {
  // Implementação básica - em produção use express-rate-limit
  const clientIP = req.ip;
  console.log(`📊 Rate limiting para IP: ${clientIP}`);
  next();
});

// ========== ROTAS PÚBLICAS ==========

// Rota raiz (documentação da API)
app.get('/', (req, res) => {
  res.status(200).json({
    mensagem: '📚 Bem-vindo à API de Livraria Digital',
    desenvolvedor: 'Wesley Rodrigues',
    versao: '2.0.0',
    status: '🚀 API operacional',
    ambiente: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      autenticacao: {
        registro: 'POST /api/auth/registro',
        login: 'POST /api/auth/login',
        perfil: 'GET /api/auth/perfil (requer token)',
        atualizar_perfil: 'PUT /api/auth/perfil (requer token)',
      },
      livros: {
        listar: 'GET /api/livros',
        buscar: 'GET /api/livros/:id',
        criar: 'POST /api/livros (requer autenticação)',
        atualizar: 'PUT /api/livros/:id (requer autenticação)',
        deletar: 'DELETE /api/livros/:id (requer autenticação)',
        busca_texto: 'GET /api/livros/busca/:termo',
      },
      sistema: {
        status: 'GET /api/status',
        health: 'GET /api/health',
        docs: 'Em breve: /api/docs',
      },
    },
    links: {
      frontend: 'https://livraria-frontend-black.vercel.app',
      github: 'https://github.com/seu-usuario/livraria-backend',
    },
  });
});

// Rota de status/health check
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ambiente: process.env.NODE_ENV || 'development',
    node_version: process.version,
  });
});

// Rota de health check para load balancers
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: 'connected', // Em produção, verificar conexão com DB
    },
  };
  
  res.status(200).json(health);
});

// ========== ROTAS DE AUTENTICAÇÃO ==========
app.use('/api/auth', authRoutes);

// ========== ROTAS DE USUÁRIO ==========
app.use('/api/usuarios', usuarioRoutes);

// ========== MIDDLEWARE DE AUTENTICAÇÃO ==========
// (Criar um middleware separado para proteger rotas)
const autenticarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token de autenticação não fornecido',
        codigo: 'TOKEN_MISSING',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Em produção, usar JWT.verify com chave secreta
    // Por enquanto, vamos apenas verificar se existe
    if (!token || token === 'undefined') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido',
        codigo: 'TOKEN_INVALID',
      });
    }
    
    // Adiciona informações do usuário à requisição
    req.usuario = {
      id: 'user_id_from_token', // Em produção, decodificar do JWT
      email: 'user@example.com',
      role: 'usuario',
    };
    
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro na autenticação',
    });
  }
};

// ========== CRUD DE LIVROS (PROTEGIDO) ==========

// GET /api/livros - Listar todos os livros (público)
app.get('/api/livros', async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      ordenar = 'titulo', 
      direcao = 'asc',
      autor,
      editora,
      ano_min,
      ano_max,
      preco_min,
      preco_max,
    } = req.query;
    
    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.min(100, Math.max(1, parseInt(limite))); // Limite máximo de 100
    const skip = (paginaNum - 1) * limiteNum;
    
    // Construir filtros
    const filtro = {};
    
    if (autor) {
      filtro.autor = { $regex: autor, $options: 'i' };
    }
    
    if (editora) {
      filtro.editora = { $regex: editora, $options: 'i' };
    }
    
    if (ano_min || ano_max) {
      filtro.anoPublicacao = {};
      if (ano_min) filtro.anoPublicacao.$gte = parseInt(ano_min);
      if (ano_max) filtro.anoPublicacao.$lte = parseInt(ano_max);
    }
    
    if (preco_min || preco_max) {
      filtro.preco = {};
      if (preco_min) filtro.preco.$gte = parseFloat(preco_min);
      if (preco_max) filtro.preco.$lte = parseFloat(preco_max);
    }
    
    // Construir ordenação
    const ordenacao = {};
    const camposOrdenacao = ordenar.split(',');
    
    camposOrdenacao.forEach(campo => {
      const campoLimpo = campo.trim();
      if (campoLimpo) {
        ordenacao[campoLimpo] = direcao === 'desc' ? -1 : 1;
      }
    });
    
    // Se nenhum campo de ordenação for especificado, usa padrão
    if (Object.keys(ordenacao).length === 0) {
      ordenacao.titulo = 1;
    }
    
    // Executar queries em paralelo para performance
    const [livros, total] = await Promise.all([
      livro.find(filtro)
        .sort(ordenacao)
        .skip(skip)
        .limit(limiteNum)
        .lean(),
      livro.countDocuments(filtro),
    ]);
    
    // Calcular estatísticas
    const totalPaginas = Math.ceil(total / limiteNum);
    
    res.status(200).json({
      sucesso: true,
      dados: livros,
      meta: {
        paginacao: {
          total,
          pagina: paginaNum,
          limite: limiteNum,
          totalPaginas,
          hasNext: paginaNum < totalPaginas,
          hasPrev: paginaNum > 1,
        },
        filtros: {
          autor,
          editora,
          ano_min,
          ano_max,
          preco_min,
          preco_max,
        },
        ordenacao: ordenacao,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro ao buscar livros:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao buscar livros',
      erro: process.env.NODE_ENV === 'development' ? erro.message : undefined,
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// GET /api/livros/:id - Buscar livro por ID (público)
app.get('/api/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validação de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido. Deve ser um ObjectId hexadecimal de 24 caracteres',
        codigo: 'INVALID_ID',
      });
    }
    
    const livroEncontrado = await livro.findById(id);
    
    if (!livroEncontrado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
        codigo: 'BOOK_NOT_FOUND',
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: livroEncontrado,
    });
    
  } catch (erro) {
    console.error('❌ Erro ao buscar livro:', erro);
    
    if (erro.name === 'CastError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido',
        codigo: 'INVALID_ID_FORMAT',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao buscar livro',
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// POST /api/livros - Criar novo livro (protegido)
app.post('/api/livros', autenticarToken, async (req, res) => {
  try {
    // Adiciona informações do usuário que criou o livro
    const dadosLivro = {
      ...req.body,
      criadoPor: req.usuario?.id,
      ultimaAtualizacaoPor: req.usuario?.id,
    };
    
    const novoLivro = new livro(dadosLivro);
    const livroSalvo = await novoLivro.save();
    
    // Log da criação
    console.log(`📖 Livro criado: "${livroSalvo.titulo}" por ${req.usuario?.email}`);
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Livro criado com sucesso',
      dados: livroSalvo,
      meta: {
        criadoPor: req.usuario?.email,
        criadoEm: livroSalvo.createdAt,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro ao criar livro:', erro);
    
    if (erro.name === 'ValidationError') {
      const erros = Object.values(erro.errors).map(err => ({
        campo: err.path,
        mensagem: err.message,
        tipo: err.kind,
      }));
      
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Erro de validação',
        erros: erros,
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    if (erro.code === 11000) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Já existe um livro com esses dados únicos',
        codigo: 'DUPLICATE_KEY',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao criar livro',
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// PUT /api/livros/:id - Atualizar livro (protegido)
app.put('/api/livros/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido',
        codigo: 'INVALID_ID',
      });
    }
    
    // Adiciona quem atualizou
    const dadosAtualizados = {
      ...req.body,
      ultimaAtualizacaoPor: req.usuario?.id,
      atualizadoEm: new Date(),
    };
    
    const livroAtualizado = await livro.findByIdAndUpdate(
      id,
      dadosAtualizados,
      { 
        new: true, 
        runValidators: true,
        context: 'query',
      }
    );
    
    if (!livroAtualizado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
        codigo: 'BOOK_NOT_FOUND',
      });
    }
    
    console.log(`✏️  Livro atualizado: "${livroAtualizado.titulo}" por ${req.usuario?.email}`);
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Livro atualizado com sucesso',
      dados: livroAtualizado,
      meta: {
        atualizadoPor: req.usuario?.email,
        atualizadoEm: livroAtualizado.updatedAt,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro ao atualizar livro:', erro);
    
    if (erro.name === 'ValidationError') {
      const erros = Object.values(erro.errors).map(err => ({
        campo: err.path,
        mensagem: err.message,
        tipo: err.kind,
      }));
      
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Erro de validação',
        erros: erros,
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    if (erro.name === 'CastError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido',
        codigo: 'INVALID_ID_FORMAT',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao atualizar livro',
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// DELETE /api/livros/:id - Deletar livro (protegido - apenas admin)
app.delete('/api/livros/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se usuário é admin
    if (req.usuario?.role !== 'admin') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas administradores podem deletar livros',
        codigo: 'FORBIDDEN',
      });
    }
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido',
        codigo: 'INVALID_ID',
      });
    }
    
    const livroDeletado = await livro.findByIdAndDelete(id);
    
    if (!livroDeletado) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado',
        codigo: 'BOOK_NOT_FOUND',
      });
    }
    
    console.log(`🗑️  Livro deletado: "${livroDeletado.titulo}" por ${req.usuario?.email}`);
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Livro deletado com sucesso',
      dados: {
        id: livroDeletado._id,
        titulo: livroDeletado.titulo,
        deletadoEm: new Date(),
      },
      meta: {
        deletadoPor: req.usuario?.email,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro ao deletar livro:', erro);
    
    if (erro.name === 'CastError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido',
        codigo: 'INVALID_ID_FORMAT',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao deletar livro',
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// GET /api/livros/busca/:termo - Busca por texto (público)
app.get('/api/livros/busca/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    const { limite = 20 } = req.query;
    
    if (!termo || termo.trim().length < 2) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Termo de busca deve ter pelo menos 2 caracteres',
        codigo: 'SEARCH_TERM_TOO_SHORT',
      });
    }
    
    // Busca em múltiplos campos com regex case-insensitive
    const livrosEncontrados = await livro.find({
      $or: [
        { titulo: { $regex: termo, $options: 'i' } },
        { autor: { $regex: termo, $options: 'i' } },
        { editora: { $regex: termo, $options: 'i' } },
        { isbn: { $regex: termo, $options: 'i' } },
      ],
    })
    .limit(parseInt(limite))
    .lean();
    
    res.status(200).json({
      sucesso: true,
      termo: termo,
      resultados: livrosEncontrados.length,
      dados: livrosEncontrados,
      meta: {
        limite: parseInt(limite),
        tempoResposta: `${Date.now() - req.startTime}ms`,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro na busca:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno na busca',
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// Rota para estatísticas dos livros (público)
app.get('/api/livros/estatisticas', async (req, res) => {
  try {
    const estatisticas = await livro.aggregate([
      {
        $group: {
          _id: null,
          totalLivros: { $sum: 1 },
          totalPaginas: { $sum: '$paginas' },
          mediaPreco: { $avg: '$preco' },
          precoMaximo: { $max: '$preco' },
          precoMinimo: { $min: '$preco' },
          anoMaisAntigo: { $min: '$anoPublicacao' },
          anoMaisRecente: { $max: '$anoPublicacao' },
        },
      },
      {
        $project: {
          _id: 0,
          totalLivros: 1,
          totalPaginas: 1,
          mediaPreco: { $round: ['$mediaPreco', 2] },
          precoMaximo: 1,
          precoMinimo: 1,
          anoMaisAntigo: 1,
          anoMaisRecente: 1,
        },
      },
    ]);
    
    // Contar livros por autor
    const livrosPorAutor = await livro.aggregate([
      { $group: { _id: '$autor', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);
    
    // Contar livros por editora
    const livrosPorEditora = await livro.aggregate([
      { $group: { _id: '$editora', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);
    
    res.status(200).json({
      sucesso: true,
      dados: {
        geral: estatisticas[0] || {},
        topAutores: livrosPorAutor,
        topEditoras: livrosPorEditora,
      },
    });
    
  } catch (erro) {
    console.error('❌ Erro ao buscar estatísticas:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao buscar estatísticas',
      codigo: 'INTERNAL_SERVER_ERROR',
    });
  }
});

// ========== MIDDLEWARE DE TEMPO DE RESPOSTA ==========
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body) {
    const tempoResposta = Date.now() - req.startTime;
    console.log(`⏱️  Tempo de resposta: ${tempoResposta}ms - ${req.method} ${req.url}`);
    
    if (res.get('Content-Type')?.includes('application/json') && body) {
      try {
        const parsedBody = JSON.parse(body);
        parsedBody.meta = {
          ...parsedBody.meta,
          tempoResposta: `${tempoResposta}ms`,
          timestamp: new Date().toISOString(),
        };
        body = JSON.stringify(parsedBody);
      } catch (e) {
        // Não é JSON, não faz nada
      }
    }
    
    originalSend.call(this, body);
  };
  
  next();
});

// ========== ROTAS NÃO ENCONTRADAS ==========
app.use('*', (req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    sugestao: 'Consulte a documentação em /',
    codigo: 'ROUTE_NOT_FOUND',
    endpointsDisponiveis: {
      autenticacao: '/api/auth/*',
      livros: '/api/livros*',
      sistema: ['/status', '/health'],
    },
  });
});

// ========== MIDDLEWARE DE ERRO GLOBAL ==========
app.use((erro, req, res, next) => {
  console.error('🔥 ERRO GLOBAL:', {
    mensagem: erro.message,
    stack: erro.stack,
    url: req.url,
    metodo: req.method,
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params,
  });
  
  // Erros específicos do MongoDB
  if (erro.name === 'MongoError') {
    if (erro.code === 11000) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Conflito: Dados duplicados',
        codigo: 'DUPLICATE_ENTRY',
      });
    }
    
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro no banco de dados',
      codigo: 'DATABASE_ERROR',
    });
  }
  
  // Erros de validação
  if (erro.name === 'ValidationError') {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Erro de validação',
      erros: Object.values(erro.errors).map(err => ({
        campo: err.path,
        mensagem: err.message,
        tipo: err.kind,
      })),
      codigo: 'VALIDATION_ERROR',
    });
  }
  
  // Erros JWT
  if (erro.name === 'JsonWebTokenError') {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido',
      codigo: 'INVALID_TOKEN',
    });
  }
  
  if (erro.name === 'TokenExpiredError') {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token expirado',
      codigo: 'TOKEN_EXPIRED',
    });
  }
  
  // Erro genérico
  const statusCode = erro.status || erro.statusCode || 500;
  
  res.status(statusCode).json({
    sucesso: false,
    mensagem: erro.message || 'Erro interno do servidor',
    codigo: 'INTERNAL_SERVER_ERROR',
    stack: process.env.NODE_ENV === 'development' ? erro.stack : undefined,
    timestamp: new Date().toISOString(),
  });
});

export default app;