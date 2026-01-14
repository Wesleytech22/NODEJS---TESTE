import mongoose from 'mongoose';

async function conectaNaDatabase() {
  try {
    console.log('🔗 Conectando ao MongoDB Atlas...');
    
    // Obtém string de conexão do .env
    const connectionString = process.env.DB_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error('String de conexão não encontrada. Verifique o arquivo .env');
    }
    
    // Opções recomendadas para MongoDB Atlas
    const options = {
      maxPoolSize: 10, // Número máximo de conexões no pool
      serverSelectionTimeoutMS: 5000, // Timeout de seleção de servidor
      socketTimeoutMS: 45000, // Timeout de socket
    };
    
    // Estabelece conexão
    await mongoose.connect(connectionString, options);
    
    console.log('✅ Conexão com MongoDB estabelecida!');
    console.log(`📊 Status: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    console.log(`📦 Banco: ${mongoose.connection.db?.databaseName || 'Não identificado'}`);
    
    // Event listeners para monitoramento
    mongoose.connection.on('error', (error) => {
      console.error('❌ Erro na conexão MongoDB:', error.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Desconectado do MongoDB');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔁 Reconectado ao MongoDB');
    });
    
    return mongoose.connection;
    
  } catch (erro) {
    console.error('❌ Falha na conexão com MongoDB:', erro.message);
    
    // Diagnóstico detalhado
    if (erro.message.includes('ENOTFOUND')) {
      console.error('🔍 Verifique sua conexão com a internet');
    } else if (erro.message.includes('authentication')) {
      console.error('🔍 Erro de autenticação:');
      console.error('   • Verifique usuário e senha no MongoDB Atlas');
      console.error('   • No Atlas, vá para Security > Database Access');
      console.error('   • Confirme se o IP está na Network Access whitelist');
    } else if (erro.message.includes('querySrv')) {
      console.error('🔍 Problema de DNS - tente:');
      console.error('   1. Verificar conexão com internet');
      console.error('   2. Flush DNS: ipconfig /flushdns (Windows)');
    } else if (erro.message.includes('Invalid connection string')) {
      console.error('🔍 String de conexão inválida');
      console.error('   Formato esperado: mongodb+srv://usuario:senha@cluster.mongodb.net/nome-banco');
    }
    
    throw erro; // Propaga o erro para tratamento no nível superior
  }
}

export default conectaNaDatabase;