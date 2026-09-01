# 📊 Guia Explicativo dos Relatórios da LOA (Lei Orçamentária Anual)

Este documento descreve detalhadamente a estrutura, o conteúdo e os dados presentes em cada tipo de relatório gerado pelo sistema do Painel da LOA.

---

## 📑 Sumário

1. [Relatório Técnico Orçamentário da LOA (PDF / Impressão Oficial)](#1-relatório-técnico-orçamentário-da-loa-pdf--impressão-oficial)
2. [Relatório Executivo / Sala de Situação (PDF Síntese)](#2-relatório-executivo--sala-de-situação-pdf-síntese)
3. [Relatório em Planilha de Auditoria (Excel / .xlsx)](#3-relatório-em-planilha-de-auditoria-excel--xlsx)
4. [Dicionário de Campos e Boas Práticas de Leitura](#4-dicionário-de-campos-e-boas-práticas-de-leitura)

---

## 1. Relatório Técnico Orçamentário da LOA (PDF / Impressão Oficial)

O **Relatório Técnico Oficial** é estruturado no formato padrão exigido por secretarias e órgãos de controle, servindo como documento de comprovação, prestação de contas e planejamento da dotação orçamentária.

### 🏛️ Identificação e Cabeçalho Institucional
* **Exercício Orçamentário:** Ano de vigência fiscal da peça (ex.: *2027*).
* **Órgão Responsável:** Código e denominação do órgão governamental (ex.: *Órgão 01 - Prefeitura do Município de Osasco*).
* **Secretaria Municipal:** Identificação da secretaria titular dos programas e ações (ex.: *11 - Secretaria de Serviços e Obras*).
* **Unidade Orçamentária:** Unidade gestora e executora da despesa (ex.: *01.11.001.00 - Gabinete da Secretaria de Serviços e Obras*).
* **Data e Hora de Emissão:** Timestamp oficial de geração do documento.

---

### 📊 Quadro Resumo de Totais Globais
Exibe o balanço financeiro consolidado dos itens selecionados ou filtrados:
* **Total LDO (Previsto):** Valor base de referência orçado na Lei de Diretrizes Orçamentárias.
* **Total Base LOA:** Montante base fixado para as dotações da LOA.
* **Total de Reajustes / Correções:** Somatório dos valores destinados a correções monetárias e contratuais.
* **Total de Aditamentos / Expansões:** Somatório dos valores de acréscimo de escopo ou novas demandas.
* **Valor Total Consolidado da LOA:** Resultado final do cálculo:
  $$\text{Valor Total LOA} = \text{Base LOA} + \text{Reajustes} + \text{Aditamentos}$$
* **Variação / Diferença (R$ e %):** Indicador de expansão ou contingenciamento frente à LDO.

---

### 📑 Detalhamento Analítico por Ação Orçamentária
Cada bloco do relatório agrupa as despesas por **Ação Orçamentária / Projeto / Atividade**:

| Coluna | Descrição da Informação |
| :--- | :--- |
| **Natureza / Elemento** | Código e especificação econômica da despesa (ex.: *3.3.90.39 - Outros Serviços de Terceiros - PJ*, *4.4.90.51 - Obras e Instalações*, *3.1.90.11 - Vencimentos e Vantagens Fixas*). |
| **Vínculo / Fonte** | Código de aplicação e fonte de recursos pagadora (ex.: *01.110.0000 - Tesouro Municipal*, repasses vinculados, convênios ou fundos). |
| **Processo / Sub-elemento / Obs** | Número de processo administrativo ou contrato, identificador se o projeto já foi iniciado e observações operacionais. |
| **Valor LDO (R$)** | Valor orçado previamente na LDO. |
| **Valor Base LOA (R$)** | Dotação base inicial na LOA. |
| **Reajuste (R$)** | Valor de correção monetária/contratual aplicado. |
| **Aditamento (R$)** | Valor de ampliação/aditivo contratual aplicado. |
| **Valor Total (R$)** | Valor líquido total destinado ao item de despesa. |
| **Justificativa Técnica** | Exposição dos motivos operacionais, legais ou técnicos que justificaram qualquer alteração no valor. |

---

## 2. Relatório Executivo / Sala de Situação (PDF Síntese)

Voltado a secretários, prefeitos e gestores de alto escalão para rápida tomada de decisão.

### 📌 Informações Disponibilizadas:
1. **Indicadores Macroeconômicos (Cards de Destaque):**
   * Volume global do orçamento municipal.
   * Participação de **Custeio Real** (despesas correntes e manutenção).
   * Participação de **Investimentos Reais** (obras, intervenções estruturais e bens de capital).
   * Percentual alocado em **Pessoal e Encargos Sociais**.
2. **Distribuição por Categoria Econômica:**
   * Pessoal e Encargos.
   * Outras Despesas Correntes.
   * Investimentos.
   * Amortização e Juros da Dívida Pública.
3. **Ranking das Maiores Secretarias:**
   * Listagem decrescente com os maiores orçamentos por pasta, valor nominal e percentual de participação no total do município.

---

## 3. Relatório em Planilha de Auditoria (Excel / .xlsx)

Para manipulação de dados, conferência de cálculos e auditoria, o arquivo gerado contém 3 abas organizadas:

```
relatorio-tecnico-orcamento-osasco-2027.xlsx
 ├── 📄 Resumo_Acoes_LOA
 ├── 📄 Detalhamento_Analitico
 └── 📄 Memoria_Ajustes
```

### Detalhe das Abas:
1. **`Resumo_Acoes_LOA`**:
   * Visão agregada por Ação/Programa.
   * Totais de LDO, LOA, Diferença em R$ e Percentual de Variação consolidada.
2. **`Detalhamento_Analitico`**:
   * Todos os registros no nível mais granular (linha a linha).
   * Identificadores de órgãos, secretarias, ações, fontes, elementos, processos e detalhamento numérico completo.
3. **`Memoria_Ajustes`**:
   * Trilha de auditoria completa contendo todas as rubricas que sofreram alterações.
   * Comparativo: *Valor Original*, *Novo Valor*, *Diferença* e *Justificativa Técnica detalhada*.

---

## 4. Dicionário de Campos e Boas Práticas de Leitura

* **LDO:** Lei de Diretrizes Orçamentárias (metas e prioridades preliminares).
* **LOA:** Lei Orçamentária Anual (orçamento fixado e executável).
* **Reajuste:** Ajuste de valor por índice inflacionário ou reajuste contratual previamente previsto.
* **Aditamento:** Adição de novos itens, ampliação de escopo ou acréscimo de valor contratual.
* **Valores em Verde / Positivos:** Indicam expansão orçamentária نسبت à LDO.
* **Valores em Vermelho / Negativos:** Indicam realocação, economia técnica ou contingenciamento de valores.
