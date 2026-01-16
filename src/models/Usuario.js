import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UsuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome é obrigatório'],
      trim: true,
      minlength: [2, 'Nome muito curto'],
      maxlength: [100, 'Nome muito longo'],
    },
    email: {
      type: String,
      required: [true, 'O email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    senha: {
      type: String,
      required: [true, 'A senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false, // Não retorna senha nas queries
    },
    role: {
      type: String,
      enum: ['usuario', 'admin'],
      default: 'usuario',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    ultimoAcesso: {
      type: Date,
      default: Date.now,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Hash da senha antes de salvar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (erro) {
    next(erro);
  }
});

// Método para comparar senhas
UsuarioSchema.methods.compararSenha = async function (senhaCandidata) {
  return await bcrypt.compare(senhaCandidata, this.senha);
};

// Atualiza último acesso
UsuarioSchema.methods.atualizarUltimoAcesso = function () {
  this.ultimoAcesso = new Date();
  return this.save();
};

const Usuario = mongoose.model('Usuario', UsuarioSchema, 'Usuarios');

export default Usuario;