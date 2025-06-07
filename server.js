require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS (permitir apenas seu frontend)
const corsOptions = {
  origin: [
    'https://igordutra20.github.io', // Seu GitHub Pages
    'http://localhost:3000'          // Para desenvolvimento
  ],
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Armazenamento em memória (substitua por um banco de dados em produção)
const nonces = {};
const users = {};

// Rota para obter nonce
app.post("/get-nonce", (req, res) => {
  const { wallet } = req.body;

  if (!wallet) return res.status(400).json({ error: "Carteira não enviada." });

  const nonce = `Assine para se autenticar: ${Math.random().toString(36).substring(2)}`;
  nonces[wallet.toLowerCase()] = nonce;

  res.json({ nonce });
});

// Rota para verificar assinatura
app.post("/verify-signature", (req, res) => {
  const { wallet, signature } = req.body;

  if (!wallet || !signature) return res.status(400).json({ error: "Dados incompletos." });

  const nonce = nonces[wallet.toLowerCase()];
  if (!nonce) return res.status(400).json({ error: "Nonce não encontrado." });

  try {
    const recoveredAddress = ethers.utils.verifyMessage(nonce, signature);

    if (recoveredAddress.toLowerCase() === wallet.toLowerCase()) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: "Assinatura inválida." });
    }
  } catch (error) {
    return res.status(400).json({ error: "Erro ao verificar assinatura." });
  }
});

// Rota para registrar usuário
app.post("/register", (req, res) => {
  const { wallet, username, email } = req.body;

  if (!wallet || !username || !email) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  users[wallet.toLowerCase()] = { username, email };

  res.json({ success: true, user: { wallet, username, email } });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
