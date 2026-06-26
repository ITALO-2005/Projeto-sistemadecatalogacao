# SGNF - Sistema de Catalogação e Gestão de Notas Fiscais para Setores Públicos

[cite_start]**Instituição:** IFPB - Campus Picuí 
[cite_start]**Aluno:** Ítalo Dantas Santos [cite: 5]

---

## 📌 O Problema
[cite_start]Setores administrativos lidam com um volume massivo de notas fiscais (NFs) de diferentes fornecedores[cite: 13]. [cite_start]O processo de arquivamento físico ou em planilhas soltas torna a busca por despesas específicas, auditorias e o controle de gastos um trabalho lento e sujeito a falhas[cite: 14]. 

[cite_start]Esta proposta surge da necessidade identificada de um melhor controle de despesas na administração de Frei Martinho, por meio de um sistema que atualmente depende do uso de documentos físicos e planilhas não integradas, resultando em perda periódica de documentos ou dificuldade em encontrar os arquivos com rapidez[cite: 38].

## 💡 A Solução
[cite_start]A implementação deste sistema baseado na web proporcionará uma gestão aprimorada em termos de segurança, agilidade e eficiência operacional geral[cite: 39]. [cite_start]O sistema centraliza as informações, permitindo o cadastro rápido dos dados essenciais da NF e oferecendo um mecanismo de busca otimizado para localizar despesas[cite: 16].

[cite_start]Uma interface de fácil navegação proporciona aos usuários acesso aos módulos a partir do painel de controle principal (Visão Geral), além da possibilidade de visualizar, criar ou consultar notas existentes[cite: 37].

## ⚙️ Tecnologias Utilizadas
O projeto foi desenvolvido com foco na simplicidade e eficiência, utilizando:
* **Backend:** Node.js com framework Express.js.
* [cite_start]**Banco de Dados:** SQLite (Banco de Dados Relacional)[cite: 41, 42].
* **Frontend:** HTML5, CSS3 e JavaScript (Vanilla JS), consumindo a API interna via `fetch`.

## 🗄️ Modelagem do Banco de Dados
[cite_start]O sistema utiliza um banco de dados relacional [cite: 41, 42] com as seguintes entidades principais:
* **USUARIO:** Autenticação de administradores.
* [cite_start]**EMPRESA:** Cadastro automático de fornecedores (1:N com Nota Fiscal)[cite: 51, 52].
* [cite_start]**NOTA_FISCAL:** Registro central das despesas, atrelado a uma empresa emissora[cite: 51, 52].
* **ITEM_PRODUTO:** Itens comprados na nota (1:N com Nota Fiscal)[cite: 43, 53, 54].

## 🚀 Funcionalidades Implementadas (CRUD)
* **Autenticação:** Sistema de Login e Cadastro para administradores do setor.
* **Dashboard Dinâmico:** Visão geral calculando em tempo real o Total Gasto, Total de Notas Registradas e Fornecedores Ativos, além de listar as 5 adições recentes.
* **Cadastro Inteligente (Create):** Inserção de Notas Fiscais com funcionalidade de *autocomplete*. Se o fornecedor digitado não existir, o sistema cria a empresa automaticamente no banco antes de atrelar à nota.
* **Consulta Integrada (Read):** Tabela listando todas as notas fiscais unindo os dados da tabela `NOTA_FISCAL` e `EMPRESA` (via `LEFT JOIN`).
* **Exclusão (Delete):** Remoção de notas cadastradas incorretamente, atualizando automaticamente os valores do dashboard.

## 🛠️ Como Executar o Projeto Localmente

1. Certifique-se de ter o **Node.js** instalado na máquina.
2. Clone ou baixe este repositório.
3. Abra o terminal na pasta raiz do projeto e instale as dependências:
   \`\`\`bash
   npm install express body-parser sqlite3
   \`\`\`
4. Inicie o servidor:
   \`\`\`bash
   node server.js
   \`\`\`
5. Acesse no navegador: `http://localhost:3000`

---
*Projeto acadêmico desenvolvido para a disciplina de Padrões de Projeto.*