# Memory Index

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] Preserve simulated dashboards while adding selectable real imports and classification auditing → dashboard-dados-reais.md
- [banco-projetos] CRUD pré-alocação em `src/components/banco-projeto-form-dialog.tsx` e `src/components/banco-projetos-card.tsx`.
- [detalhamento-analitico] Remoção contínua pós-salvamento: itens alocados do Banco de Projetos são persistidos em `painel_loa_added_expenses` e podem ser removidos a qualquer momento, sincronizando LocalStorage e `/api/configuracoes/layout`.
- [filtros-personalizaveis] Personalização de visibilidade de filtros (ocultar/adicionar) gerenciada por `src/hooks/use-filter-visibility.ts` e `src/components/filter-customize-popover.tsx`, persistida em `/api/configuracoes/layout` e LocalStorage.
- [snapshots-diarios] Proposta de fotografias diárias e comparativo D-1 vs D0 documentada em `docs/proposta-snapshots-diarios.md`.
- [relatorio-loa] Exclusão de vínculos curtos 00.00 (5 dígitos) no relatório impresso/PDF, com exceção e segregação em seção dedicada para Banco de Projetos Alocados (`src/components/analise-loa-view.tsx` e `src/lib/loa-report-template.ts`).
