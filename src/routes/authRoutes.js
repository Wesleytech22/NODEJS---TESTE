import express from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    
    // Validação básica
    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Todos os campos são obrigatórios',
      });
    }
    
    // Verificar se usuário já existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Email já cadastrado',
      });
    }
    
    // Criar usuário
    const usuario = await Usuario.create({
      nome,
      email,
      senha,
    });
    
    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
      },
      process.env.JWT_SECRET || 'seu_segredo_jwt_aqui',
      { expiresIn: '7d' }
    );
    
    // Remover senha da resposta
    usuario.senha = undefined;
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário registrado com sucesso',
      dados: {
        token,
        usuario,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios',
      });
    }
    
    // Buscar usuário com senha
    const usuario = await Usuario.findOne({ email }).select('+senha');
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas',
      });
    }
    
    // Verificar senha (método compararSenha será criado no modelo)
    const senhaValida = await usuario.compararSenha(senha);
    
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas',
      });
    }
    
    // Gerar token
    const token = jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
      },
      process.env.JWT_SECRET || 'seu_segredo_jwt_aqui',
      { expiresIn: '7d' }
    );
    
    // Remover senha
    usuario.senha = undefined;
    
    // Atualizar último acesso
    usuario.ultimoAcesso = new Date();
    await usuario.save();
    
    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      dados: {
        token,
        usuario,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor',
    });
  }
});

// GET /api/auth/perfil (requer token)
router.get('/perfil', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'seu_segredo_jwt_aqui'
    );
    
    // Buscar usuário
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado',
      });
    }
    
    res.json({
      sucesso: true,
      dados: {
        usuario,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token expirado',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor',
    });
  }
});

export default router;