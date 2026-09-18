#!/bin/bash
set -eo pipefail

# ==============================================================================
# Script de Correção de Permissões da Aplicação - Painel LOA
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🔧 Corrigindo permissões das pastas da aplicação em: ${BASE_DIR}"

# 1. Garantir pasta de backups com permissão total de leitura/escrita
mkdir -p "${BASE_DIR}/backups"
chmod 777 "${BASE_DIR}/backups"
chmod -R a+rwX "${BASE_DIR}/backups" 2>/dev/null || true

# 2. Garantir que scripts tenham permissão de execução
chmod +x "${BASE_DIR}"/scripts/*.sh 2>/dev/null || true
chmod +x "${BASE_DIR}"/*.sh 2>/dev/null || true

# 3. Teste de gravação na pasta backups
TEST_FILE="${BASE_DIR}/backups/.perm_test_$(date +%s)"
if touch "$TEST_FILE" 2>/dev/null; then
  rm -f "$TEST_FILE"
  echo "✅ Pasta 'backups/' está acessível e com permissão de gravação confirmada."
else
  echo "⚠️ Aviso: Permissão não pôde ser alterada completamente. Se estiver na VPS, execute com 'sudo'."
fi

echo "✨ Permissões ajustadas com sucesso."
