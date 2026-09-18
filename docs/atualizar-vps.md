# Roteiro: atualizar a VPS (produção) com as mudanças de 18/09/2026

> A VPS é a **produção**: os usuários editam lá, então o banco da VPS **não pode ser sobrescrito** pelo banco local.
> O deploy leva o código e a planilha; os dados do banco são ajustados pelos scripts abaixo, que rodam **no banco da VPS**.

## O que precisa chegar à VPS

| Mudança | Como chega |
|---|---|
| Código (cards, quadros, comparativo, atualização ao vivo etc.) | `./deploy.sh` |
| Planilha base com os vínculos corrigidos (`public/loa_new.xlsx`) | `./deploy.sh` (está no Git) |
| IDs das linhas religados aos dados salvos (validações, justificativas, valores, reajustes, histórico) | `scripts/migrar-ids-vinculos.ts` |
| Receita LOA 2027 (146 registros, R$ 5.577.660.000,00) | `scripts/importar-receita-loa-csv.ts` |

**Por que a migração dos IDs é obrigatória:** o ID de cada linha inclui o vínculo. Com a planilha corrigida, 1.235 linhas mudam de ID, e sem a migração deixam de aparecer na VPS **509 validações, 380 valores editados, 280 justificativas e os reajustes/aditamentos** dessas linhas. Os dados não se perdem (ficam no banco), mas somem da tela até a migração rodar.

---

## Passo a passo

### 1. No computador: juntar a branch na `main`

```bash
git checkout main && git pull
git merge chore/versionamento-e-seguranca-dados
git push
```

### 2. Na VPS: guardar os backups antes do deploy

O `git pull` desta versão **apaga do disco** os dumps que estavam versionados em `backups/` (eles deixaram de ser versionados). Copie a pasta antes:

```bash
cd /caminho/do/PainelLOA
cp -a backups ~/backups_seguranca_$(date +%Y%m%d)
```

### 3. Na VPS: deploy

```bash
./deploy.sh
```

O `deploy.sh` já faz um `pg_dump` do banco antes de atualizar (`backups/dump_pre_deploy_*.sql.gz`).

### 4. Na VPS: migrar os IDs (primeiro simular)

```bash
./scripts/rodar-script-producao.sh scripts/migrar-ids-vinculos.ts
```

A primeira execução demora alguns minutos (instala as dependências num container temporário). Confira no resultado:

- `Planilha: ... todas com vínculo no padrão`: se aparecer erro de vínculo fora do padrão, o deploy da planilha não entrou; **pare aqui**;
- os totais de IDs convertidos. No banco local foram 2.374 IDs e 131 registros de histórico; na VPS os números podem ser diferentes, porque os usuários editaram lá;
- `✓ Todos os IDs novos correspondem a linhas da planilha`. Se aparecer aviso de IDs sem linha, **pare e investigue** antes de aplicar.

Se estiver tudo certo, aplique:

```bash
./scripts/rodar-script-producao.sh scripts/migrar-ids-vinculos.ts --aplicar
```

O script grava um backup do que vai alterar em `backups/antes-migracao-ids-*.json` e faz tudo numa única transação. Pode ser executado de novo sem risco: na segunda vez responde "Nada a migrar".

### 5. Na VPS: importar a receita LOA 2027

Copie o CSV da SF para a VPS, dentro de `backups/` (pasta fora do Git):

```bash
# no computador
scp "Receita 2027 (1).csv" usuario@vps:/caminho/do/PainelLOA/backups/receita-loa-2027.csv
```

```bash
# na VPS: simular
./scripts/rodar-script-producao.sh scripts/importar-receita-loa-csv.ts backups/receita-loa-2027.csv
# conferir: 146 registros e "✓ Soma confere com o total do CSV" (R$ 5.577.660.000,00); depois gravar:
./scripts/rodar-script-producao.sh scripts/importar-receita-loa-csv.ts backups/receita-loa-2027.csv --aplicar
```

Não use o importador da tela para este CSV: ele recusa valores negativos, e as 4 deduções do Fundeb são negativas, então o total não fecharia.

### 6. Conferir na tela

Na Análise LOA e na Visão Analítica da VPS:

- **Painel da Receita → Valor Previsto LOA:** Prefeitura R$ 5.577.660.000,00 + indiretas (IPMO, IPMO-RC, FITO);
- **Painel da Despesa → Valor Previsto LDO:** R$ 5.868.871.609,90;
- **Detalhamento Analítico:** validações e justificativas continuam aparecendo nas linhas da Saúde, da Educação e das demais secretarias;
- **Visão Analítica → Quadro Comparativo:** "LOA Proposta Total" igual ao "Valor Previsto LOA" da Análise LOA.

---

## Se algo der errado

- **Voltar o banco inteiro** ao estado de antes do deploy: `./scripts/restore-db.sh backups/dump_pre_deploy_<data>.sql.gz`. Isso desfaz também tudo o que os usuários salvaram depois do deploy.
- **Voltar só a migração dos IDs:** os valores anteriores estão em `backups/antes-migracao-ids-*.json`.
- **Voltar só a receita:** os registros anteriores estão em `backups/antes-receita-loa-2027-*.json`.
