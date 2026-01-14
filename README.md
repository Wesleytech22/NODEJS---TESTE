📚 API de Livraria - Node.js + MongoDB
<div align="center">
https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white
https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white

API RESTful para gestão de livros com autenticação e validações

</div>
🚀 Começar Rápido
bash
# Clone o projeto
git clone https://github.com/seu-usuario/livraria-api.git
cd livraria-api

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env
# Edite .env com suas credenciais MongoDB Atlas

# Execute
npm run dev
API rodando em: http://localhost:3000

📡 Endpoints da API
📚 Gestão de Livros
GET /livros - Listar todos os livros

POST /livros - Criar novo livro

GET /livros/:id - Buscar livro por ID

PUT /livros/:id - Atualizar livro

DELETE /livros/:id - Deletar livro

🔍 Outros Endpoints
GET / - Documentação da API

GET /status - Health check do sistema

GET /livros/busca/:termo - Busca textual

📝 Exemplos de Uso
Criar um Livro
bash
curl -X POST http://localhost:3000/livros \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Node.js na Prática",
    "autor": "Wesley Rodrigues",
    "editora": "Editora Tech",
    "preco": 89.90,
    "paginas": 350
  }'
Listar Livros com Paginação
bash
curl "http://localhost:3000/livros?pagina=1&limite=5"
⚙️ Configuração
Arquivo .env
env
DB_CONNECTION_STRING=mongodb+srv://usuario:senha@cluster.mongodb.net/Livraria
PORT=3000
NODE_ENV=development
🏗️ Estrutura do Projeto
text
livraria-api/
├── src/
│   ├── config/          # Configurações
│   ├── models/          # Modelos MongoDB
│   ├── app.js           # Rotas e middlewares
│   └── server.js        # Ponto de entrada
├── .env                 # Variáveis de ambiente
└── package.json         # Dependências
🛠️ Tecnologias
Node.js - Runtime JavaScript

Express - Framework web

MongoDB Atlas - Banco de dados em nuvem

Mongoose - ODM para MongoDB

Dotenv - Gerenciamento de variáveis

🐛 Solução de Problemas
Erro de Conexão MongoDB
Verifique sua string de conexão no .env

Confirme se seu IP está na whitelist do Atlas

Teste sua conexão com a internet

Erro de Validação
Verifique se todos os campos obrigatórios estão presentes no JSON enviado.

