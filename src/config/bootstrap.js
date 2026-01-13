import app from "./src/app.js";
import conectaNaDatabase from "./src/config/dbConnect.js";

const PORT = 3000;

async function bootstrap() {
    try {
        console.log("🚀 Iniciando aplicação...");
        
        // Conecta ao banco
        const conexao = await conectaNaDatabase();
        
        // Event listeners para monitorar a conexão
        conexao.on("error", (erro) => {
            console.error("❌ Erro na conexão com MongoDB:", erro.message);
        });
        
        conexao.on("disconnected", () => {
            console.log("⚠️  Desconectado do MongoDB");
        });
        
        conexao.once("open", () => {
            console.log(`📊 Banco de dados: ${conexao.db.databaseName}`);
            
            // Inicia o servidor somente após conexão bem-sucedida
            app.listen(PORT, () => {
                console.log(`✅ Servidor rodando!`);
                console.log(`🌐 Acesse: http://localhost:${PORT}`);
                console.log(`📚 Endpoint livros: http://localhost:${PORT}/livros`);
            });
        });
        
        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("👋 Conexão com MongoDB fechada");
            process.exit(0);
        });
        
    } catch (erro) {
        console.error("💥 Falha crítica ao iniciar aplicação:", erro.message);
        process.exit(1); // Encerra o processo com erro
    }
}

bootstrap();