import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
      index: true,
    },
    senha: {
      type: String,
      required: [true, 'A senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false,
    },
    telefone: {
      type: String,
      trim: true,
    },
    endereco: {
      rua: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String,
      cep: String,
    },
    dataNascimento: {
      type: Date,
    },
    genero: {
      type: String,
      enum: ['masculino', 'feminino', 'outro', 'prefiro não informar'],
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['usuario', 'admin'],
      default: 'usuario',
    },
    ultimoLogin: {
      type: Date,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    emailVerificado: {
      type: Boolean,
      default: false,
    },
    preferencias: {
      notificacoesEmail: { type: Boolean, default: true },
      notificacoesPush: { type: Boolean, default: true },
      tema: { type: String, enum: ['claro', 'escuro', 'auto'], default: 'claro' },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date,
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Middleware para hash da senha
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

// Gerar token JWT
UsuarioSchema.methods.gerarAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      nome: this.nome,
      role: this.role,
    },
    process.env.JWT_SECRET || 'seu_segredo_super_secreto_aqui',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Gerar token para reset de senha
UsuarioSchema.methods.gerarResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos
  
  return resetToken;
};

// Atualizar último login
UsuarioSchema.methods.atualizarUltimoLogin = function () {
  this.ultimoLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Método para obter dados públicos (sem informações sensíveis)
UsuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.senha;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  return obj;
};

const Usuario = mongoose.model('Usuario', UsuarioSchema, 'Usuarios');

export default Usuario;