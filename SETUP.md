# Bolão Copa do Mundo 2026 - Setup Local

## Pré-requisitos

- Node.js 18+ (instalado)
- PostgreSQL 14+ rodando localmente

## 1. Instalar PostgreSQL

Se não tiver o PostgreSQL instalado:
- Windows: https://www.postgresql.org/download/windows/
- Ou via Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

## 2. Criar o banco de dados

Conecte ao PostgreSQL e crie o banco:
```sql
CREATE DATABASE bolao_copa2026;
```

Ou via psql:
```bash
psql -U postgres -c "CREATE DATABASE bolao_copa2026;"
```

## 3. Configurar variáveis de ambiente

Edite o arquivo `.env` com suas credenciais PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bolao_copa2026?schema=public"
NEXTAUTH_SECRET="bolao-copa-2026-secret-mude-antes-do-deploy"
NEXTAUTH_URL="http://localhost:3000"
```

## 4. Instalar dependências

```bash
npm install
```

## 5. Criar as tabelas (migration)

```bash
npx prisma db push
```

## 6. Popular o banco com dados iniciais

```bash
npm run db:seed
```

Isso cria:
- Usuário administrador: **bolao** / **bolinha**
- Todos os 48 jogos da fase de grupos
- Todos os jogos do mata-mata
- Regras padrão do bolão

## 7. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## Login inicial

- **Username:** bolao
- **Senha:** bolinha

> ⚠️ IMPORTANTE: Mude a senha do admin antes de qualquer deploy público!

---

## Comandos úteis

```bash
npm run dev           # Inicia servidor de desenvolvimento
npm run build         # Build para produção
npm run db:push       # Aplica schema ao banco sem migration
npm run db:migrate    # Cria e aplica migration
npm run db:seed       # Popula banco com dados iniciais
npm run db:studio     # Abre Prisma Studio (gerenciador visual do banco)
```

## Estrutura do Projeto

```
src/
  app/
    (auth)/login/        # Página de login
    (main)/              # Páginas protegidas
      dashboard/         # Dashboard principal
      games/             # Lista de jogos
      predictions/       # Palpites
      ranking/           # Ranking geral
      champion/          # Palpites especiais
      rules/             # Regras do bolão
      admin/             # Painel administrativo
    api/                 # Rotas API
  lib/
    auth.ts              # Configuração NextAuth
    prisma.ts            # Cliente Prisma
    odds.ts              # Cálculo de odds
    scoring.ts           # Cálculo de pontos
    lockTime.ts          # Lógica de bloqueio
  components/
    layout/              # Navbar, AppShell
    ui/                  # Componentes reutilizáveis
prisma/
  schema.prisma          # Schema do banco
  seed.ts                # Script de seed
```

## Fórmula de Odds

`odd = max(0.5, 1 - 0.5 × ((k-1)/(N-1))^0.8)`

Onde:
- `k` = número de participantes com o mesmo palpite
- `N` = total de participantes
- Derivada da planilha original: k=10, N=20 → 0.7249...

---

Para alterar a fórmula de odds, edite `src/lib/odds.ts` → `ODDS_CONFIG`.
