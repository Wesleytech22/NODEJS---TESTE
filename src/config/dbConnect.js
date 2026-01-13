import mongoose from "mongoose";

async function conectaNaDatabase() {
    try {
        // String de conexão simplificada - sem opções descontinuadas
        const uri = "mongodb+srv://wesleymd:Wesley5803@livraria.r8jbgzs.mongodb.net/Livraria";
        
        console.log("🔗 Conectando ao MongoDB Atlas...");
        
        // Conexão SIMPLES - sem options descontinuadas
        await mongoose.connect(uri);
        
        console.log("✅ Conexão com MongoDB estabelecida!");
        
        return mongoose.connection;
        
    } catch (erro) {
        console.error("❌ Falha na conexão com MongoDB:", erro.message);
        
        // Diagnóstico adicional
        if (erro.message.includes("ENOTFOUND")) {
            console.error("🔍 Verifique sua conexão com a internet");
        } else if (erro.message.includes("authentication")) {
            console.error("🔍 Verifique usuário e senha no MongoDB Atlas");
        } else if (erro.message.includes("querySrv")) {
            console.error("🔍 Problema de DNS - tente usar IP direto");
        }
        
        throw erro;
    }
}

export default conectaNaDatabase;