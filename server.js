const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 

app.post('/api/cadastro', (req, res) => {
    const { email, senha } = req.body;
    db.run(`INSERT INTO USUARIO (email, senha) VALUES (?, ?)`, [email, senha], function(err) {
        if (err) {
            return res.status(400).json({ erro: "E-mail já cadastrado ou erro no banco." });
        }
        res.json({ mensagem: "Usuário cadastrado com sucesso!" });
    });
});

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

// Rota para Consultar TODAS as Notas 
app.get('/api/notas', (req, res) => {
    const sql = `
        SELECT n.id_nota, n.numero_nf, e.nome_razao_social as empresa, n.data_emissao, n.valor_total
        FROM NOTA_FISCAL n
        LEFT JOIN EMPRESA e ON n.id_empresa = e.id_empresa
        ORDER BY n.id_nota DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ erro: "Erro ao buscar notas." });
        else res.json(rows);
    });
});

// Rota para DELETAR uma nota fiscal pelo ID
app.delete('/api/notas/:id', (req, res) => {
    const id = req.params.id; //pega o id que veio na url
    
    db.run(`DELETE FROM NOTA_FISCAL WHERE id_nota = ?`, [id], function(err) {
        if (err) {
            return res.status(500).json({ erro: "Erro ao excluir a nota." });
        }
        res.json({ mensagem: "Nota excluída com sucesso!" });
    });
});

// Rota para pegar os dados do Dashboard
app.get('/api/dashboard', (req, res) => {
    // Conta as notas e soma o valor gasto
    db.get(`SELECT COUNT(*) as totalNotas, IFNULL(SUM(valor_total), 0) as totalGasto FROM NOTA_FISCAL`, (err, stats) => {
        
        // Conta as empresas
        db.get(`SELECT COUNT(*) as totalFornecedores FROM EMPRESA`, (err, fornec) => {
            
            //Pega as 5 ultimas notas para a tabelinha
            const sqlRecentes = `
                SELECT n.numero_nf, e.nome_razao_social as empresa, n.data_emissao, n.valor_total
                FROM NOTA_FISCAL n
                LEFT JOIN EMPRESA e ON n.id_empresa = e.id_empresa
                ORDER BY n.id_nota DESC LIMIT 5
            `;
            
            db.all(sqlRecentes, [], (err, recentes) => {
                // Junta tudo e manda pro HTML
                res.json({
                    totalNotas: stats.totalNotas,
                    totalGasto: stats.totalGasto,
                    totalFornecedores: fornec.totalFornecedores,
                    recentes: recentes
                });
            });
        });
    });
});

// 3. Rota para pegar o nome das empresas pro campo de digitar autocompleta
app.get('/api/empresas', (req, res) => {
    db.all(`SELECT * FROM EMPRESA`, [], (err, rows) => {
        if (err) res.status(500).json({ erro: "Erro ao buscar empresas." });
        else res.json(rows);
    });
});

// 4. Rota para Cadastrar Nota e Empresa
app.post('/api/notas', (req, res) => {
    const { numero_nf, nome_empresa, data_emissao, valor_total } = req.body;

    // Primeiro olha se a empresa já existe digitada igualzinha
    db.get(`SELECT id_empresa FROM EMPRESA WHERE nome_razao_social = ?`, [nome_empresa], (err, row) => {
        
        if (row) {
            // Se existir  Pega o ID dela e salva a nota
            db.run(`INSERT INTO NOTA_FISCAL (numero_nf, data_emissao, valor_total, id_empresa) VALUES (?, ?, ?, ?)`, 
            [numero_nf, data_emissao, valor_total, row.id_empresa], (err) => {
                res.json({ mensagem: "Nota salva na empresa existente!" });
            });
            
        } else {
            // SE NÃO EXISTIR: Cria a empresa primeiro
            db.run(`INSERT INTO EMPRESA (nome_razao_social, cnpj) VALUES (?, ?)`, [nome_empresa, '00.000.000/0001-00'], function(err) {
                
                const id_nova_empresa = this.lastID; // Pega o ID da empresa recém criada
                
                // Depois salva a nota com o ID dessa empresa nova
                db.run(`INSERT INTO NOTA_FISCAL (numero_nf, data_emissao, valor_total, id_empresa) VALUES (?, ?, ?, ?)`, 
                [numero_nf, data_emissao, valor_total, id_nova_empresa], (err) => {
                    res.json({ mensagem: "Empresa criada e nota salva!" });
                });
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor do SGNF rodando em http://localhost:${PORT}`);
});