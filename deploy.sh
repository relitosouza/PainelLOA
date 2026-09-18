#!/bin/bash
# ==============================================================================
# Script de Deploy Automatizado para VPS - Painel LOA
# ==============================================================================
# Uso:
#   ./deploy.sh [branch] [options]
#
# Exemplos:
#   ./deploy.sh                  # Deploy padrão da branch configurada (main)
#   ./deploy.sh staging          # Deploy da branch staging
#   ./deploy.sh main --seed      # Deploy e executa seed de usuários
#   ./deploy.sh --skip-backup    # Pula etapa de backup do Postgres
# ==============================================================================

set -eo pipefail

# Cores para saída formatada
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações padrão
DEFAULT_BRANCH="main"
BRANCH="${DEFAULT_BRANCH}"
RUN_SEED=false
SKIP_BACKUP=false
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERRO]${NC} $1" >&2
}

# Processamento de argumentos
for arg in "$@"; do
  case "$arg" in
    --seed)
      RUN_SEED=true
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      ;;
    --help|-h)
      echo -e "${CYAN}Script de Deploy - Painel LOA${NC}"
      echo "Uso: ./deploy.sh [branch] [--seed] [--skip-backup]"
      echo ""
      echo "Opções:"
      echo "  branch          Nome da branch git a atualizar (padrão: main)"
      echo "  --seed          Executa o seed de usuários (npm run db:seed:usuarios) no container"
      echo "  --skip-backup   Pula o backup de segurança do banco antes do deploy"
      exit 0
      ;;
    *)
      if [[ ! "$arg" =~ ^-- ]]; then
        BRANCH="$arg"
      fi
      ;;
  esac
done

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}   🚀 Iniciando Deploy - Painel LOA (VPS)           ${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo -e " Diretório: ${APP_DIR}"
echo -e " Branch:    ${BRANCH}"
echo -e " Data/Hora: $(date '+%d/%m/%Y %H:%M:%S')"
echo -e "${CYAN}-----------------------------------------------------${NC}"

cd "${APP_DIR}"

# 1. Verificação de pré-requisitos na VPS
log_info "Verificando dependências do sistema..."
if ! command -v git &> /dev/null; then
  log_error "Git não está instalado na VPS."
  exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  log_error "Docker Compose não foi encontrado (nem 'docker compose' nem 'docker-compose')."
  exit 1
fi

# 2. Verificar arquivo de ambiente (.env ou .env.docker)
if [ ! -f ".env" ] && [ ! -f ".env.docker" ]; then
  if [ -f ".env.docker.example" ]; then
    log_warning "Arquivo .env não encontrado! Criando a partir de .env.docker.example..."
    cp .env.docker.example .env
    log_warning "Arquivo .env criado com configurações padrão. Revise antes de usar em produção!"
  else
    log_error "Nenhum arquivo .env encontrado e .env.docker.example não está disponível."
    exit 1
  fi
fi

# 3. Backup preventivo do banco PostgreSQL (se o container estiver ativo)
if [ "$SKIP_BACKUP" = false ]; then
  DB_CONTAINER="painel-loa-db"
  if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    log_info "Executando backup de segurança do PostgreSQL antes do deploy..."
    mkdir -p "${BACKUP_DIR}"
    BACKUP_FILE="${BACKUP_DIR}/dump_pre_deploy_${TIMESTAMP}.sql"
    
    # Obtém credenciais do container ou do ambiente
    POSTGRES_USER_VAL="${POSTGRES_USER:-postgres}"
    POSTGRES_DB_VAL="${POSTGRES_DB:-painel_loa}"
    
    if docker exec "${DB_CONTAINER}" pg_dump -U "${POSTGRES_USER_VAL}" -d "${POSTGRES_DB_VAL}" > "${BACKUP_FILE}" 2>/dev/null; then
      gzip -f "${BACKUP_FILE}"
      log_success "Backup salvo em: ${BACKUP_FILE}.gz"
      # Manter apenas os últimos 10 backups automáticos para economizar disco
      ls -t "${BACKUP_DIR}"/dump_pre_deploy_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    else
      log_warning "Não foi possível gerar pg_dump automático. Continuando com cautela..."
      rm -f "${BACKUP_FILE}"
    fi
  else
    log_info "Container de banco (${DB_CONTAINER}) não está em execução. Pulando pg_dump..."
  fi
else
  log_warning "Backup pré-deploy ignorado (--skip-backup)."
fi

# 4. Atualizar código do repositório Git
log_info "Atualizando código da branch '${BRANCH}' via Git..."
git fetch origin "${BRANCH}"

# Se houver alterações locais não commitadas, protege o estado
if ! git diff-index --quiet HEAD --; then
  log_warning "Alterações locais detectadas. Criando stash temporário..."
  git stash push -m "stash_deploy_${TIMESTAMP}"
fi

git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"
CURRENT_COMMIT="$(git rev-parse --short HEAD)"
log_success "Código atualizado para o commit ${CURRENT_COMMIT} na branch ${BRANCH}."

# 5. Build e Inicialização com Docker Compose
log_info "Construindo imagens e subindo os serviços..."
${DOCKER_COMPOSE_CMD} build --no-cache app
${DOCKER_COMPOSE_CMD} up -d --force-recreate --no-deps app
${DOCKER_COMPOSE_CMD} up -d --remove-orphans

# 6. Aguardar saúde do PostgreSQL e subida do App
log_info "Aguardando inicialização dos serviços..."
sleep 5

# 7. Executar seed de usuários se solicitado
if [ "$RUN_SEED" = true ]; then
  log_info "Executando seed de usuários no banco de dados..."
  if docker exec painel-loa-app npm run db:seed:usuarios; then
    log_success "Seed de usuários finalizado com sucesso."
  else
    log_error "Falha ao executar seed de usuários."
  fi
fi

# 8. Limpeza de imagens órfãs para poupar espaço em disco na VPS
log_info "Limpando imagens antigas não utilizadas (dangling)..."
docker image prune -f > /dev/null 2>&1 || true

# 9. Verificação de Saúde / Healthcheck
log_info "Verificando status dos containers..."
${DOCKER_COMPOSE_CMD} ps

# Teste HTTP básico na porta local da aplicação
APP_PORT_NUM=$(grep -E '^APP_PORT=' .env 2>/dev/null | cut -d '=' -f2 || echo "3010")
APP_PORT_NUM="${APP_PORT_NUM:-3010}"

log_info "Testando resposta HTTP local na porta ${APP_PORT_NUM}..."
MAX_RETRIES=6
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf "http://127.0.0.1:${APP_PORT_NUM}/api/auth/session" > /dev/null 2>&1 || curl -sf "http://127.0.0.1:${APP_PORT_NUM}/" > /dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 3
done

echo -e "${CYAN}-----------------------------------------------------${NC}"
if [ "$HEALTH_OK" = true ]; then
  log_success "Aplicação respondendo com sucesso em http://127.0.0.1:${APP_PORT_NUM}"
else
  log_warning "A aplicação subiu, mas demorou para responder na porta ${APP_PORT_NUM}. Verifique os logs com:"
  echo -e "  ${YELLOW}${DOCKER_COMPOSE_CMD} logs -f app${NC}"
fi

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}   ✨ Deploy finalizado com sucesso!                ${NC}"
echo -e "${GREEN}=====================================================${NC}"