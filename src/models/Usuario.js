// src/models/UsuarioSimple.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const UsuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'O email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    senha: {
      type: String,
      required: [true, 'A senha é obrigatória'],
    },
    telefone: String,
    role: {
      type: String,
      enum: ['usuario', 'admin'],
      default: 'usuario',
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    ultimoLogin: Date,
  },
  {
    timestamps: true,
  }
);

// NÃO USE HOOKS - vamos fazer tudo manualmente nas rotas

const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Exporte também funções auxiliares
export const hashSenha = async (senha) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(senha, salt);
};

export const compararSenha = async (senha, hash) => {
  return await bcrypt.compare(senha, hash);
};

export const gerarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
    },
    process.env.JWT_SECRET || 'seu_segredo_super_secreto_aqui',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export default Usuario;