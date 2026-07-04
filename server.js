const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const multer = require('multer'); // Importando o multer para upload de arquivos
const fs = require('fs');

const app = express();
const PORT = 3000;

//cria a pasta de uploads automaticamente dentro de public caso ela não exista
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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

// Rota de Login
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

// Rota para Consultar TODAS as Notas retornando o arquivvo
app.get('/api/notas', (req, res) => {
    const sql = `
        SELECT n.id_nota, n.numero_nf, e.nome_razao_social as empresa, n.data_emissao, n.valor_total, n.arquivo
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
    const id = req.params.id; 
    
    // Deleta os produtos primeiro
    db.run(`DELETE FROM ITEM_PRODUTO WHERE id_nota = ?`, [id], function(err) {
        // Depois deleta a nota
        db.run(`DELETE FROM NOTA_FISCAL WHERE id_nota = ?`, [id], function(err) {
            if (err) {
                return res.status(500).json({ erro: "Erro ao excluir a nota." });
            }
            res.json({ mensagem: "Nota excluída com sucesso!" });
        });
    });
});

// Rota para pegar os dados do Dashboard
app.get('/api/dashboard', (req, res) => {
    db.get(`SELECT COUNT(*) as totalNotas, IFNULL(SUM(valor_total), 0) as totalGasto FROM NOTA_FISCAL`, (err, stats) => {
        db.get(`SELECT COUNT(*) as totalFornecedores FROM EMPRESA`, (err, fornec) => {
            const sqlRecentes = `
                SELECT n.numero_nf, e.nome_razao_social as empresa, n.data_emissao, n.valor_total
                FROM NOTA_FISCAL n
                LEFT JOIN EMPRESA e ON n.id_empresa = e.id_empresa
                ORDER BY n.id_nota DESC LIMIT 5
            `;
            db.all(sqlRecentes, [], (err, recentes) => {
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

// Rota para pegar empresas para o autocompletar
app.get('/api/empresas', (req, res) => {
    db.all(`SELECT * FROM EMPRESA`, [], (err, rows) => {
        if (err) res.status(500).json({ erro: "Erro ao buscar empresas." });
        else res.json(rows);
    });
});

// Rota para Cadastrar Nota, Empresa, Produtos e Arquivo
app.post('/api/notas', upload.single('arquivo_nota'), (req, res) => {
    const { numero_nf, nome_empresa, data_emissao, valor_total, produtos } = req.body;
    const arquivo = req.file ? req.file.filename : null; // Pega o nome do arquivo, se tiver sido enviado

    db.get(`SELECT id_empresa FROM EMPRESA WHERE nome_razao_social = ?`, [nome_empresa], (err, row) => {
        if (row) {
            // Empresa existente
            db.run(`INSERT INTO NOTA_FISCAL (numero_nf, data_emissao, valor_total, id_empresa, arquivo) VALUES (?, ?, ?, ?, ?)`, 
            [numero_nf, data_emissao, valor_total, row.id_empresa, arquivo], function(err) {
                const id_nota_inserida = this.lastID;
                
                if (produtos) { 
                    db.run(`INSERT INTO ITEM_PRODUTO (descricao_produto, id_nota) VALUES (?, ?)`, [produtos, id_nota_inserida]); 
                }
                res.json({ mensagem: "Nota, produtos e anexo salvos!" });
            });
            
        } else {
            // Cria a empresa primeiro
            db.run(`INSERT INTO EMPRESA (nome_razao_social, cnpj) VALUES (?, ?)`, [nome_empresa, '00.000.000/0001-00'], function(err) {
                const id_nova_empresa = this.lastID; 
                
                db.run(`INSERT INTO NOTA_FISCAL (numero_nf, data_emissao, valor_total, id_empresa, arquivo) VALUES (?, ?, ?, ?, ?)`, 
                [numero_nf, data_emissao, valor_total, id_nova_empresa, arquivo], function(err) {
                    const id_nota_inserida = this.lastID;
                    
                    if (produtos) { 
                        db.run(`INSERT INTO ITEM_PRODUTO (descricao_produto, id_nota) VALUES (?, ?)`, [produtos, id_nota_inserida]); 
                    }
                    res.json({ mensagem: "Empresa criada, nota e anexo salvos!" });
                });
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor do SGNF rodando em http://localhost:${PORT}`);
});