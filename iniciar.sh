#!/usr/bin/env bash
# ==============================================================================
# Script de Inicialização Rápida - Painel LOA
# Inicializa o Banco de Dados (PostgreSQL Docker) e a Aplicação Next.js
# ==============================================================================
# Uso:
#   ./iniciar.sh             # Sobe o banco e inicia Next.js em desenvolvimento (porta 3000)
#   ./iniciar.sh --docker    # Sobe o banco e a aplicação via Docker Compose
#   ./iniciar.sh --studio    # Sobe o banco, Prisma Studio e Next.js
#   ./iniciar.sh --seed      # Sobe o banco, roda seed de usuários e inicia o app
#   ./iniciar.sh --help      # Mostra esta ajuda
# ==============================================================================

set -eo pipefail

# Cores para saída no terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${APP_DIR}"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERRO]${NC} $1" >&2
}

# Parâmetros
MODE="dev"
RUN_SEED=false
RUN_STUDIO=false

for arg in "$@"; do
  case "$arg" in
    --docker|-d)
      MODE="docker"
      ;;
    --studio|-s)
      RUN_STUDIO=true
      ;;
    --seed)
      RUN_SEED=true
      ;;
    --help|-h)
      echo -e "${CYAN}${BOLD}Inicializador - Painel LOA${NC}"
      echo ""
      echo -e "${BOLD}Uso:${NC}"
      echo "  ./iniciar.sh [opções]"
      echo ""
      echo -e "${BOLD}Opções:${NC}"
      echo "  (sem argumentos)   Sobe o banco PostgreSQL e roda o Next.js localmente (npm run dev)"
      echo "  --docker, -d       Sobe toda a stack (banco + app) em containers via Docker Compose"
      echo "  --studio, -s       Inicia também o Prisma Studio para navegação visual do banco"
      echo "  --seed             Executa o seed de usuários antes de iniciar o servidor"
      echo "  --help, -h         Exibe esta mensagem de ajuda"
      exit 0
      ;;
    *)
      log_warning "Argumento desconhecido: $arg (use --help para ver as opções)"
      ;;
  esac
done

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}${BOLD}       PAINEL LOA - INICIALIZADOR DE AMBIENTE                   ${NC}"
echo -e "${CYAN}================================================================${NC}"

# 1. Verificar se Docker está instalado e em execução
log_info "Verificando serviço do Docker..."
if ! command -v docker >/dev/null 2>&1; then
  log_error "Docker não está instalado no sistema. Instale o Docker para prosseguir."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  log_error "O daemon do Docker não está respondendo. Inicie o Docker (ex: sudo systemctl start docker)."
  exit 1
fi
log_success "Docker ativo e operacional."

# 2. Inicializar / Verificar o Banco de Dados (PostgreSQL)
CONTAINER_NAME="painel-loa-db"
log_info "Verificando container do banco de dados (${CONTAINER_NAME})..."

CONTAINER_EXISTS=$(docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format '{{.Names}}')

if [ -z "$CONTAINER_EXISTS" ]; then
  log_info "Criando container PostgreSQL para o Painel LOA..."
  docker run -d \
    --name "${CONTAINER_NAME}" \
    -p 5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=local_password \
    -e POSTGRES_DB=painel_loa \
    -v painel_loa_pgdata:/var/lib/postgresql/data \
    --restart unless-stopped \
    postgres:16-alpine >/dev/null
  log_success "Container ${CONTAINER_NAME} criado com sucesso."
else
  STATUS=$(docker inspect -f '{{.State.Status}}' "${CONTAINER_NAME}")
  if [ "$STATUS" != "running" ]; then
    log_info "Container existente está parado. Iniciando ${CONTAINER_NAME}..."
    docker start "${CONTAINER_NAME}" >/dev/null
    log_success "Container ${CONTAINER_NAME} iniciado."
  else
    log_success "Container ${CONTAINER_NAME} já está em execução."
  fi
fi

# Aguardar PostgreSQL aceitar conexões
log_info "Aguardando PostgreSQL ficar pronto para conexões..."
MAX_ATTEMPTS=30
ATTEMPT=0
until docker exec "${CONTAINER_NAME}" pg_isready -U postgres -d painel_loa >/dev/null 2>&1 || [ $ATTEMPT -ge $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
  log_error "Tempo esgotado aguardando o PostgreSQL. Verifique os logs com: docker logs ${CONTAINER_NAME}"
  exit 1
fi
log_success "PostgreSQL conectado e saudável na porta 5432."

# 3. Sincronização do Prisma Client
if [ "$MODE" = "dev" ] || [ "$RUN_SEED" = true ]; then
  log_info "Gerando cliente Prisma e validando schema..."
  npx prisma generate >/dev/null
  log_success "Prisma Client sincronizado."
fi

# 4. Executar Seed se solicitado
if [ "$RUN_SEED" = true ]; then
  log_info "Executando seed de usuários..."
  npm run db:seed:usuarios
  log_success "Seed de usuários concluído."
fi

# 5. Inicialização da Aplicação
if [ "$MODE" = "docker" ]; then
  log_info "Iniciando aplicação completa via Docker Compose..."
  docker compose up -d app
  echo ""
  echo -e "${GREEN}================================================================${NC}"
  echo -e "${GREEN}${BOLD} ✓ Painel LOA (Docker) inicializado com sucesso!               ${NC}"
  echo -e "${GREEN}================================================================${NC}"
  echo -e "  • Aplicação:  ${BOLD}http://localhost:3010${NC}"
  echo -e "  • PostgreSQL: ${BOLD}localhost:5432${NC} (Banco: painel_loa)"
  echo -e "  • Para parar: ${CYAN}docker compose stop${NC}"
  echo -e "${GREEN}================================================================${NC}"
  exit 0
fi

# Modo Desenvolvimento Local (padrão)
STUDIO_PID=""
cleanup() {
  echo ""
  log_info "Encerrando serviços locais..."
  if [ -n "$STUDIO_PID" ]; then
    kill "$STUDIO_PID" 2>/dev/null || true
  fi
  log_success "Aplicação local encerrada. (O banco de dados continua rodando em segundo plano)."
  exit 0
}
trap cleanup SIGINT SIGTERM

if [ "$RUN_STUDIO" = true ]; then
  log_info "Iniciando Prisma Studio em segundo plano (porta 5555)..."
  npx prisma studio --browser none >/dev/null 2>&1 &
  STUDIO_PID=$!
  log_success "Prisma Studio ativo em http://localhost:5555"
fi

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}${BOLD} ✓ Banco de dados e dependências prontos!                      ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "  • Banco (PostgreSQL): ${BOLD}localhost:5432${NC} (DB: painel_loa)"
echo -e "  • Servidor Next.js:   ${BOLD}http://localhost:3000${NC}"
if [ "$RUN_STUDIO" = true ]; then
  echo -e "  • Prisma Studio:      ${BOLD}http://localhost:5555${NC}"
fi
echo -e "  • Pressione ${BOLD}Ctrl+C${NC} para pausar a aplicação."
echo -e "${GREEN}================================================================${NC}"
echo ""

log_info "Iniciando servidor Next.js..."
npm run dev
