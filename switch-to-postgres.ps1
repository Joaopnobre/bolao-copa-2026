# ================================================
# Bolao Copa 2026 - Trocar para PostgreSQL + Docker
# ================================================
# Execute como: .\switch-to-postgres.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " MIGRANDO PARA POSTGRESQL + DOCKER    " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "ERRO: Docker nao encontrado." -ForegroundColor Red
    Write-Host "Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Docker encontrado" -ForegroundColor Green

# Check Docker Compose
$compose = docker compose version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Docker Compose nao encontrado." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker Compose disponivel" -ForegroundColor Green

# Start PostgreSQL container
Write-Host ""
Write-Host "Iniciando PostgreSQL via Docker Compose..." -ForegroundColor Yellow
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao iniciar PostgreSQL" -ForegroundColor Red
    exit 1
}

# Wait for PostgreSQL to be ready
Write-Host "Aguardando PostgreSQL ficar pronto..." -ForegroundColor Yellow
$attempts = 0
do {
    Start-Sleep -Seconds 2
    $health = docker inspect bolao_postgres --format "{{.State.Health.Status}}" 2>$null
    $attempts++
    Write-Host "  Tentativa $attempts/15: $health" -ForegroundColor Gray
} while ($health -ne "healthy" -and $attempts -lt 15)

if ($health -ne "healthy") {
    Write-Host "AVISO: PostgreSQL pode nao estar pronto ainda, continuando..." -ForegroundColor Yellow
}
Write-Host "✓ PostgreSQL pronto" -ForegroundColor Green

# Copy PostgreSQL schema
Write-Host ""
Write-Host "Atualizando schema Prisma para PostgreSQL..." -ForegroundColor Yellow
Copy-Item "prisma\schema.postgresql.prisma" "prisma\schema.prisma" -Force

# Update .env
Write-Host "Atualizando .env..." -ForegroundColor Yellow
Copy-Item ".env.postgresql" ".env" -Force

# Regenerate Prisma client
Write-Host "Regenerando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao gerar cliente Prisma" -ForegroundColor Red; exit 1 }

# Push schema
Write-Host "Criando tabelas no PostgreSQL..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao criar tabelas" -ForegroundColor Red; exit 1 }
Write-Host "✓ Tabelas criadas" -ForegroundColor Green

# Seed
Write-Host "Populando banco..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao popular banco" -ForegroundColor Red; exit 1 }
Write-Host "✓ Banco populado" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  POSTGRESQL CONFIGURADO COM SUCESSO! " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Banco: postgresql://bolao:bolao2026@localhost:5432/bolao_copa2026" -ForegroundColor Cyan
Write-Host ""
Write-Host "Inicie o servidor:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para parar o PostgreSQL:" -ForegroundColor White
Write-Host "  docker compose down" -ForegroundColor Yellow
Write-Host ""
