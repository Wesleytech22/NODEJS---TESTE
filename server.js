import './src/config/dotenvConfig.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Importar rotas
import authRoutes from './src/routes/authRoutes.js';
import usuarioRoutes from './src/routes/usuarioRoutes.js';
import { livroRouter } from './src/routes/livroRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Conectar ao MongoDB
async function connectDB() {
  try {
    console.log('🔗 Conectando ao MongoDB Atlas...');
    
    await mongoose.connect(process.env.DB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB conectado com sucesso!');
    console.log(`📊 Banco: ${mongoose.connection.db?.databaseName}`);
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
}

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    mensagem: '📚 API Livraria Digital',
    desenvolvedor: 'Wesley Rodrigues',
    versao: '2.0.0',
    status: 'operacional',
    ambiente: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      autenticacao: {
        registro: 'POST /api/auth/registro',
        login: 'POST /api/auth/login',
        perfil: 'GET /api/auth/perfil'
      },
      livros: {
        listar: 'GET /api/livros',
        buscar: 'GET /api/livros/:id',
        criar: 'POST /api/livros',
        atualizar: 'PUT /api/livros/:id',
        deletar: 'DELETE /api/livros/:id',
        busca: 'GET /api/livros/busca/:termo'
      }
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/livros', livroRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: `Rota ${req.originalUrl} não encontrada`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor',
    erro: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
      🚀 Servidor iniciado com sucesso!
      🌐 URL: http://localhost:${PORT}
      📚 API: http://localhost:${PORT}/api
      `);
    });
    
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();