# Proposta de Arquitetura: Fotografias Diárias / Snapshots Orçamentários (D-1 vs D0)

> **Status:** Em Análise / Aguardando Decisão  
> **Data:** 2026-09-02  
> **Objetivo:** Registrar e comparar o estado das dotações da LOA/LDO entre diferentes dias (fotografia do começo de um dia vs início do outro dia) para auditoria e acompanhamento das alterações orçamentárias.

---

## 🧭 Visão Geral

A funcionalidade permitirá "congelar" o estado do orçamento em datas específicas para:
1. Comparar as alterações ocorridas de um dia para o outro (**D-1 vs D0**).
2. Identificar quais secretarias, ações ou subelementos tiveram dotações criadas, aumentadas, reduzidas ou removidas.
3. Gerar relatórios de auditoria e linha do tempo de evolução da peça orçamentária.

---

## 📐 Estruturas e Opções para Decisão

### 1. Gatilho de Captura da Fotografia (Snapshot)

* **Opção A — Botão Manual ("Salvar Fotografia do Dia"):**
  * *Como funciona:* Botão na barra de ferramentas que permite dar um nome/rótulo (ex: *"Fechamento após reunião de Saúde - 02/09"*).
  * *Vantagens:* Controle direto pelo gestor sem gerar snapshots vazios.
* **Opção B — Automático Noturno (00:00) + Manual:**
  * *Como funciona:* Um job/cron ou gatilho diário gera a versão da virada do dia automaticamente, permitindo também versões manuais.
  * *Vantagens:* Rastreabilidade contínua sem depender de ação humana.
* **Opção C — Ao Salvar Modificações:**
  * *Como funciona:* Cada vez que alterações de valores/subelementos são salvas no banco, uma nova versão histórica com timestamp é registrada.

---

### 2. Granularidade do Snapshot

* **Opção A — Linha a Linha (Granularidade Completa - Recomendada):**
  * Salva o estado completo de cada uma das ~1.890 dotações (valores LOA, LDO, reajustes, aditamentos, subelementos, processos e vínculos).
  * *Tamanho:* ~250–300 KB por fotografia no PostgreSQL/SQLite.
  * *Benefício:* Permite rastrear exatamente qual subelemento mudou de valor.
* **Opção B — Resumo Executivo (Agregado):**
  * Salva apenas os totais consolidados por Secretaria e Ação.
  * *Tamanho:* ~15 KB por fotografia.

---

### 3. Interface e Comparativo Visual

* **Opção A — Modal / Painel de Diferenças (Diff D-1 vs D0):**
  * Visão comparativa com cartões de variação global (Total Anterior vs Atual) e tabela com realce de cores:
    * 🟢 **Verde (+):** Itens suplementados ou novas dotações.
    * 🔴 **Vermelho (-):** Itens reduzidos ou removidos.
    * ⚪ **Neutro:** Sem alteração.
* **Opção B — Seletor de Linha do Tempo ("Time Machine"):**
  * Dropdown no topo do painel para navegar e carregar o painel inteiro como ele estava em qualquer data retroativa.
* **Opção C — Híbrido (Seletor Retroativo + Relatório de Variação com Exportação PDF/Excel):**
  * Permite visualizar qualquer data e exportar o espelho comparativo de mudanças.

---

## 🗄️ Esquema de Banco de Dados Sugerido (Prisma)

```prisma
model OrcamentoSnapshot {
  id          String   @id @default(uuid())
  data        DateTime @default(now())
  rotulo      String?  // Ex: "Início do dia 02/09/2026" ou "Fechamento D-1"
  autor       String?  // Usuário responsável
  tipo        String   @default("MANUAL") // "AUTOMATICO" | "MANUAL"
  totalLdo    Float
  totalLoa    Float
  totalGeral  Float
  dadosJson   Json     // Estado completo serializado das dotações e edições
  observacoes String?
  createdAt   DateTime @default(now())

  @@index([data])
}
```

---

## 📌 Próximos Passos
Quando desejar implementar:
1. Escolher o gatilho (**A**, **B** ou **C**).
2. Definir a experiência visual (**Diff**, **Time Machine** ou **Híbrido**).
3. Solicitar a criação do schema de snapshot e dos endpoints de histórico.
