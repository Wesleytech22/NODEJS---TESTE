import express from 'express';
import Usuario from '../models/Usuario.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/usuarios - Listar usuários (apenas admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { pagina = 1, limite = 20, ativo, role } = req.query;
    const paginaNum = parseInt(pagina);
    const limiteNum = Math.min(100, parseInt(limite));
    const skip = (paginaNum - 1) * limiteNum;
    
    // Construir filtro
    const filtro = {};
    
    if (ativo !== undefined) {
      filtro.ativo = ativo === 'true';
    }
    
    if (role) {
      filtro.role = role;
    }
    
    const [usuarios, total] = await Promise.all([
      Usuario.find(filtro)
        .select('-senha -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limiteNum)
        .lean(),
      Usuario.countDocuments(filtro),
    ]);
    
    const totalPaginas = Math.ceil(total / limiteNum);
    
    res.json({
      sucesso: true,
      dados: usuarios,
      meta: {
        total,
        pagina: paginaNum,
        limite: limiteNum,
        totalPaginas,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// GET /api/usuarios/:id - Obter usuário por ID (apenas admin ou próprio usuário)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar permissão
    if (req.usuario.role !== 'admin' && req.usuario._id.toString() !== id) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado',
        codigo: 'FORBIDDEN',
      });
    }
    
    const usuario = await Usuario.findById(id)
      .select('-senha -resetPasswordToken -resetPasswordExpire');
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado',
        codigo: 'USER_NOT_FOUND',
      });
    }
    
    res.json({
      sucesso: true,
      dados: {
        usuario,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário (apenas admin ou próprio usuário)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar permissão
    if (req.usuario.role !== 'admin' && req.usuario._id.toString() !== id) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado',
        codigo: 'FORBIDDEN',
      });
    }
    
    // Campos que apenas admin pode modificar
    const camposAdmin = ['role', 'ativo', 'emailVerificado'];
    const camposUsuario = ['nome', 'telefone', 'dataNascimento', 'genero', 'endereco', 'avatarUrl', 'preferencias'];
    
    // Filtrar campos baseado na permissão
    const camposPermitidos = req.usuario.role === 'admin' 
      ? [...camposAdmin, ...camposUsuario]
      : camposUsuario;
    
    const camposAtualizar = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        camposAtualizar[campo] = req.body[campo];
      }
    });
    
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      camposAtualizar,
      { new: true, runValidators: true }
    ).select('-senha -resetPasswordToken -resetPasswordExpire');
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado',
        codigo: 'USER_NOT_FOUND',
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso',
      dados: {
        usuario,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    
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

// DELETE /api/usuarios/:id - Desativar usuário (não deletar)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar permissão
    if (req.usuario.role !== 'admin' && req.usuario._id.toString() !== id) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado',
        codigo: 'FORBIDDEN',
      });
    }
    
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { ativo: false },
      { new: true }
    ).select('-senha');
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado',
        codigo: 'USER_NOT_FOUND',
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Usuário desativado com sucesso',
      dados: {
        usuario,
      },
    });
    
  } catch (error) {
    console.error('❌ Erro ao desativar usuário:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
    });
  }
});

export default router;