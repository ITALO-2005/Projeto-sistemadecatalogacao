const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sgnf.db');

db.serialize(() => {
    //tabela de usuarios adicionada para o Login/Cadastro
    db.run(`CREATE TABLE IF NOT EXISTS USUARIO (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        senha TEXT
    )`);
    
    db.run(`INSERT OR IGNORE INTO EMPRESA (id_empresa, nome_razao_social, cnpj) VALUES (1, 'Tech Soluções Lda', '11.111.111/0001-11')`);
    db.run(`INSERT OR IGNORE INTO EMPRESA (id_empresa, nome_razao_social, cnpj) VALUES (2, 'Papelaria Central', '22.222.222/0002-22')`);

    // Tabela EMPRESA
    db.run(`CREATE TABLE IF NOT EXISTS EMPRESA (
        id_empresa INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_razao_social TEXT,
        cnpj TEXT
    )`);

    // Tabela NOTA FISCAL 
    db.run(`CREATE TABLE IF NOT EXISTS NOTA_FISCAL (
        id_nota INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_nf TEXT,
        data_emissao DATE,
        valor_total DECIMAL(10,2),
        id_empresa INTEGER,
        FOREIGN KEY(id_empresa) REFERENCES EMPRESA(id_empresa)
    )`);

    // Tabela ITEM_PRODUTO
    db.run(`CREATE TABLE IF NOT EXISTS ITEM_PRODUTO (
        id_item INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao_produto TEXT,
        id_nota INTEGER,
        FOREIGN KEY(id_nota) REFERENCES NOTA_FISCAL(id_nota)
    )`);
    
    // inserindo o usuário admin padrão
    db.run(`INSERT OR IGNORE INTO USUARIO (email, senha) VALUES ('admin@sgnf.pt', '123456')`);
});

module.exports = db;