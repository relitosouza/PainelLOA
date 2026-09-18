# Plano: Versionamento dos Valores Digitados e Importados

> **Status:** Aguardando decisões (ver [Decisões pendentes](#decisões-pendentes))
> **Data:** 18/09/2026
> **Relacionado:** [proposta-snapshots-diarios.md](proposta-snapshots-diarios.md). Este plano parte daquela proposta e a completa com o versionamento das importações.

---

## Problema

Hoje o sistema **não guarda histórico**: cada gravação apaga a anterior. Não dá para saber quanto valia uma dotação na semana passada, comparar duas situações do orçamento nem desfazer um erro.

O risco já apareceu na prática: na correção dos vínculos (01.110.0000 / 01.200.0000 / 01.310.0000), o ID de 1.235 linhas mudou, e validações, justificativas e valores editados pararam de aparecer. A única proteção foi fazer backup manual em arquivo JSON (`backups/`).

## Como os dados são gravados hoje

| Dado | Onde fica | O que acontece ao gravar de novo |
|---|---|---|
| Valores digitados na Análise LOA (valores, reajustes, aditamentos, Sugestão SF, Corte GP, subelementos, validações, justificativas) | 7 registros JSON em `PainelConfig` (`painel_loa_*`) | **Substituídos inteiros** a cada "Salvar Alterações" |
| Receita LOA importada | Tabela `LoaReceita` | A importação **apaga o exercício** (`deleteMany`) e grava o novo |
| Planilha base da despesa | Arquivo `public/loa_new.xlsx` | **Arquivo sobrescrito** |
| Ações da LDO | `LdoAcaoImportacao` + `LdoAcao` | ✅ Já versiona: a importação anterior fica com `ativo = false` |
| Alterações de valor LOA com justificativa | `AlteracaoOrcamentaria` / `ExclusaoDotacao` | ✅ Registro de auditoria, mas **só do valor LOA**, e não de reajuste, aditamento, SF ou GP |

---

## Proposta: três camadas

### Camada 1: uma versão a cada "Salvar" (automática) ⭐ começar por aqui

Nova tabela `VersaoOrcamento`. A cada "Salvar Alterações" na Análise LOA, grava uma fotografia com:

- data/hora, usuário e rótulo (opcional);
- totais: LDO, LOA vigente, reajuste, aditamento, LOA 2027, Sugestão SF e Corte GP;
- **as linhas já calculadas** (cerca de 2.100 dotações), e não os JSONs crus do `PainelConfig`.

**Por que gravar as linhas calculadas:** o ID de uma linha muda quando o vínculo muda, como vimos na migração. Uma fotografia dos JSONs crus perderia essas linhas; com as linhas prontas, a comparação entre versões continua confiável.

**Como obter as linhas:** usar `loadAnaliseLoaItems()` ([src/lib/loa-analise-items.server.ts](../src/lib/loa-analise-items.server.ts)), a mesma função que a tela e o quadro comparativo da Visão Analítica usam. A fotografia fica igual ao que a tela mostra.

**Tamanho:** perto de 1 MB por versão. Só grava se algo mudou desde a última versão (comparar um hash das linhas).

Esboço do esquema:

```prisma
model VersaoOrcamento {
  id          BigInt   @id @default(autoincrement())
  exercicio   Int      @default(2027)
  criadoEm    DateTime @default(now())
  usuarioId   String?
  nomeUsuario String?  @db.VarChar(255)
  origem      String   @default("SALVAR") @db.VarChar(30) // SALVAR | IMPORTACAO | MANUAL | RESTAURACAO
  rotulo      String?  @db.VarChar(255)                  // ex.: "Proposta enviada à Câmara"
  hash        String   @db.VarChar(64)                   // evita versões repetidas
  totalLdo        Decimal @db.Decimal(18, 2)
  totalVigente    Decimal @db.Decimal(18, 2)
  totalReajuste   Decimal @db.Decimal(18, 2)
  totalAditamento Decimal @db.Decimal(18, 2)
  totalLoa        Decimal @db.Decimal(18, 2)
  totalSugestaoSf Decimal @db.Decimal(18, 2)
  totalCorteGp    Decimal @db.Decimal(18, 2)
  linhas      Json     // linhas calculadas da Análise LOA

  @@index([exercicio, criadoEm])
}
```

### Camada 2: importações que não apagam

Aplicar à **receita LOA** e à **planilha base da despesa** o padrão que a LDO já usa:

- cada importação vira uma versão (`ativo = true`), e a anterior passa a `ativo = false` em vez de ser apagada;
- a planilha base passa a ser guardada no banco a cada upload, em vez de sobrescrever `public/loa_new.xlsx`;
- toda importação também gera uma versão na Camada 1 (`origem = "IMPORTACAO"`).

Pontos no código:
- receita LOA: [src/app/api/receitas/loa/confirmar-importacao/route.ts](../src/app/api/receitas/loa/confirmar-importacao/route.ts) (hoje faz `deleteMany` por exercício);
- planilha base: rota de importação da planilha analítica completa (commit `13b651f`).

### Camada 3: rótulos, comparação e restauração

- **Marcar versão:** botão para dar nome a um momento ("Fechamento 30/09", "Proposta enviada à Câmara").
- **Comparar duas versões:** totais lado a lado e as linhas que entraram, saíram ou mudaram de valor (verde/vermelho), com exportação para Excel/PDF.
- **Restaurar:** volta o painel a uma versão anterior. **Antes de restaurar, grava uma versão do estado atual**, para a restauração também poder ser desfeita.

Na proposta de snapshots, isso corresponde às opções **C (ao salvar)**, **A (linha a linha)** e **C (híbrido)**.

---

## Decisões pendentes

Responder antes de implementar a Camada 1:

1. **Quem pode restaurar uma versão?**
   - [ ] Só Administrador
   - [ ] Administrador e Planejamento
2. **Por quanto tempo guardar as versões automáticas?**
   - [ ] Todas, para sempre
   - [ ] Últimos ___ dias + todas as que tiverem rótulo
3. **Sugestão SF e Corte GP entram na fotografia?**
   - [ ] Sim, precisam de histórico
   - [ ] Não, são só simulação

---

## Ordem de implementação sugerida

1. Camada 1: modelo `VersaoOrcamento` + gravação no "Salvar Alterações" (reaproveitando `loadAnaliseLoaItems`) + testes.
2. Tela simples de histórico: lista de versões com data, usuário, rótulo e totais.
3. Camada 3: comparar duas versões e depois restaurar.
4. Camada 2: importações sem apagar (receita LOA e planilha base).

---

## Outras pendências abertas nesta sessão

Pontos levantados que ainda esperam decisão:

- **CMO no card "Valor Previsto LDO" (receita):** a CMO saiu da soma da LOA (é custeada pelo duodécimo), mas continua na LDO. Decidir se sai também da LDO. Se sair, a LDO passa a R$ 5.720.805.844,90 e a diferença a ▲ R$ 531.524.287,65.
- **Cabeçalho flutuante no Detalhamento Analítico:** o quadro agora cresce com 10/20/50/100 linhas por página, e por isso o cabeçalho deixou de ficar fixo ao rolar a página. Decidir se implementa um cabeçalho flutuante.
- **Índices constitucionais:** o valor "efetivamente aplicado" (Saúde 15% / Educação 25%) aguarda a **planilha da despesa com a fonte de recurso real** de cada dotação.
- **Emendas impositivas:** confirmar se a Lei Orgânica de Osasco fixa 50% da cota para a Saúde (hoje usamos a regra da Constituição, art. 166 §9º).
- **Tela "Elaboração da LOA":** o quadro de detalhamento da proposta usa dados de exemplo (`MOCK`) e não grava nada. Para refletir na Visão Analítica, precisa ser ligado aos dados reais.
- **Registros de teste antigos:** uma justificativa e uma alteração dos Encargos/Finanças com o texto "reverter teste" continuam com ID no formato antigo. Decidir se apaga.
- **Erro de tipo antigo:** `getPrimaryPageLinks("dashboard")` em `src/components/analytic-dashboard-layout.tsx` passa um argumento que a função não aceita.
