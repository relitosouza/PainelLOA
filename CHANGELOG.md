# 📝 Changelog Oficial — Painel LOA
Todas as alterações notáveis deste projeto são documentadas neste arquivo, seguindo o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.2.0] - 2026-08-21 (Conclusão do Plano de Profissionalização)

### ✨ Adicionado
- **Fase 1 (Segurança & Autenticação)**:
  - Sistema de permissões e controle de acesso com RBAC.
  - Endpoints protegidos para criação, edição e exclusão de usuários com isolamento do `01 - CMO`.
- **Fase 2 (Auditoria & Persistência Relacional)**:
  - Histórico de auditoria orçamentária para acréscimos, reduções, inclusões e exclusões de dotações.
  - Suporte a justificativas técnicas por dotação.
- **Fase 3 (Modularização & Arquitetura)**:
  - Extração de subcomponentes modulares (`AnaliseLoaReceitaKpis`, `AnaliseLoaDespesaKpis`, `AnaliseLoaAdvancedFilters`).
  - Camada de serviço desacoplada `budget-calculation-service.ts` e suíte de testes unitários com 100% de aprovação.
- **Fase 4 (Experiência, Identidade & Design System)**:
  - Design System com componentes padronizados (`Button`, `Badge`, `EmptyState`, `Skeleton`).
  - Grids de skeletons para feedback suave de carregamento.
  - Edição direta de *Valor Reajuste* e *Valor Aditamento* nos 3 níveis da grade analítica (Ação, Natureza e Subelemento).
  - Teto oficial da expectativa LOA calibrado para **R$ 6.510.880.526,06** e LDO Receita para **R$ 5.868.871.609,90**.
- **Fase 5 (Operação & Governança)**:
  - Scripts de backup (`scripts/backup-db.sh`), restauração (`scripts/restore-db.sh`) e pré-voo (`scripts/pre-flight-release.sh`).
  - Política de retenção de dados e documentação operacional de contingência.

---

## [1.1.0] - 2026-08-20
- Criação da tela de gestão de usuários no painel de configurações.
- Sincronização e cruzamento analítico entre a base LDO e LOA 2027.
