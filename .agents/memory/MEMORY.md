# Memory Index

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] Preserve simulated dashboards while adding selectable real imports and classification auditing → dashboard-dados-reais.md
- [banco-projetos] CRUD pré-alocação em `src/components/banco-projeto-form-dialog.tsx` e `src/components/banco-projetos-card.tsx`.
- [detalhamento-analitico] Remoção contínua pós-salvamento: itens alocados do Banco de Projetos são persistidos em `painel_loa_added_expenses` e podem ser removidos a qualquer momento, sincronizando LocalStorage e `/api/configuracoes/layout`.
- [filtros-personalizaveis] Personalização de visibilidade de filtros (ocultar/adicionar) gerenciada por `src/hooks/use-filter-visibility.ts` e `src/components/filter-customize-popover.tsx`, persistida em `/api/configuracoes/layout` e LocalStorage.
