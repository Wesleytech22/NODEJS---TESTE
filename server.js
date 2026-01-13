import app from "./src/app.js";
import conectaNaDatabase from "./src/config/dbConnect.js";

const PORT = 3000;

async function bootstrap() {
    try {
        console.log("🚀 Iniciando aplicação...");
        
        // Conecta ao banco
        await conectaNaDatabase();
        
        console.log("✅ Banco de dados conectado com sucesso!");
        
        // Verifica o status da conexão
        const conexaoStatus = mongoose.connection.readyState;
        console.log(`📊 Status da conexão: ${conexaoStatus}`);
        console.log(`📦 Banco: ${mongoose.connection.db?.databaseName || 'Não identificado'}`);
        
        // Inicia o servidor Express
        app.listen(PORT, () => {
            console.log(`✅ Servidor Express rodando!`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📚 Endpoint de livros: http://localhost:${PORT}/livros`);
            console.log(`🔍 Teste no Postman: GET http://localhost:${PORT}/livros`);
        });
        
        // Event listeners para monitoramento
        mongoose.connection.on("error", (erro) => {
            console.error("❌ Erro na conexão MongoDB:", erro.message);
        });
        
        mongoose.connection.on("disconnected", () => {
            console.log("⚠️  Desconectado do MongoDB");
        });
        
        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("👋 Conexão com MongoDB fechada");
            process.exit(0);
        });
        
    } catch (erro) {
        console.error("💥 Falha crítica ao iniciar aplicação:", erro.message);
        process.exit(1);
    }
}

// Importa mongoose para verificar o status
import mongoose from "mongoose";

bootstrap();