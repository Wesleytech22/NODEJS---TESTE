import mongoose from 'mongoose';

const LivroSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'O título do livro é obrigatório'],
      trim: true,
      minlength: [2, 'Título muito curto'],
      maxlength: [200, 'Título muito longo'],
    },
    editora: {
      type: String,
      trim: true,
      default: 'Editora não informada',
    },
    preco: {
      type: Number,
      min: [0, 'Preço não pode ser negativo'],
      default: 0,
    },
    paginas: {
      type: Number,
      min: [1, 'Número de páginas inválido'],
      default: 1,
    },
    autor: {
      type: String,
      trim: true,
      default: 'Autor não informado',
    },
    anoPublicacao: {
      type: Number,
      min: [1000, 'Ano de publicação inválido'],
      max: [new Date().getFullYear(), 'Ano não pode ser no futuro'],
    },
    desenvolvedor: {
      type: String,
      trim: true,
      default: 'desenvolvedor não informado'

    },
    capaurl:{
      type: String,
      trim: true,
      default: '',
    },
    isbn: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  {
    versionKey: false, // Remove o __v do MongoDB
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  }
);

// Adiciona índice para buscas mais rápidas
LivroSchema.index({ titulo: 'text', autor: 'text', editora: 'text' });

// Middleware pré-save (opcional)
LivroSchema.pre('save', async function () {
  console.log(`📝 Salvando livro: ${this.titulo}`);
});

// Método personalizado (opcional)
LivroSchema.methods.getResumo = function () {
  return `${this.titulo} - ${this.autor} (${this.anoPublicacao || 'Ano não informado'})`;
};

// O terceiro parâmetro "Livros" especifica a collection exata
const Livro = mongoose.model('Livro', LivroSchema, 'Livros');

export default Livro;