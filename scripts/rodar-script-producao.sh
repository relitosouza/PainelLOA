#!/bin/bash
# ==============================================================================
# Executa um script TypeScript de manutenção contra o banco do Docker (VPS).
#
# O container da aplicação roda a versão compilada (standalone), sem o código-fonte
# nem o tsx. Este executor sobe um container Node temporário, com o repositório
# montado, que acessa o PostgreSQL pela rede do container painel-loa-db.
#
# Uso:
#   ./scripts/rodar-script-producao.sh scripts/migrar-ids-vinculos.ts
#   ./scripts/rodar-script-producao.sh scripts/migrar-ids-vinculos.ts --aplicar
#   ./scripts/rodar-script-producao.sh scripts/importar-receita-loa-csv.ts "backups/Receita 2027.csv"
# ==============================================================================
set -eo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_CONTAINER="painel-loa-db"
SCRIPT="$1"
shift || true

if [ -z "$SCRIPT" ] || [ ! -f "${APP_DIR}/${SCRIPT}" ]; then
  echo "Uso: ./scripts/rodar-script-producao.sh <scripts/arquivo.ts> [argumentos]"
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "❌ O container ${DB_CONTAINER} não está em execução."
  exit 1
fi

# Credenciais do banco: variáveis de ambiente, senão as do .env que o docker-compose usa, com os mesmos padrões.
ler_env() { { grep -E "^$1=" "${APP_DIR}/.env" 2>/dev/null || true; } | tail -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'"; }
PG_USER="${POSTGRES_USER:-$(ler_env POSTGRES_USER)}"; PG_USER="${PG_USER:-postgres}"
PG_PASSWORD="${POSTGRES_PASSWORD:-$(ler_env POSTGRES_PASSWORD)}"; PG_PASSWORD="${PG_PASSWORD:-local_password}"
PG_DB="${POSTGRES_DB:-$(ler_env POSTGRES_DB)}"; PG_DB="${PG_DB:-painel_loa}"

echo "▶ Executando ${SCRIPT} $* (banco ${PG_DB} em ${DB_CONTAINER})"
echo "  Preparando dependências num container temporário (a primeira vez demora alguns minutos)..."

# node_modules fica num volume próprio, para não misturar com o repositório nem com o container da aplicação.
docker run --rm -i \
  --network "container:${DB_CONTAINER}" \
  -v "${APP_DIR}:/work" \
  -v painel_loa_scripts_node_modules:/work/node_modules \
  -w /work \
  -e DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:5432/${PG_DB}?schema=public" \
  node:22-alpine sh -c '
    set -e
    apk add --no-cache openssl > /dev/null
    npm ci --no-audit --no-fund --loglevel=error > /dev/null
    npx prisma generate > /dev/null
    npx --yes tsx "$@"
  ' sh "${SCRIPT}" "$@"
