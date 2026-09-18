#!/bin/bash

# ==============================================================================
# Script de Backup Automatizado do Banco de Dados - Painel LOA
# Prefeitura Municipal de Osasco
# ==============================================================================

echo "🔄 [$(date '+%Y-%m-%d %H:%M:%S')] Iniciando rotina de backup do banco de dados..."

# Resolver diretório base de forma independente de onde o script é chamado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_DIR="${BACKUP_DIR:-${BASE_DIR}/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/painel_loa_backup_${TIMESTAMP}.sql"
ENV_FILE="${BASE_DIR}/.env"

echo "📂 Diretório de backup: ${BACKUP_DIR}"

# 1. Assegurar diretório com permissões amplas
mkdir -p "${BACKUP_DIR}" 2>/dev/null || true
chmod 777 "${BACKUP_DIR}" 2>/dev/null || true

# Teste prévio de permissão de escrita
if ! touch "${BACKUP_DIR}/.write_test_${TIMESTAMP}" 2>/dev/null; then
  echo "❌ Erro de permissão: Não foi possível gravar no diretório '${BACKUP_DIR}'."
  echo "👉 Solução na VPS: execute 'chmod -R 777 ${BACKUP_DIR}' ou execute com sudo."
  exit 1
fi
rm -f "${BACKUP_DIR}/.write_test_${TIMESTAMP}" 2>/dev/null || true

# 2. Obter DATABASE_URL do ambiente ou do .env
if [ -z "$DATABASE_URL" ] && [ -f "$ENV_FILE" ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

# Fallback para padrão Docker se não encontrado
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="postgresql://postgres:local_password@postgres:5432/painel_loa?schema=public"
fi

# Limpa parâmetros específicos do Prisma (?schema=public) para compatibilidade nativa
CLEAN_DATABASE_URL=$(echo "$DATABASE_URL" | sed -E 's/\?schema=[^&]+//g; s/\&schema=[^&]+//g')

# 3. Execução do dump
DUMP_SUCCESS=false
ERROR_MSG=""

# Tentativa 1: Via container Docker do banco (método mais confiável na VPS)
if command -v docker &> /dev/null; then
  DB_CONTAINER="painel-loa-db"
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
    echo "🐳 Executando pg_dump via container Docker '${DB_CONTAINER}'..."
    POSTGRES_USER_VAL="${POSTGRES_USER:-postgres}"
    POSTGRES_DB_VAL="${POSTGRES_DB:-painel_loa}"
    if docker exec "${DB_CONTAINER}" pg_dump -U "${POSTGRES_USER_VAL}" -d "${POSTGRES_DB_VAL}" > "${BACKUP_FILE}" 2>/tmp/pg_dump_err.log; then
      if [ -s "${BACKUP_FILE}" ]; then
        DUMP_SUCCESS=true
      fi
    else
      ERROR_MSG=$(cat /tmp/pg_dump_err.log 2>/dev/null || echo "Falha ao rodar pg_dump via docker exec")
    fi
    rm -f /tmp/pg_dump_err.log 2>/dev/null || true
  fi
fi

# Tentativa 2: pg_dump nativo instalado no PATH do sistema
if [ "$DUMP_SUCCESS" = false ] && command -v pg_dump &> /dev/null; then
  echo "⚙️ Executando pg_dump nativo local..."
  if pg_dump "$CLEAN_DATABASE_URL" > "${BACKUP_FILE}" 2>/tmp/pg_dump_err.log; then
    if [ -s "${BACKUP_FILE}" ]; then
      DUMP_SUCCESS=true
    fi
  else
    ERROR_MSG=$(cat /tmp/pg_dump_err.log 2>/dev/null || echo "Falha na conexão pg_dump")
    # Tentativa conectando em localhost se falhar por host postgres
    FALLBACK_URL=$(echo "$CLEAN_DATABASE_URL" | sed 's/@postgres:/@127.0.0.1:/')
    if pg_dump "$FALLBACK_URL" > "${BACKUP_FILE}" 2>/dev/null && [ -s "${BACKUP_FILE}" ]; then
      DUMP_SUCCESS=true
    fi
  fi
  rm -f /tmp/pg_dump_err.log 2>/dev/null || true
fi

# 4. Verificação de resultado
if [ "$DUMP_SUCCESS" = true ] && [ -s "${BACKUP_FILE}" ]; then
  gzip -f "${BACKUP_FILE}"
  chmod 666 "${BACKUP_FILE}.gz" 2>/dev/null || true
  FILE_SIZE=$(du -h "${BACKUP_FILE}.gz" 2>/dev/null | cut -f1 || echo "")
  echo "✅ Backup concluído com sucesso: ${BACKUP_FILE}.gz (${FILE_SIZE})"
else
  rm -f "${BACKUP_FILE}"
  echo "❌ Falha ao executar o backup do banco de dados."
  if [ -n "$ERROR_MSG" ]; then
    echo "Detalhes do erro: $ERROR_MSG"
  fi
  echo "Dica: Verifique se o container 'painel-loa-db' está rodando com 'docker ps'."
  exit 1
fi

# 5. Política de retenção (mantendo os últimos 15 backups)
echo "🧹 Aplicando política de retenção (mantendo os últimos 15 backups)..."
ls -t "${BACKUP_DIR}"/painel_loa_backup_*.sql* 2>/dev/null | tail -n +16 | xargs -r rm -f 2>/dev/null || true

echo "✨ Rotina de governança e backup finalizada com sucesso."
