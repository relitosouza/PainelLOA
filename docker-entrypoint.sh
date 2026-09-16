#!/bin/sh
set -e

# Se AUTO_DB_PUSH estiver habilitado, sincroniza as tabelas com o Postgres
if [ "$AUTO_DB_PUSH" = "true" ]; then
  echo "🔄 Executando prisma db push..."
  npx prisma db push --skip-generate || echo "⚠️ Aviso: prisma db push encontrou um problema ao conectar."
fi

exec "$@"
