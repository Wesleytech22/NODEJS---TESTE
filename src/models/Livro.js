import mongoose from "mongoose";

const LivroSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    titulo: { type: String, required: true },
    editora: { type: String },
    preco: { type: Number },
    paginas: { type: Number }
}, { versionKey: false });

// O terceiro parâmetro "Livros" é a chave para encontrar seus dados existentes
const livro = mongoose.model("Livros", LivroSchema, "Livros");

export default livro;