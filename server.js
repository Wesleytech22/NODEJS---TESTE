import app from "./src/app.js";
import conectaNaDatabase from "./src/config/dbConnect.js";

const PORT = 3000;

async function bootstrap() {
    try {
        console.log("Iniciando conexão com o MongoDB Atlas...");
        const conexao = await conectaNaDatabase();

        conexao.on("error", (erro) => console.error("Erro na conexão:", erro));
        
        conexao.once("open", () => {
            console.log("Conexão com o banco realizada com sucesso!");
            
            app.listen(PORT, () => {
                console.log(`Servidor rodando! Acesse: http://localhost:${PORT}/livros`);
            });
        });

    } catch (erro) {
        console.error("Falha ao conectar no banco de dados:", erro);
    }
}

bootstrap();