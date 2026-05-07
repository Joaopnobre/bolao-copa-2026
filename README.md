# 🏆 Bolão Copa do Mundo 2026

Sistema privado de palpites para a Copa do Mundo 2026, com ranking, odds, painel admin e mais.

---

## 🛠️ Stack

- **Next.js 16** + TypeScript + Tailwind CSS
- **Prisma ORM** com migrations
- **SQLite** (desenvolvimento local) / **PostgreSQL / Neon** (produção)
- **NextAuth.js** (autenticação)
- **Vercel** (hospedagem)

---

## 🚀 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

O `.env` já vem configurado para SQLite — não precisa alterar nada para desenvolvimento local.

### 3. Criar banco e popular dados

```bash
npm run db:push    # Cria as tabelas no SQLite local
npm run db:seed    # Cria admin + jogos + regras
```

### 4. Iniciar servidor

```bash
npm run dev
```

Acesse **http://localhost:3000**

**Login:** `bolao` / `bolinha`

> ⚠️ Mude a senha do admin antes do deploy público!

---

## 📦 Deploy em Produção (GitHub + Neon + Vercel)

Siga **exatamente** nesta ordem:

---

### PASSO 1 — Criar conta no GitHub

1. Acesse **https://github.com** → clique em **Sign up**
2. Crie sua conta (é gratuito)

---

### PASSO 2 — Subir o projeto para o GitHub

No terminal, dentro da pasta do projeto:

```bash
# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "feat: bolão copa do mundo 2026 — inicial"
```

Agora crie o repositório remoto:

1. Em **github.com**, clique no **+** (canto superior direito) → **New repository**
2. **Repository name:** `bolao-copa-2026`
3. Visibilidade: **Private** (recomendado)
4. **NÃO** marque "Initialize repository" (você já tem código local)
5. Clique em **Create repository**

O GitHub exibe os comandos. Execute no terminal:

```bash
git remote add origin https://github.com/SEU_USUARIO/bolao-copa-2026.git
git branch -M main
git push -u origin main
```

✅ Código no GitHub.

---

### PASSO 3 — Criar banco PostgreSQL no Neon

1. Acesse **https://neon.tech** → clique em **Sign Up** (pode usar conta GitHub)
2. Clique em **New Project**
3. Preencha:
   - **Project name:** `bolao-copa-2026`
   - **Database name:** `bolao` (ou deixe o padrão `neondb`)
   - **Region:** `US East (N. Virginia)` ou `AWS / São Paulo` se disponível
4. Clique em **Create project**
5. Na tela que abrir, clique em **Connection string**
6. No menu dropdown, selecione **Prisma** (muito importante!)
7. Copie a URL — ela tem este formato:

```
postgresql://usuario:senha@ep-cool-name-123.us-east-2.aws.neon.tech/bolao?sslmode=require
```

> 💡 Salve essa URL — ela contém a senha do banco.

---

### PASSO 4 — Popular o banco Neon com dados iniciais (seed)

Rode o seed localmente, mas apontando para o banco Neon:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://usuario:senha@ep-xxxx.aws.neon.tech/bolao?sslmode=require"
npm run db:seed
```

**Linux / Mac (terminal):**
```bash
DATABASE_URL="postgresql://usuario:senha@ep-xxxx.aws.neon.tech/bolao?sslmode=require" npm run db:seed
```

Isso cria no banco Neon:
- ✅ Usuário admin: `bolao` / `bolinha`
- ✅ 72 jogos da fase de grupos (12 grupos)
- ✅ 31 jogos do mata-mata
- ✅ Regras padrão do bolão

> O seed usa `upsert` — é seguro rodar mais de uma vez.

---

### PASSO 5 — Deploy na Vercel

1. Acesse **https://vercel.com** → clique em **Sign Up with GitHub**
2. Autorize o acesso ao GitHub quando solicitado

3. Na dashboard, clique em **Add New... → Project**
4. Localize o repositório `bolao-copa-2026` → clique em **Import**

5. Na tela de configuração:
   - **Framework Preset:** Next.js ← detectado automaticamente, não mude
   - **Root Directory:** `.` ← deixe como está
   - **Build & Output Settings:** deixe tudo em branco ← o `vercel.json` já configura tudo

6. Expanda **Environment Variables** e adicione estas 3 variáveis:

   **Variável 1:**
   - Name: `DATABASE_URL`
   - Value: `postgresql://usuario:senha@ep-xxxx.aws.neon.tech/bolao?sslmode=require`

   **Variável 2:**
   - Name: `NEXTAUTH_SECRET`
   - Value: gere um secret seguro (veja como abaixo)

   **Variável 3:**
   - Name: `NEXTAUTH_URL`
   - Value: `https://bolao-copa-2026.vercel.app` ← você saberá a URL após o deploy (veja nota abaixo)

   > 💡 Para o primeiro deploy, você pode colocar um valor temporário em `NEXTAUTH_URL`. Depois do deploy, atualize com a URL real.

   **Como gerar o NEXTAUTH_SECRET:**
   Acesse **https://generate-secret.vercel.app/32** e copie o valor gerado.
   Ou no terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

7. Clique em **Deploy** e aguarde o build ⏳ (~2 minutos)

---

### PASSO 6 — Corrigir NEXTAUTH_URL após o deploy

Após o deploy, a Vercel mostra a URL do seu site (ex: `https://bolao-copa-2026.vercel.app`).

1. Vá em **Settings** (no projeto) → **Environment Variables**
2. Clique em `NEXTAUTH_URL` → edite para a URL real
3. Vá em **Deployments** → clique nos três pontinhos do último deploy → **Redeploy**

✅ Pronto! O sistema está online.

---

## ✅ O que acontece em cada deploy

Quando você faz `git push`, a Vercel executa automaticamente:

```
npm install
  └─ postinstall: prisma generate     (gera o cliente Prisma para PostgreSQL)

npm run vercel-build
  ├─ prisma migrate deploy            (aplica migrations no banco Neon)
  └─ next build                       (compila o projeto)
```

Isso está configurado em:

```json
// vercel.json
{ "buildCommand": "npm run vercel-build" }

// package.json
"vercel-build": "prisma migrate deploy && next build",
"postinstall": "prisma generate"
```

---

## 🗂️ Estrutura Prisma (Dual Database)

| Arquivo | Banco | Usado quando |
|---------|-------|--------------|
| `prisma/schema.prisma` | PostgreSQL | `DATABASE_URL=postgresql://...` |
| `prisma/schema.dev.prisma` | SQLite | `DATABASE_URL=file:./...` |
| `prisma/migrations/` | PostgreSQL | Deploy na Vercel |

O `prisma.config.ts` seleciona o schema automaticamente pelo prefixo da `DATABASE_URL`:
- `file:` → SQLite → `schema.dev.prisma`
- `postgresql:` → PostgreSQL → `schema.prisma`

---

## 🔄 Criar nova migration (quando alterar o schema)

Sempre que editar `prisma/schema.prisma`:

```bash
# 1. Configure o DATABASE_URL para o banco PostgreSQL:
# Windows: $env:DATABASE_URL="postgresql://..."
# Linux:   export DATABASE_URL="postgresql://..."

# 2. Crie a migration (com nome descritivo):
npm run db:migrate:new
# O Prisma pergunta o nome. Ex: "add_campo_x"

# 3. Commit e push:
git add prisma/migrations/
git commit -m "db: add campo x"
git push
```

A Vercel aplica a migration automaticamente no próximo deploy.

> Para o banco local SQLite, continue usando `npm run db:push`.

---

## 🔑 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| Username | `bolao` |
| Senha | `bolinha` |
| Tipo | Admin |

**Altere a senha no painel admin antes de compartilhar o link do site!**

---

## 🧪 Referência de Comandos

```bash
# DESENVOLVIMENTO LOCAL
npm run dev              # Inicia servidor local (http://localhost:3000)
npm run db:push          # Sincroniza schema com SQLite local
npm run db:seed          # Popula banco local com dados iniciais
npm run db:studio        # Abre Prisma Studio (visualizar dados)

# PRODUÇÃO / NEON
# (Defina DATABASE_URL=postgresql://... antes)
npm run db:seed          # Popula o banco Neon
npm run db:migrate:new   # Cria nova migration PostgreSQL

# BUILD
npm run build            # Build local (sem migrations)
npm run vercel-build     # Build de produção (migrate + build)
```

---

## 🔒 Variáveis de Ambiente

| Variável | Desenvolvimento | Produção (Vercel) |
|----------|-----------------|-------------------|
| `DATABASE_URL` | `file:./prisma/dev.db` | URL do Neon PostgreSQL |
| `NEXTAUTH_SECRET` | qualquer string | string aleatória segura (32+ chars) |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://seu-site.vercel.app` |

---

## ❓ Problemas Comuns

**Build falhou na Vercel: `Error: Can't reach database`**
→ Verifique se `DATABASE_URL` está correto nas Environment Variables da Vercel.
→ Confirme que a URL tem `?sslmode=require` no final (Neon exige SSL).

**Login não funciona em produção**
→ Confirme que `NEXTAUTH_URL` é exatamente a URL do seu site (sem barra no final).
→ Confirme que `NEXTAUTH_SECRET` está configurado.

**Seed falhou na Neon com erro de migration**
→ O seed precisa que as tabelas existam. Na Vercel, `prisma migrate deploy` cria as tabelas no primeiro deploy. Rode o seed somente após o primeiro deploy bem-sucedido.

**`prisma generate` error durante build**
→ O `postinstall` já executa `prisma generate`. Se der erro, verifique se o `DATABASE_URL` está acessível durante o build na Vercel.

**Erro `P1001` (não consegue conectar ao banco)**
→ Verifique se o IP da Vercel está liberado no painel do Neon (normalmente está por padrão).
