#!/bin/bash
set -eo pipefail

# ==============================================================================
# Script de Restauração (Rollback/Recovery) do Banco de Dados - Painel LOA
# Prefeitura Municipal de Osasco
# ==============================================================================

BACKUP_FILE="$1"
ENV_FILE=".env"

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: ./scripts/restore-db.sh <caminho_do_arquivo_backup.sql.gz ou .sql>"
  echo "Exemplo: ./scripts/restore-db.sh ./backups/painel_loa_backup_20260821_120000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Erro: Arquivo de backup '$BACKUP_FILE' não encontrado."
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não encontrada no arquivo .env."
  exit 1
fi

CLEAN_DATABASE_URL=$(echo "$DATABASE_URL" | sed -E 's/\?schema=[^&]+//g; s/\&schema=[^&]+//g')

echo "⚠️  ATENÇÃO: Você está prestes a restaurar a base de dados a partir de: $BACKUP_FILE"
read -p "Deseja continuar com a restauração? (s/N): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
  echo "❌ Operação cancelada pelo usuário."
  exit 0
fi

echo "🔄 Restaurando base de dados..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$CLEAN_DATABASE_URL"
else
  psql "$CLEAN_DATABASE_URL" < "$BACKUP_FILE"
fi

echo "✅ Restauração do banco concluída com sucesso!"
