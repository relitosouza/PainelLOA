#!/bin/bash
set -eo pipefail

# ==============================================================================
# Script de Restauração (Rollback/Recovery) do Banco de Dados - Painel LOA
# Prefeitura Municipal de Osasco
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_FILE="$1"
ENV_FILE="${BASE_DIR}/.env"

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: ./scripts/restore-db.sh <caminho_do_arquivo_backup.sql.gz ou .sql>"
  echo "Exemplo: ./scripts/restore-db.sh ./backups/painel_loa_backup_20260821_120000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Erro: Arquivo de backup '$BACKUP_FILE' não encontrado."
  exit 1
fi

if [ -z "$DATABASE_URL" ] && [ -f "$ENV_FILE" ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="postgresql://postgres:local_password@postgres:5432/painel_loa?schema=public"
fi

CLEAN_DATABASE_URL=$(echo "$DATABASE_URL" | sed -E 's/\?schema=[^&]+//g; s/\&schema=[^&]+//g')

echo "⚠️  ATENÇÃO: Você está prestes a restaurar a base de dados a partir de: $BACKUP_FILE"

# Se não estiver em modo não-interativo, solicita confirmação
if [ -t 0 ]; then
  read -p "Deseja continuar com a restauração? (s/N): " CONFIRM
  if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo "❌ Operação cancelada pelo usuário."
    exit 0
  fi
fi

echo "🔄 Restaurando base de dados..."

RESTORE_SUCCESS=false

# Tentativa 1: psql local se disponível
if command -v psql &> /dev/null; then
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    if gunzip -c "$BACKUP_FILE" | psql "$CLEAN_DATABASE_URL" 2>/dev/null; then
      RESTORE_SUCCESS=true
    fi
  else
    if psql "$CLEAN_DATABASE_URL" < "$BACKUP_FILE" 2>/dev/null; then
      RESTORE_SUCCESS=true
    fi
  fi
fi

# Tentativa 2: Restauração via container Docker do banco
if [ "$RESTORE_SUCCESS" = false ] && command -v docker &> /dev/null; then
  DB_CONTAINER="painel-loa-db"
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
    POSTGRES_USER_VAL="${POSTGRES_USER:-postgres}"
    POSTGRES_DB_VAL="${POSTGRES_DB:-painel_loa}"
    if [[ "$BACKUP_FILE" == *.gz ]]; then
      if gunzip -c "$BACKUP_FILE" | docker exec -i "${DB_CONTAINER}" psql -U "${POSTGRES_USER_VAL}" -d "${POSTGRES_DB_VAL}" 2>/dev/null; then
        RESTORE_SUCCESS=true
      fi
    else
      if docker exec -i "${DB_CONTAINER}" psql -U "${POSTGRES_USER_VAL}" -d "${POSTGRES_DB_VAL}" < "$BACKUP_FILE" 2>/dev/null; then
        RESTORE_SUCCESS=true
      fi
    fi
  fi
fi

if [ "$RESTORE_SUCCESS" = true ]; then
  echo "✅ Restauração do banco concluída com sucesso!"
else
  echo "❌ Falha ao restaurar backup. Verifique se o container 'painel-loa-db' está em execução ou se 'psql' está disponível."
  exit 1
fi
