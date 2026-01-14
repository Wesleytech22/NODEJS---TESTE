import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configura paths para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis do .env (3 níveis acima: src/config/ -> src/ -> raiz)
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Valida variáveis essenciais
const requiredEnvVars = ['DB_CONNECTION_STRING'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERRO: Variável ${envVar} não encontrada no .env`);
    console.error(`🔍 Verifique se o arquivo .env existe na raiz do projeto`);
    process.exit(1);
  }
}

console.log('✅ Variáveis de ambiente carregadas');
console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}`);