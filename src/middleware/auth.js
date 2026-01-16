import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Acesso negado. Token não fornecido.',
        codigo: 'TOKEN_MISSING',
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_super_secreto_aqui');
      
      const usuario = await Usuario.findById(decoded.id).select('-senha');
      
      if (!usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado',
          codigo: 'USER_NOT_FOUND',
        });
      }
      
      if (!usuario.ativo) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Conta desativada',
          codigo: 'ACCOUNT_DISABLED',
        });
      }
      
      req.usuario = usuario;
      req.token = token;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Token expirado',
          codigo: 'TOKEN_EXPIRED',
        });
      }
      
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido',
        codigo: 'TOKEN_INVALID',
      });
    }
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro na autenticação',
      codigo: 'AUTH_ERROR',
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      sucesso: false,
      mensagem: 'Acesso negado. Permissão de administrador necessária.',
      codigo: 'ADMIN_REQUIRED',
    });
  }
};