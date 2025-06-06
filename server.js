const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const nonces = {};  // Armazena nonces temporariamente
const users = {};   // Armazena usuários em memória

// Gera nonce aleatório
function generateNonce() {
  return "Assine para se autenticar: " + Math.floor(Math.random() * 1000000);
}

// Rota para obter nonce
app.post("/get-nonce", (req, res) => {
  const { wallet } = req.body;

  if (!wallet) return res.status(400).json({ error: "Carteira não enviada." });

  const nonce = generateNonce();
  nonces[wallet.toLowerCase()] = nonce;

  res.json({ nonce });
});

// Rota para verificar a assinatura
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

// Rota para registrar usuário após autenticação
app.post("/register", (req, res) => {
  const { wallet, username, email } = req.body;

  if (!wallet || !username || !email) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  users[wallet.toLowerCase()] = { username, email };

  res.json({ success: true, user: { wallet, username, email } });
});

// (Opcional) Ver perfil do usuário
app.get("/user/:wallet", (req, res) => {
  const wallet = req.params.wallet.toLowerCase();
  const user = users[wallet];

  if (user) {
    res.json({ user });
  } else {
    res.status(404).json({ error: "Usuário não encontrado." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
