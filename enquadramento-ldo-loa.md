# Módulo de Enquadramento LDO → LOA

## Objetivo

Criar uma área independente para distribuir o custo financeiro das ações da LDO em classificações da LOA, usando as tabelas auxiliares de 2026 como catálogo válido, sem alterar a Análise LOA (subelemento), seus valores ou justificativas atuais.

## Organização da tela

```text
Secretaria / busca / status / progresso geral
├─ Área A — Catálogo LDO (aprox. 62%)
│  └─ Secretaria > Programa > Ação
│     ├─ produto, custo financeiro, distribuído e saldo
│     ├─ status: Pendente | Parcial | Concluída
│     └─ primeiras 5 ações + “Ver todas”
└─ Área B — Enquadramento LOA (aprox. 38%)
   ├─ sugestões de despesa
   ├─ busca no Anexo II
   ├─ despesa/subelemento + fonte + aplicação + valor
   ├─ alertas RN01–RN04 e justificativa condicional
   └─ salvar vínculo
```

Em telas menores, a Área B será um painel lateral aberto ao selecionar uma ação. O auditor terá uma visão de leitura da mesma tela e da matriz de rastreabilidade.

## Plano de implementação

- [x] 1. Criar no Prisma os modelos `LdoAcaoImportacao`, `LdoAcao`, `CodigoAuxiliarImportacao`, `CodigoAuxiliar` e `EnquadramentoLdoLoa`, com exercício, origem, valor, justificativa, autoria, datas e status. → Verificar: migração cria as tabelas sem modificar `BudgetRecord`, `NomenclaturaDespesa` ou dados já existentes.
- [x] 2. Criar parsers específicos para a planilha de ações LDO e para todas as abas úteis do Anexo II, preservando códigos como texto e preenchendo Secretaria/Programa nas linhas mescladas. → Verificar: testes confirmam totais, códigos com zeros e contagem por aba.
- [x] 3. Acrescentar em Importações as abas “Ações LDO” e “Tabelas Auxiliares”, com prévia, exercício, resumo por aba e confirmação não destrutiva/versionada. → Verificar: importar novamente cria nova versão e mantém LOA, edições e justificativas atuais.
- [x] 4. Criar APIs para listar ações LDO, pesquisar códigos auxiliares, obter sugestões e criar/remover enquadramentos em transação. → Verificar: consultas aceitam Secretaria, ação, status e texto; gravação rejeita código inexistente.
- [x] 5. Implementar as validações centrais compartilhadas: RN01 capital/custeio, RN02 tecnologia no elemento `3.3.90.40`, RN03 fonte e aplicação obrigatórias/válidas em 2026 e RN04 limite do custo financeiro. → Verificar: testes unitários cobrem casos válidos, alertas e bloqueios.
- [x] 6. Adicionar a rota `/elaboracao-loa` e construir o catálogo em accordions por Secretaria, Programa e Ação, com Top 5 inicial, filtros, etiquetas de status e barra de distribuição. → Verificar: seleção e expansão funcionam com volume real e mostram custo, distribuído e saldo corretos.
- [x] 7. Construir o painel “Adicionar despesa” com sugestões explicadas, busca no catálogo, fonte, aplicação, valor, feedback das regras e justificativa obrigatória para subelemento genérico. → Verificar: o usuário não salva vínculo inválido e a ação atualiza progresso/status após salvar.
- [x] 8. Criar a Matriz de Rastreabilidade com filtros e exportação PDF/Excel, exibindo LDO → enquadramentos LOA, valores, regra aplicada, justificativa e responsável. → Verificar: totais coincidem com os vínculos e a matriz permanece somente para consulta.
- [x] 9. Executar testes de parser, regras, APIs e fluxo completo; validar acessibilidade, responsividade e build de produção. → Verificar: `npm test`, testes E2E do módulo e `npm run build` concluídos com sucesso.

## Critérios de conclusão

- [x] Os ajustes da Análise LOA (subelemento) permanecem intactos.
- [x] Toda classificação salva existe na versão ativa das tabelas auxiliares de 2026.
- [x] Nenhuma ação ultrapassa o custo financeiro da LDO.
- [x] O sistema mantém histórico suficiente para auditoria interna.
- [x] QDD e geração de XML/JSON AUDESP ficam fora deste escopo.

## Decisões técnicas

- O vínculo será uma entidade própria; não será gravado diretamente em `BudgetRecord` nem no `localStorage` da análise atual.
- Sugestões começam com regras determinísticas e palavras-chave auditáveis; cada sugestão mostrará o motivo, sem depender de IA opaca.
- A exclusão de vínculos será lógica/versionada para preservar rastreabilidade.
