import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Usuario from '../models/Usuario.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    
    // Validação
    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome, email e senha são obrigatórios',
        codigo: 'VALIDATION_ERROR',
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
    
    // Criar usuário
    const usuario = await Usuario.create({
      nome,
      email,
      senha,
      telefone,
    });
    
    // Gerar token
    const token = usuario.gerarAuthToken();
    
    // Atualizar último login
    await usuario.atualizarUltimoLogin();
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário registrado com sucesso!',
      dados: {
        token,
        usuario: usuario.toJSON(),
      },
      meta: {
        tokenTipo: 'Bearer',
        expiraEm: '7 dias',
      },
    });
    
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    
    if (error.name === 'ValidationError') {
      const erros = Object.values(error.errors).map(err => ({
        campo: err.path,
        mensagem: err.message,
      }));
      
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Erro de validação',
        erros,
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email já está em uso',
        codigo: 'DUPLICATE_EMAIL',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR',
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
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    // Buscar usuário com senha
    const usuario = await Usuario.findOne({ email }).select('+senha');
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas',
        codigo: 'INVALID_CREDENTIALS',
      });
    }
    
    // Verificar senha
    const senhaValida = await usuario.compararSenha(senha);
    
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas',
        codigo: 'INVALID_CREDENTIALS',
      });
    }
    
    // Verificar se conta está ativa
    if (!usuario.ativo) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Conta desativada. Entre em contato com o suporte.',
        codigo: 'ACCOUNT_DISABLED',
      });
    }
    
    // Gerar token
    const token = usuario.gerarAuthToken();
    
    // Atualizar último login
    await usuario.atualizarUltimoLogin();
    
    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      dados: {
        token,
        usuario: usuario.toJSON(),
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

// GET /api/auth/perfil - Obter perfil do usuário logado
router.get('/perfil', auth, async (req, res) => {
  try {
    res.json({
      sucesso: true,
      mensagem: 'Perfil do usuário',
      dados: {
        usuario: req.usuario,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// PUT /api/auth/perfil - Atualizar perfil do usuário
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, telefone, dataNascimento, genero, endereco, preferencias } = req.body;
    
    const camposPermitidos = [
      'nome',
      'telefone',
      'dataNascimento',
      'genero',
      'endereco',
      'avatarUrl',
      'preferencias',
    ];
    
    // Filtrar apenas os campos permitidos
    const camposAtualizar = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        camposAtualizar[campo] = req.body[campo];
      }
    });
    
    // Não permitir atualizar email via esta rota
    if (req.body.email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Para alterar o email, utilize a rota específica',
        codigo: 'EMAIL_CHANGE_NOT_ALLOWED',
      });
    }
    
    // Atualizar usuário
    const usuarioAtualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      camposAtualizar,
      { new: true, runValidators: true }
    ).select('-senha');
    
    res.json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso!',
      dados: {
        usuario: usuarioAtualizado,
      },
      meta: {
        atualizadoEm: new Date(),
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    
    if (error.name === 'ValidationError') {
      const erros = Object.values(error.errors).map(err => ({
        campo: err.path,
        mensagem: err.message,
      }));
      
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Erro de validação',
        erros,
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// PUT /api/auth/alterar-senha - Alterar senha
router.put('/alterar-senha', auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    
    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Senha atual e nova senha são obrigatórias',
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    if (novaSenha.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nova senha deve ter no mínimo 6 caracteres',
        codigo: 'PASSWORD_TOO_SHORT',
      });
    }
    
    // Buscar usuário com senha
    const usuario = await Usuario.findById(req.usuario._id).select('+senha');
    
    // Verificar senha atual
    const senhaValida = await usuario.compararSenha(senhaAtual);
    
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Senha atual incorreta',
        codigo: 'INVALID_CURRENT_PASSWORD',
      });
    }
    
    // Atualizar senha
    usuario.senha = novaSenha;
    await usuario.save();
    
    // Gerar novo token
    const token = usuario.gerarAuthToken();
    
    res.json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso!',
      dados: {
        token,
      },
      meta: {
        mensagem: 'Por segurança, um novo token foi gerado',
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// POST /api/auth/esqueci-senha - Solicitar reset de senha
router.post('/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email é obrigatório',
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    const usuario = await Usuario.findOne({ email });
    
    // Sempre retornar sucesso (por segurança)
    if (!usuario) {
      return res.json({
        sucesso: true,
        mensagem: 'Se o email existir, você receberá instruções para resetar sua senha',
      });
    }
    
    // Gerar token de reset
    const resetToken = usuario.gerarResetPasswordToken();
    await usuario.save({ validateBeforeSave: false });
    
    // Em produção, enviar email aqui
    console.log(`🔑 Token de reset para ${email}: ${resetToken}`);
    
    res.json({
      sucesso: true,
      mensagem: 'Se o email existir, você receberá instruções para resetar sua senha',
      dados: {
        // Em desenvolvimento, retornamos o token para teste
        token: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// PUT /api/auth/reset-senha/:token - Resetar senha
router.put('/reset-senha/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { senha } = req.body;
    
    if (!senha || senha.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Senha deve ter no mínimo 6 caracteres',
        codigo: 'VALIDATION_ERROR',
      });
    }
    
    // Hash do token para comparar
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const usuario = await Usuario.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    
    if (!usuario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Token inválido ou expirado',
        codigo: 'INVALID_TOKEN',
      });
    }
    
    // Atualizar senha
    usuario.senha = senha;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpire = undefined;
    await usuario.save();
    
    // Gerar novo token
    const authToken = usuario.gerarAuthToken();
    
    res.json({
      sucesso: true,
      mensagem: 'Senha resetada com sucesso!',
      dados: {
        token: authToken,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Em uma implementação real, você pode invalidar o token
    // Aqui apenas confirmamos que o logout foi bem-sucedido
    
    res.json({
      sucesso: true,
      mensagem: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

export default router;