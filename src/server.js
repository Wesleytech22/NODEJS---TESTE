// CARREGA VARIÁVEIS DE AMBIENTE PRIMEIRO
import './config/dotenvConfig.js';

import mongoose from 'mongoose';
import app from './app.js';
import conectaNaDatabase from './config/dbConnect.js';

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    console.log('='.repeat(50));
    console.log('🚀 INICIANDO API DE LIVRARIA DIGITAL');
    console.log('='.repeat(50));
    
    console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Porta: ${PORT}`);
    console.log(`🌍 URL Base: http://localhost:${PORT}`);
    
    // Conecta ao banco de dados
    console.log('\n🔄 Conectando ao banco de dados...');
    await conectaNaDatabase();
    
    // Verifica status da conexão
    const estadosConexao = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    const estadoAtual = estadosConexao[mongoose.connection.readyState];
    console.log(`📊 Status BD: ${estadoAtual.toUpperCase()}`);
    
    // Verifica se a conexão foi bem sucedida
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Falha na conexão com o banco de dados. Estado: ${estadoAtual}`);
    }
    
    // Exibe informações do banco
    console.log(`🗄️  Banco: ${mongoose.connection.db?.databaseName || 'Não identificado'}`);
    console.log(`👤 Host: ${mongoose.connection.host || 'Não identificado'}`);
    console.log(`🔗 Porta: ${mongoose.connection.port || 'Não identificado'}`);
    
    // Inicia servidor HTTP
    const servidor = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('✅ SERVIDOR INICIADO COM SUCESSO!');
      console.log('='.repeat(50));
      console.log(`🌐 URL Local: http://localhost:${PORT}`);
      console.log(`📚 Documentação: http://localhost:${PORT}/`);
      console.log(`📋 Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
      console.log('\n📝 ENDPOINTS DISPONÍVEIS:');
      console.log('='.repeat(40));
      console.log('🔐 AUTENTICAÇÃO:');
      console.log('  POST /api/auth/registro     - Registrar usuário');
      console.log('  POST /api/auth/login        - Login');
      console.log('  GET  /api/auth/perfil       - Perfil (token)');
      console.log('  PUT  /api/auth/perfil       - Atualizar perfil (token)');
      console.log('  PUT  /api/auth/alterar-senha - Alterar senha (token)');
      console.log('  POST /api/auth/logout       - Logout (token)');
      console.log('');
      console.log('👤 USUÁRIOS:');
      console.log('  GET  /api/usuarios          - Listar usuários (admin)');
      console.log('  GET  /api/usuarios/:id      - Buscar usuário');
      console.log('  PUT  /api/usuarios/:id      - Atualizar usuário');
      console.log('  DELETE /api/usuarios/:id    - Desativar usuário');
      console.log('');
      console.log('📚 LIVROS:');
      console.log('  GET  /api/livros            - Listar livros');
      console.log('  GET  /api/livros/:id        - Buscar livro por ID');
      console.log('  POST /api/livros            - Criar livro (token)');
      console.log('  PUT  /api/livros/:id        - Atualizar livro (token)');
      console.log('  DELETE /api/livros/:id      - Deletar livro (admin)');
      console.log('  GET  /api/livros/busca/:termo - Buscar por texto');
      console.log('  GET  /api/livros/estatisticas - Estatísticas');
      console.log('');
      console.log('⚙️  SISTEMA:');
      console.log('  GET  /status                - Status do servidor');
      console.log('  GET  /health                - Health check completo');
      console.log('='.repeat(50));
      console.log('\n👨‍💻 Desenvolvedor: Wesley Rodrigues');
      console.log('📅 Iniciado em:', new Date().toLocaleString('pt-BR'));
      console.log('⏱️  Uptime: 0 segundos');
      console.log('='.repeat(50));
      
      // Inicia timer de uptime
      const inicio = Date.now();
      setInterval(() => {
        const uptime = Math.floor((Date.now() - inicio) / 1000);
        process.stdout.write(`\r⏱️  Uptime: ${uptime} segundos`);
      }, 1000);
    });
    
    // Configuração avançada do servidor
    servidor.setTimeout(30000); // 30 segundos
    servidor.keepAliveTimeout = 65000; // 65 segundos
    servidor.headersTimeout = 66000; // 66 segundos
    
    // Configuração de limites
    servidor.maxHeadersCount = 2000;
    
    // ========== GRACEFUL SHUTDOWN ==========
    
    let isShuttingDown = false;
    
    const shutdown = async (signal, erro = null) => {
      if (isShuttingDown) {
        console.log('⚠️  Shutdown já em andamento...');
        return;
      }
      
      isShuttingDown = true;
      
      console.log(`\n\n${'⚠️ '.repeat(10)}`);
      console.log(`🚨 RECEBIDO SINAL: ${signal}`);
      
      if (erro) {
        console.error('💥 ERRO DETECTADO:', erro.message);
      }
      
      console.log('🔄 Iniciando shutdown gracioso...');
      console.log('⏳ Aguardando conexões ativas...');
      
      // Marca servidor como não aceitando novas conexões
      servidor.close(async (err) => {
        if (err) {
          console.error('❌ Erro ao fechar servidor HTTP:', err.message);
        } else {
          console.log('✅ Servidor HTTP fechado');
        }
        
        try {
          // Fecha conexão com MongoDB
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false); // false força o fechamento
            console.log('✅ Conexão MongoDB fechada');
          }
          
          // Fecha outras conexões se houver
          await Promise.all([
            // Adicione aqui outros serviços que precisam ser fechados
          ]);
          
          console.log('='.repeat(50));
          console.log('👋 SHUTDOWN COMPLETO');
          console.log('📅 Finalizado em:', new Date().toLocaleString('pt-BR'));
          console.log('='.repeat(50));
          
          process.exit(erro ? 1 : 0);
          
        } catch (closeError) {
          console.error('❌ Erro durante o shutdown:', closeError);
          process.exit(1);
        }
      });
      
      // Timeout de força
      setTimeout(() => {
        console.error('⏰ TIMEOUT NO SHUTDOWN - FORÇANDO SAÍDA');
        process.exit(1);
      }, 15000); // 15 segundos
      
      // Handle conexões pendentes
      const conexoesAtivas = [];
      servidor.getConnections((err, count) => {
        if (!err) {
          console.log(`📊 Conexões ativas: ${count}`);
          if (count > 0) {
            console.log('⏳ Aguardando conexões terminarem...');
          }
        }
      });
      
      // Interrompe novas conexões
      servidor.on('request', (req, res) => {
        if (isShuttingDown) {
          res.setHeader('Connection', 'close');
          res.writeHead(503, {
            'Content-Type': 'application/json',
            'Retry-After': '15',
          });
          res.end(JSON.stringify({
            sucesso: false,
            mensagem: 'Servidor em manutenção. Tente novamente em alguns instantes.',
            codigo: 'SERVER_SHUTDOWN',
          }));
        }
      });
    };
    
    // Captura sinais de término
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Tratamento de erros não capturados
    process.on('uncaughtException', (erro) => {
      console.error('💥 ERRO NÃO CAPTURADO (uncaughtException):', {
        mensagem: erro.message,
        stack: erro.stack,
        timestamp: new Date().toISOString(),
      });
      shutdown('uncaughtException', erro);
    });
    
    process.on('unhandledRejection', (razao, promise) => {
      console.error('💥 PROMISE REJEITADA NÃO TRATADA (unhandledRejection):', {
        razao: razao?.message || razao,
        promise: promise,
        timestamp: new Date().toISOString(),
      });
      shutdown('unhandledRejection', razao instanceof Error ? razao : new Error(String(razao)));
    });
    
    // Eventos do servidor
    servidor.on('error', (erro) => {
      console.error('❌ ERRO NO SERVIDOR:', erro);
      if (erro.code === 'EADDRINUSE') {
        console.error(`🔌 A porta ${PORT} já está em uso!`);
        console.error('💡 Tente:');
        console.error('   1. Mudar a porta no arquivo .env');
        console.error('   2. Matar o processo que está usando a porta:');
        console.error(`      lsof -i :${PORT}  # Linux/Mac`);
        console.error(`      netstat -ano | findstr :${PORT}  # Windows`);
      }
    });
    
    servidor.on('clientError', (erro, socket) => {
      console.error('❌ ERRO DE CLIENTE:', erro.message);
      if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });
    
    // Eventos da conexão MongoDB
    mongoose.connection.on('connected', () => {
      console.log('🔗 MongoDB conectado');
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado');
      if (!isShuttingDown) {
        console.log('🔄 Tentando reconectar...');
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconectado');
    });
    
    mongoose.connection.on('error', (erro) => {
      console.error('❌ ERRO NO MONGODB:', erro.message);
    });
    
    // Monitoramento de memória
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const memoria = process.memoryUsage();
        const usoMemoria = Math.round(memoria.heapUsed / 1024 / 1024);
        const totalMemoria = Math.round(memoria.heapTotal / 1024 / 1024);
        
        console.log(`🧠 Uso de memória: ${usoMemoria}MB / ${totalMemoria}MB`);
      }, 300000); // A cada 5 minutos
    }
    
    // Monitoramento de requisições
    let totalRequests = 0;
    app.use((req, res, next) => {
      totalRequests++;
      if (totalRequests % 100 === 0) {
        console.log(`📊 Total de requisições: ${totalRequests}`);
      }
      next();
    });
    
  } catch (erro) {
    console.error('\n' + '💥'.repeat(10));
    console.error('🚨 FALHA CRÍTICA AO INICIAR APLICAÇÃO');
    console.error('='.repeat(50));
    console.error('📅 Hora:', new Date().toLocaleString('pt-BR'));
    console.error('📝 Mensagem:', erro.message);
    console.error('🔍 Tipo:', erro.name);
    console.error('📂 Stack:', erro.stack?.split('\n')[0]);
    console.error('💥'.repeat(10));
    
    // Diagnóstico detalhado
    console.log('\n🔍 DIAGNÓSTICO DO PROBLEMA:');
    console.log('='.repeat(40));
    
    // Verifica variáveis de ambiente
    if (!process.env.DB_CONNECTION_STRING) {
      console.error('❌ DB_CONNECTION_STRING não definida no .env');
    }
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET não definida - usando valor padrão');
    }
    
    // Verifica erros comuns
    if (erro.message.includes('MongoNetworkError')) {
      console.log('\n🔧 SOLUÇÃO PARA ERRO DE REDE MONGODB:');
      console.log('1. Verifique sua conexão com a internet');
      console.log('2. Confirme se o MongoDB Atlas está acessível');
      console.log('3. Verifique se seu IP está na whitelist do Atlas');
      console.log('   - Acesse: MongoDB Atlas → Security → Network Access');
      console.log('4. Confirme usuário e senha no arquivo .env');
      console.log('5. Teste a conexão manualmente:');
      console.log(`   String: ${process.env.DB_CONNECTION_STRING?.substring(0, 50)}...`);
    } else if (erro.message.includes('EADDRINUSE')) {
      console.log('\n🔧 SOLUÇÃO PARA PORTA EM USO:');
      console.log(`A porta ${PORT} já está em uso.`);
      console.log('Opções:');
      console.log('1. Mude a porta no arquivo .env');
      console.log('2. Encontre e mate o processo:');
      console.log(`   Linux/Mac: lsof -i :${PORT} | grep LISTEN`);
      console.log(`   Windows: netstat -ano | findstr :${PORT}`);
      console.log('3. Espere alguns segundos e tente novamente');
    } else if (erro.message.includes('ENOENT')) {
      console.log('\n🔧 SOLUÇÃO PARA ARQUIVO NÃO ENCONTRADO:');
      console.log('Verifique se todos os arquivos necessários existem:');
      console.log('✓ server.js');
      console.log('✓ src/app.js');
      console.log('✓ src/config/dbConnect.js');
      console.log('✓ src/config/dotenvConfig.js');
      console.log('✓ .env (na raiz do projeto)');
    } else if (erro.message.includes('MODULE_NOT_FOUND')) {
      console.log('\n🔧 SOLUÇÃO PARA MÓDULO NÃO ENCONTRADO:');
      console.log('1. Execute: npm install');
      console.log('2. Verifique se todas as dependências estão no package.json');
      console.log('3. Verifique os imports nos arquivos');
    }
    
    console.log('\n🔄 Tentando reconectar em 5 segundos...');
    
    // Tentativa de reconexão automática
    setTimeout(() => {
      console.log('🔄 Reiniciando servidor...');
      iniciarServidor().catch(() => {
        console.error('❌ Falha na reconexão. Encerrando...');
        process.exit(1);
      });
    }, 5000);
  }
}

// Inicia a aplicação
iniciarServidor().catch((erro) => {
  console.error('❌ Falha crítica ao iniciar:', erro);
  process.exit(1);
});

// Export para testes
export { iniciarServidor };