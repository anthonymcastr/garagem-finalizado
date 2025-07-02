# 🚗 API Garagem - Controle de Aluguéis de Boxes para Carros

Este projeto é uma API RESTful desenvolvida com **Node.js**, **Express** e **Prisma ORM**, conectada a um banco de dados MySQL. O sistema gerencia **clientes, boxes, aluguéis, pagamentos e usuários**, com diversas **camadas de segurança** implementadas.

---

## 📦 Tecnologias Utilizadas

- Node.js + Express
- TypeScript
- Prisma ORM
- MySQL
- JWT (Autenticação)
- Bcrypt (Hash de senhas)
- Zod (Validações)
- Nodemailer (Envio de e-mails)
- Mailtrap (Simulação de envio)
- Insomnia (Testes da API)

---

## 🔐 Funcionalidades de Segurança Implementadas

### ✔️ Requisitos obrigatórios

- [x] **Model `Usuario`** com campos: `id`, `nome`, `email`, `senha`, `nivel`, `status`, `ultimoLogin`
- [x] **Relacionamento com a model `Log`**
- [x] **Validação de senha forte** (mín. 8 caracteres, letras maiúsculas, minúsculas, números e símbolos)
- [x] **Criptografia de senhas** com Bcrypt
- [x] **Login com geração de token JWT**
- [x] **Middleware de autenticação** (`authMiddleware`)
- [x] **Model `Log`** para registrar ações do sistema
- [x] **Rotas para backup e restore do banco**

### ✅ Recursos extras (2 implementados)

- [x] **Níveis de acesso**: usuários com `nivel = 3` podem excluir clientes
- [x] **Registro do último login**: exibido na tela após login

---

## 🛠️ Instalação e Execução

```bash
# Clone o repositório
git clone https://github.com/seuusuario/garagem-api.git
cd garagem-api

# Instale as dependências
npm install

# Configure o .env
cp .env.example .env
# Edite o .env com sua conexão MySQL e JWT_SECRET

# Rode as migrations
npx prisma migrate dev

# Inicie o servidor
npm run dev
