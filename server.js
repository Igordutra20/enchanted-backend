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
    'https://enchantedlegends.online',     // Novo domínio
    'https://www.enchantedlegends.online', // Se usar www
    'https://igordutra20.github.io',       // Mantenha se ainda usa
    'http://localhost:3000'                // Para desenvolvimento
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
app.post("/verify-signature", async (req, res) => {
  const { wallet, signature, originalNonce } = req.body;
  
  if (!wallet || !signature || !originalNonce) {
    return res.status(400).json({ 
      success: false,
      error: "Dados incompletos" 
    });
  }

  try {
    const recoveredAddress = ethers.utils.verifyMessage(
      originalNonce, 
      signature
    );

    if (recoveredAddress.toLowerCase() === wallet.toLowerCase()) {
      res.json({ 
        success: true,
        message: "Assinatura válida" 
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Endereço recuperado não corresponde"
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Erro na verificação: " + error.message
    });
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
