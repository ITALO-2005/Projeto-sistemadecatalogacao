# SGNF - Sistema de Catalogação e Gestão de Notas Fiscais para Setores Públicos

**Instituição:** IFPB - Campus Picuí 
**Aluno:** Ítalo Dantas Santos
**Professor** Daniel

---

## 📌 O Problema
Setores administrativos lidam com um volume massivo de notas fiscais (NFs) de diferentes fornecedores. O processo de arquivamento físico ou em planilhas soltas torna a busca por despesas específicas, auditorias e o controle de gastos um trabalho lento e sujeito a falhas. 

Esta proposta surge da necessidade identificada de um melhor controle de despesas na administração de Frei Martinho, por meio de um sistema que atualmente depende do uso de documentos físicos e planilhas não integradas, resultando em perda periódica de documentos ou dificuldade em encontrar os arquivos com rapidez.

## 💡 A Solução
A implementação deste sistema baseado na web proporcionará uma gestão aprimorada em termos de segurança, agilidade e eficiência operacional geral. O sistema centraliza as informações, permitindo o cadastro rápido dos dados essenciais da NF e oferecendo um mecanismo de busca otimizado para localizar despesas.

Uma interface de fácil navegação proporciona aos usuários acesso aos módulos a partir do painel de controle principal (Visão Geral), além da possibilidade de visualizar, criar ou consultar notas existentes.

## ⚙️ Tecnologias Utilizadas
O projeto foi desenvolvido com foco na simplicidade e eficiência, utilizando:
* **Backend:** Node.js com framework Express.js.
* **Banco de Dados:** SQLite (Banco de Dados Relacional).
* **Frontend:** HTML, CSS e JavaScript, consumindo a API interna via `fetch`.

## 🗄️ Modelagem do Banco de Dados
O sistema utiliza um banco de dados relacional (SQLite) estruturado com as seguintes entidades e seus relacionamentos:

* **USUARIO:** Entidade independente criada para o controle de acesso e autenticação de administradores do sistema. (Implementação extra ao modelo inicial).
* **EMPRESA:** Tabela para cadastro dos fornecedores. 
  * **Relacionamento:** 1:N com Nota Fiscal. Uma Empresa pode emitir várias Notas Fiscais.
* **NOTA_FISCAL:** Registro central das despesas. 
  * **Relacionamento:** Possui uma Chave Estrangeira (`id_empresa`) vinculando-a obrigatoriamente a uma Empresa (N:1).
  * **Relacionamento:** 1:N com Item Produto. Uma Nota Fiscal pode ter vários itens cadastrados nela.
* **ITEM_PRODUTO:** Detalhamento dos produtos comprados na nota. 
  * **Relacionamento:** Possui uma Chave Estrangeira (`id_nota`) vinculando o item a uma única Nota Fiscal correspondente.

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
   ```bash
   npm install express body-parser sqlite3