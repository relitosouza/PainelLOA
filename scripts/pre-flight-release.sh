#!/bin/bash
set -eo pipefail

# ==============================================================================
# Script de Pré-Voo e Release de Produção - Painel LOA
# Prefeitura Municipal de Osasco
# ==============================================================================

echo "🚀 [1/5] Executando verificação de tipos e linting..."
npm run lint

echo "🧪 [2/5] Executando suíte completa de testes automatizados..."
npm run test

echo "🗄️ [3/5] Gerando cliente do banco de dados (Prisma)..."
npx prisma generate

echo "📦 [4/5] Gerando pacote otimizado de produção (Next.js build)..."
npm run build

echo "💾 [5/5] Gerando snapshot de backup de segurança pré-deploy..."
chmod +x ./scripts/backup-db.sh ./scripts/restore-db.sh || true
./scripts/backup-db.sh || echo "⚠️ Aviso: Backup automático do banco ignorado no ambiente atual."

echo "======================================================================"
echo "🎉 PRÉ-VOO CONCLUÍDO COM SUCESSO! A versão está pronta para produção."
echo "======================================================================"
