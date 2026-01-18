// src/routes/authRoutes.js - VERSÃO SIMPLIFICADA
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Usuario, { hashSenha, compararSenha, gerarToken } from '../models/Usuario.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ========== POST /api/auth/registro ==========
router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha, confirmarSenha, telefone } = req.body;
    
    console.log('📝 Tentando registrar usuário:', { nome, email });
    
    // Validação básica
    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome, email e senha são obrigatórios',
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    // Validação de confirmação de senha
    if (senha !== confirmarSenha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'As senhas não conferem',
        codigo: 'PASSWORDS_DONT_MATCH',
      });
    }
    
    // Verificar se usuário já existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Email já cadastrado',
        codigo: 'EMAIL_EXISTS',
      });
    }
    
    // Hash da senha
    const senhaHash = await hashSenha(senha);
    
    // Criar usuário SEM HOOKS
    const usuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      telefone: telefone || '',
      role: 'usuario',
      ativo: true,
    });
    
    console.log('✅ Usuário criado com ID:', usuario._id);
    
    // Gerar token
    const token = gerarToken(usuario);
    
    // Atualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save({ validateBeforeSave: false });
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário registrado com sucesso!',
      dados: {
        token,
        usuario: {
          _id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          ativo: usuario.ativo,
          ultimoLogin: usuario.ultimoLogin,
          criadoEm: usuario.createdAt,
          atualizadoEm: usuario.updatedAt,
        },
      },
      meta: {
        tokenTipo: 'Bearer',
        expiraEm: '7 dias',
      },
    });
    
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Erro de validação: ' + error.message,
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Email já está em uso',
        codigo: 'DUPLICATE_EMAIL',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ========== POST /api/auth/login ==========
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log('🔐 Tentando login para:', email);
    
    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios',
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    // Buscar usuário
    const usuario = await Usuario.findOne({ email });
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas',
        codigo: 'INVALID_CREDENTIALS',
      });
    }
    
    // Verificar senha
    const senhaValida = await compararSenha(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas',
        codigo: 'INVALID_CREDENTIALS',
      });
    }
    
    // Verificar se conta está ativa
    if (usuario.ativo === false) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Conta desativada. Entre em contato com o suporte.',
        codigo: 'ACCOUNT_DISABLED',
      });
    }
    
    // Gerar token
    const token = gerarToken(usuario);
    
    // Atualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save({ validateBeforeSave: false });
    
    console.log('✅ Login bem-sucedido para:', email);
    
    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      dados: {
        token,
        usuario: {
          _id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          ativo: usuario.ativo,
          ultimoLogin: usuario.ultimoLogin,
          criadoEm: usuario.createdAt,
        },
      },
      meta: {
        tokenTipo: 'Bearer',
        expiraEm: '7 dias',
      },
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR',
    });
  }
});

// Exporte as rotas restantes do arquivo anterior...
// [Cole aqui o resto das rotas do authRoutes que você já tem]

export default router;