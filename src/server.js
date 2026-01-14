// CARREGA VARIÁVEIS DE AMBIENTE PRIMEIRO
import './config/dotenvConfig.js';

import mongoose from 'mongoose';
import app from './app.js';
import conectaNaDatabase from './config/dbConnect.js';

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    console.log('='.repeat(50));
    console.log('🚀 INICIANDO API DE LIVRARIA');
    console.log('='.repeat(50));
    
    console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Porta: ${PORT}`);
    
    // Conecta ao banco de dados
    console.log('\n🔄 Conectando ao banco de dados...');
    await conectaNaDatabase();
    
    // Verifica status da conexão
    const estadosConexao = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    console.log(`📊 Status BD: ${estadosConexao[mongoose.connection.readyState].toUpperCase()}`);
    
    // Inicia servidor HTTP
    const servidor = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('✅ SERVIDOR INICIADO COM SUCESSO!');
      console.log('='.repeat(50));
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/livros`);
      console.log(`📋 Status: http://localhost:${PORT}/status`);
      console.log('='.repeat(50));
      console.log('\n📝 Endpoints disponíveis:');
      console.log('  GET  /              - Documentação da API');
      console.log('  GET  /status        - Health check');
      console.log('  GET  /livros        - Listar todos os livros');
      console.log('  GET  /livros/:id    - Buscar livro por ID');
      console.log('  POST /livros        - Criar novo livro');
      console.log('  PUT  /livros/:id    - Atualizar livro');
      console.log('  DELETE /livros/:id  - Deletar livro');
      console.log('  GET  /livros/busca/:termo - Buscar por texto');
      console.log('='.repeat(50));
      console.log('\n👨‍💻 Desenvolvedor: Wesley Rodrigues');
      console.log('🕐 Iniciado em:', new Date().toLocaleString());
      console.log('='.repeat(50));
    });
    
    // Configura timeout do servidor
    servidor.setTimeout(10000); // 10 segundos
    
    // ========== GRACEFUL SHUTDOWN ==========
    
    const shutdown = async (signal) => {
      console.log(`\n\n${'⚠️ '.repeat(10)}`);
      console.log(`Recebido sinal: ${signal}`);
      console.log('Iniciando shutdown gracioso...');
      
      // Fecha servidor HTTP
      servidor.close(async () => {
        console.log('✅ Servidor HTTP fechado');
        
        // Fecha conexão com MongoDB
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('✅ Conexão MongoDB fechada');
        }
        
        console.log('👋 Shutdown completo. Até logo!');
        process.exit(0);
      });
      
      // Timeout de força
      setTimeout(() => {
        console.error('❌ Timeout no shutdown - forçando saída');
        process.exit(1);
      }, 10000);
    };
    
    // Captura sinais de término
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Tratamento de erros não capturados
    process.on('uncaughtException', (erro) => {
      console.error('💥 ERRO NÃO CAPTURADO:', erro);
      shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (razao, promise) => {
      console.error('💥 PROMISE REJEITADA NÃO TRATADA:', razao);
      shutdown('unhandledRejection');
    });
    
  } catch (erro) {
    console.error('\n' + '💥'.repeat(10));
    console.error('FALHA CRÍTICA AO INICIAR APLICAÇÃO:');
    console.error('Mensagem:', erro.message);
    console.error('Stack:', erro.stack);
    console.error('💥'.repeat(10));
    
    // Dicas de solução
    if (erro.message.includes('MongoNetworkError')) {
      console.log('\n🔍 DICAS PARA SOLUÇÃO:');
      console.log('1. Verifique sua conexão com a internet');
      console.log('2. Confirme se o MongoDB Atlas está acessível');
      console.log('3. Verifique se seu IP está na whitelist do Atlas');
      console.log('4. Confirme usuário e senha no arquivo .env');
    }
    
    process.exit(1);
  }
}

// Inicia a aplicação
iniciarServidor();