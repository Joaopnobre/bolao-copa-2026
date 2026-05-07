# ============================================
# Bolao Copa do Mundo 2026 - Setup Automatico
# ============================================

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " BOLAO COPA DO MUNDO 2026 - SETUP " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Node.js nao encontrado. Instale em https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green

# Check if PostgreSQL service exists
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Write-Host "Iniciando PostgreSQL..." -ForegroundColor Yellow
        Start-Service $pgService.Name
    }
    Write-Host "✓ PostgreSQL rodando" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "AVISO: PostgreSQL nao encontrado como servico Windows." -ForegroundColor Yellow
    Write-Host "Opcoes:" -ForegroundColor Yellow
    Write-Host "  1. Instale PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name postgres postgres" -ForegroundColor White
    Write-Host ""
    Write-Host "Apos instalar, crie o banco:" -ForegroundColor Yellow
    Write-Host "  psql -U postgres -c 'CREATE DATABASE bolao_copa2026;'" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "O PostgreSQL ja esta rodando? (s/n)"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 1
    }
}

# Install dependencies
Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao instalar dependencias" -ForegroundColor Red; exit 1 }
Write-Host "✓ Dependencias instaladas" -ForegroundColor Green

# Push schema
Write-Host ""
Write-Host "Criando tabelas no banco..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao criar tabelas. Verifique a conexao com PostgreSQL." -ForegroundColor Red
    Write-Host "Edite o arquivo .env com suas credenciais corretas." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Tabelas criadas" -ForegroundColor Green

# Seed
Write-Host ""
Write-Host "Populando banco de dados..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao popular banco" -ForegroundColor Red; exit 1 }
Write-Host "✓ Banco populado" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host " SETUP CONCLUIDO COM SUCESSO! " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Inicie o servidor:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Login: bolao / bolinha" -ForegroundColor Yellow
Write-Host ""
