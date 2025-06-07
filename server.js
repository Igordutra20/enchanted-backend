require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS
const corsOptions = {
  origin: [
    'https://enchantedlegends.online',
    'https://www.enchantedlegends.online',
    'https://igordutra20.github.io',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Armazenamento em memória
const nonces = {};
const users = {};

// Rota para obter nonce
app.post("/get-nonce", (req, res) => {
  const { wallet } = req.body;

  if (!wallet) return res.status(400).json({ error: "Carteira não enviada." });

  const nonce = `Assine para se autenticar: ${ethers.utils.hexlify(ethers.utils.randomBytes(32))}`;
  nonces[wallet.toLowerCase()] = {
    value: nonce,
    expiresAt: Date.now() + 300000 // Expira em 5 minutos
  };

  res.json({ nonce });
});

// Rota para verificar assinatura (CORRIGIDA - removida a duplicação)
app.post("/verify-signature", async (req, res) => {
  const { wallet, signature, originalNonce } = req.body;
  
  if (!wallet || !signature || !originalNonce) {
    return res.status(400).json({ 
      success: false,
      error: "Dados incompletos" 
    });
  }

  try {
    // Verifica se o nonce existe e não expirou
    const storedNonce = nonces[wallet.toLowerCase()];
    if (!storedNonce || storedNonce.value !== originalNonce) {
      return res.status(400).json({
        success: false,
        error: "Nonce inválido ou expirado"
      });
    }

    if (Date.now() > storedNonce.expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Nonce expirado"
      });
    }

    const recoveredAddress = ethers.utils.verifyMessage(
      originalNonce, 
      signature
    );

    if (recoveredAddress.toLowerCase() === wallet.toLowerCase()) {
      delete nonces[wallet.toLowerCase()]; // Remove o nonce usado
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
    console.error("Erro na verificação:", error);
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

  // Validação básica de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }

  users[wallet.toLowerCase()] = { 
    username, 
    email,
    createdAt: new Date().toISOString()
  };

  res.json({ 
    success: true, 
    user: { wallet: wallet.toLowerCase(), username, email } 
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK",
    usersCount: Object.keys(users).length
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
