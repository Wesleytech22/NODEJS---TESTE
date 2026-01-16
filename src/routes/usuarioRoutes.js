import express from 'express';

const router = express.Router();

// Rota de exemplo - pode expandir depois
router.get('/', (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'Rotas de usuário',
    endpoints: {
      lista: 'GET / (esta rota)',
      perfil: 'GET /:id (em desenvolvimento)',
      atualizar: 'PUT /:id (em desenvolvimento)',
    },
  });
});

export default router;