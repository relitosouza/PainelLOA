# Restauração do banco de dados

Resumo do levantamento feito em 21/09/2026 sobre credenciais e artefatos usados na restauração do banco do Painel LOA.

## Senha da restauração

- Variável: `RESTORE_SECURITY_PASSWORD`
- Arquivo: `.env.local` (não versionado)
- É a senha exigida pelo fluxo de restauração da aplicação.

> O valor não é reproduzido aqui de propósito: consulte `.env.local` na máquina/servidor. Evite copiar segredos para arquivos dentro de `docs/`, que é versionado.

## Credenciais do banco

- Local (desenvolvimento): usuário `postgres`, senha `local_password`, banco `painel_loa`, porta `5432` — ver `DATABASE_URL` / `POSTGRES_URL` / `PRISMA_DATABASE_URL` em `.env` e `.env.local`.
- Docker: `POSTGRES_PASSWORD` em `docker-compose.yml` (padrão `local_password` quando a variável não é definida no ambiente).
- Produção/VPS: `DATABASE_URL` comentada em `.env.local` aponta para `127.0.0.1:5433` com usuário e banco próprios; a senha real fica no ambiente do servidor.

## Script e artefatos

- Script de restauração: `scripts/restore-db.sh`
- Backups disponíveis em `backups/`:
  - `painel_loa_backup_20260921_081014.sql.gz`
  - `painel_loa_backup_20260921_084655.sql.gz`
  - `painel_loa_backup_20260921_111550.sql.gz`
  - `antes-ajuste-receita-loa-2027-2026-09-21T13-00-18-226Z.json`

## Pontos de atenção

- Conferir se `.env` e `.env.local` continuam listados no `.gitignore` antes de qualquer commit — há senhas reais neles.
- A senha da restauração é distinta da senha do Postgres; não confundir os dois valores.
