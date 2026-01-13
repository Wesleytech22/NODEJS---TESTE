import express from "express";
import livro from "./models/Livro.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).send("Seja bem-vindo, neste servidor a API roda um CRUD de livraria.");
});

app.get("/livros", async (req, res) => {
    try {
        const listaLivros = await livro.find({});
        res.status(200).json(listaLivros);
    } catch (erro) {
        res.status(500).json({ message: "Erro ao buscar livros no banco" });
    }
});

// Outras rotas (POST, PUT, DELETE) seguem o mesmo padrão usando await livro...

export default app;

//Desenvolvedor: Wesley Rodrigues