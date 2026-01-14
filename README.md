📚 API de Livraria - Node.js + MongoDB
Uma API RESTful completa para gerenciamento de livros, construída com Node.js, Express e MongoDB Atlas.

🚀 Status do Projeto
✅ 100% Funcional | ✅ Pronto para Produção | ✅ Documentado

📋 Sumário
Visão Geral

Tecnologias

Instalação

Configuração

Endpoints da API

Exemplos de Uso

Estrutura do Projeto

Variáveis de Ambiente

Solução de Problemas

Próximos Passos

🎯 Visão Geral
API desenvolvida para gerenciar um catálogo de livros, permitindo operações CRUD completas com validações, paginação, busca e tratamento de erros robusto.

Desenvolvedor: Wesley Rodrigues
Versão: 1.0.0
Ambiente: Development/Production Ready

🛠 Tecnologias
Node.js v18+ - Runtime JavaScript

Express v4.18 - Framework web

MongoDB Atlas - Banco de dados em nuvem

Mongoose v7.6 - ODM para MongoDB

Dotenv - Gerenciamento de variáveis de ambiente

Nodemon - Reinicialização automática em desenvolvimento

📥 Instalação
Pré-requisitos
Node.js v18 ou superior

Conta no MongoDB Atlas

Git instalado

Postman/Insomnia (para testes)

Passos de Instalação
bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/livraria-api.git
cd livraria-api

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Edite o arquivo .env com suas credenciais
nano .env  # ou use seu editor preferido

# 5. Inicie o servidor em desenvolvimento
npm run dev

# 6. Ou inicie em produção
npm start
⚙️ Configuração
Arquivo .env
env
# MongoDB Atlas Connection
DB_CONNECTION_STRING=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/<database>

# Server Configuration
PORT=3000
NODE_ENV=development
