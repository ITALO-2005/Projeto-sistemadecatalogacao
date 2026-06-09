const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// Rota de Cadastro
app.post('/api/cadastro', (req, res) => {
    const { email, senha } = req.body;
    db.run(`INSERT INTO USUARIO (email, senha) VALUES (?, ?)`, [email, senha], function(err) {
        if (err) {
            return res.status(400).json({ erro: "E-mail já cadastrado ou erro no banco." });
        }
        res.json({ mensagem: "Usuário cadastrado com sucesso!" });
    });
});

//rota de Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    db.get(`SELECT * FROM USUARIO WHERE email = ? AND senha = ?`, [email, senha], (err, row) => {
        if (row) {
            res.json({ sucesso: true, mensagem: "Login efetuado!" });
        } else {
            res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha inválidos." });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor do SGNF rodando em http://localhost:${PORT}`);
});