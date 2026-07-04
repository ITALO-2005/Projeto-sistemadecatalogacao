const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const multer = require('multer'); 
const fs = require('fs');

// Configuração do Google Auth
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '192576869121-sv3of5f7chikns80jorlu0hrods71t1i.apps.googleusercontent.com';
const googleClient = new OAuth2Client(CLIENT_ID);

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir) },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 

app.post('/api/cadastro', (req, res) => {
    const { email, senha } = req.body;
    db.run(`INSERT INTO USUARIO (email, senha) VALUES (?, ?)`, [email, senha], function(err) {
        if (err) return res.status(400).json({ erro: "E-mail já cadastrado." });
        res.json({ mensagem: "Usuário cadastrado com sucesso!" });
    });
});

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    db.get(`SELECT * FROM USUARIO WHERE email = ? AND senha = ?`, [email, senha], (err, row) => {
        if (row) res.json({ sucesso: true, mensagem: "Login efetuado!" });
        else res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha inválidos." });
    });
});

// Nova rota para Login/Cadastro com Google
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const email = payload.email;

        db.get(`SELECT * FROM USUARIO WHERE email = ?`, [email], (err, row) => {
            if (row) {
                res.json({ sucesso: true, mensagem: "Login efetuado com Google!" });
            } else {
                db.run(`INSERT INTO USUARIO (email, senha) VALUES (?, ?)`, [email, 'google_auth_placeholder'], function(err) {
                    res.json({ sucesso: true, mensagem: "Conta criada e login efetuado via Google!" });
                });
            }
        });
    } catch (error) {
        console.error("Erro no token do Google:", error);
        res.status(401).json({ sucesso: false, erro: "Falha na autenticação com o Google." });
    }
});

app.get('/api/notas', (req, res) => {
    const sql = `
        SELECT n.id_nota, n.numero_nf, e.nome_razao_social as empresa, n.data_emissao, n.valor_total, n.arquivo, n.status,
               (SELECT descricao_produto FROM ITEM_PRODUTO WHERE id_nota = n.id_nota LIMIT 1) as produtos
        FROM NOTA_FISCAL n
        LEFT JOIN EMPRESA e ON n.id_empresa = e.id_empresa
        ORDER BY n.id_nota DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ erro: "Erro ao buscar notas." });
        else res.json(rows);
    });
});

app.get('/api/notas/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT n.*, e.nome_razao_social, 
               (SELECT descricao_produto FROM ITEM_PRODUTO WHERE id_nota = n.id_nota LIMIT 1) as produtos
        FROM NOTA_FISCAL n
        LEFT JOIN EMPRESA e ON n.id_empresa = e.id_empresa
        WHERE n.id_nota = ?
    `;
    db.get(sql, [id], (err, row) => {
        if (err) res.status(500).json({ erro: "Erro ao buscar nota." });
        else res.json(row);
    });
});

app.delete('/api/notas/:id', (req, res) => {
    const id = req.params.id; 
    db.run(`DELETE FROM ITEM_PRODUTO WHERE id_nota = ?`, [id], function(err) {
        db.run(`DELETE FROM NOTA_FISCAL WHERE id_nota = ?`, [id], function(err) {
            if (err) return res.status(500).json({ erro: "Erro ao excluir." });
            res.json({ mensagem: "Nota excluída com sucesso!" });
        });
    });
});

app.get('/api/dashboard', (req, res) => {
    db.get(`SELECT COUNT(*) as totalNotas, IFNULL(SUM(valor_total), 0) as totalGasto FROM NOTA_FISCAL`, (err, stats) => {
        db.get(`SELECT IFNULL(SUM(valor_total), 0) as totalPago FROM NOTA_FISCAL WHERE status = 'Paga'`, (err, pagas) => {
            db.get(`SELECT IFNULL(SUM(valor_total), 0) as totalPendente FROM NOTA_FISCAL WHERE status = 'Pendente'`, (err, pendentes) => {
                const sqlGrafico = `SELECT e.nome_razao_social as empresa, SUM(n.valor_total) as total FROM NOTA_FISCAL n JOIN EMPRESA e ON n.id_empresa = e.id_empresa GROUP BY e.id_empresa LIMIT 5`;
                db.all(sqlGrafico, [], (err, dadosGrafico) => {
                    const sqlRecentes = `SELECT n.numero_nf, e.nome_razao_social as empresa, n.data_emissao, n.valor_total, n.status FROM NOTA_FISCAL n LEFT JOIN EMPRESA e ON n.id_empresa = e.id_empresa ORDER BY n.id_nota DESC LIMIT 5`;
                    db.all(sqlRecentes, [], (err, recentes) => {
                        res.json({ 
                            totalNotas: stats.totalNotas, 
                            totalGasto: stats.totalGasto, 
                            totalPago: pagas.totalPago,
                            totalPendente: pendentes.totalPendente,
                            grafico: dadosGrafico,
                            recentes: recentes 
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/empresas', (req, res) => {
    db.all(`SELECT * FROM EMPRESA`, [], (err, rows) => {
        if (err) res.status(500).json({ erro: "Erro ao buscar." });
        else res.json(rows);
    });
});

app.post('/api/notas', upload.single('arquivo_nota'), (req, res) => {
    const { numero_nf, nome_empresa, data_emissao, valor_total, produtos, status } = req.body;
    const arquivo = req.file ? req.file.filename : null; 

    db.get(`SELECT id_empresa FROM EMPRESA WHERE nome_razao_social = ?`, [nome_empresa], (err, row) => {
        if (row) {
            db.run(`INSERT INTO NOTA_FISCAL (numero_nf, data_emissao, valor_total, id_empresa, arquivo, status) VALUES (?, ?, ?, ?, ?, ?)`, 
            [numero_nf, data_emissao, valor_total, row.id_empresa, arquivo, status || 'Pendente'], function(err) {
                if (produtos) db.run(`INSERT INTO ITEM_PRODUTO (descricao_produto, id_nota) VALUES (?, ?)`, [produtos, this.lastID]);
                res.json({ mensagem: "Salvo com sucesso!" });
            });
        } else {
            db.run(`INSERT INTO EMPRESA (nome_razao_social, cnpj) VALUES (?, ?)`, [nome_empresa, '00.000.000/0001-00'], function(err) {
                const id_nova_empresa = this.lastID; 
                db.run(`INSERT INTO NOTA_FISCAL (numero_nf, data_emissao, valor_total, id_empresa, arquivo, status) VALUES (?, ?, ?, ?, ?, ?)`, 
                [numero_nf, data_emissao, valor_total, id_nova_empresa, arquivo, status || 'Pendente'], function(err) {
                    if (produtos) db.run(`INSERT INTO ITEM_PRODUTO (descricao_produto, id_nota) VALUES (?, ?)`, [produtos, this.lastID]);
                    res.json({ mensagem: "Salvo com sucesso!" });
                });
            });
        }
    });
});

app.put('/api/notas/:id', upload.single('arquivo_nota'), (req, res) => {
    const id = req.params.id;
    const { numero_nf, nome_empresa, data_emissao, valor_total, produtos, status } = req.body;
    const arquivo = req.file ? req.file.filename : null;

    db.get(`SELECT id_empresa FROM EMPRESA WHERE nome_razao_social = ?`, [nome_empresa], (err, row) => {
        let id_empresa = row ? row.id_empresa : null;
        
        const updateNota = (empId) => {
            let sql = `UPDATE NOTA_FISCAL SET numero_nf=?, data_emissao=?, valor_total=?, id_empresa=?, status=? WHERE id_nota=?`;
            let params = [numero_nf, data_emissao, valor_total, empId, status, id];
            
            if (arquivo) {
                sql = `UPDATE NOTA_FISCAL SET numero_nf=?, data_emissao=?, valor_total=?, id_empresa=?, status=?, arquivo=? WHERE id_nota=?`;
                params = [numero_nf, data_emissao, valor_total, empId, status, arquivo, id];
            }

            db.run(sql, params, function(err) {
                db.run(`UPDATE ITEM_PRODUTO SET descricao_produto=? WHERE id_nota=?`, [produtos, id], function(err) {
                    res.json({ mensagem: "Nota atualizada com sucesso!" });
                });
            });
        };

        if (id_empresa) {
            updateNota(id_empresa);
        } else {
            db.run(`INSERT INTO EMPRESA (nome_razao_social, cnpj) VALUES (?, ?)`, [nome_empresa, '00.000.000/0001-00'], function(err) {
                updateNota(this.lastID);
            });
        }
    });
});

app.listen(PORT, () => { console.log(`Servidor rodando em http://localhost:${PORT}`); });