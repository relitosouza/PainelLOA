# Plano de Profissionalização do Painel LOA

## 1. Objetivo

Este documento organiza os próximos passos para transformar o Painel LOA em um sistema institucional mais seguro, confiável, consistente e sustentável.

O sistema já possui valor funcional: importa e analisa dados orçamentários, oferece dashboards, filtros, comparativos e recursos de elaboração. O próximo ciclo deve priorizar a consolidação dessa base antes da inclusão de novas funcionalidades.

## 2. Diagnóstico executivo

| Área | Avaliação atual | Direção desejada |
|---|---|---|
| Funcionalidade | Boa cobertura do domínio | Consolidar os fluxos existentes |
| Experiência do usuário | Completa, porém densa | Organizar por tarefas e decisões |
| Arquitetura | Funcional, mas concentrada | Separar responsabilidades |
| Persistência | Dados principais no PostgreSQL | Eliminar dependências indevidas de armazenamento local |
| Segurança | Sem controle institucional suficiente | Autenticação, perfis e autorização |
| Auditoria | Parcial | Histórico completo e imutável |
| Qualidade | Testes unitários existentes, mas controles falham | CI com lint, testes e build obrigatórios |
| Operação | Processo ainda pouco formalizado | Homologação, monitoramento e backups |

## 3. Princípio para o próximo ciclo

O próximo avanço do produto não deve ser medido pela quantidade de novos cards, campos ou relatórios. Deve ser medido pela confiança que o sistema transmite.

As prioridades são:

1. segurança;
2. integridade e rastreabilidade dos dados;
3. estabilidade;
4. clareza da experiência;
5. facilidade de manutenção;
6. operação controlada em produção.

## 4. Pontos fortes a preservar

- Cobertura relevante do domínio de LOA, LDO e receitas.
- Uso de PostgreSQL e Prisma.
- Importações processadas no servidor.
- Transações e índices em partes importantes do banco.
- Validação de planilhas antes da gravação.
- Histórico de algumas modalidades de importação.
- Testes unitários das regras de parsing e classificação.
- Dashboards, filtros e comparativos úteis para análise orçamentária.

## 5. Riscos prioritários

### 5.1 Segurança e controle de acesso

As APIs de importação, alteração e exclusão precisam ser protegidas por autenticação e autorização.

O sistema deve identificar:

- o usuário conectado;
- seu órgão ou secretaria;
- seu perfil de acesso;
- quais exercícios e registros ele pode consultar ou alterar;
- quem pode importar, revisar, aprovar, excluir e desfazer operações.

**Risco atual:** uma ação relevante pode ocorrer sem identificação e autorização suficientemente fortes.

### 5.2 Auditoria e histórico

Toda mudança orçamentária deve registrar:

- registro afetado;
- valor anterior;
- valor posterior;
- justificativa;
- usuário responsável;
- data e hora;
- origem da alteração;
- situação da aprovação;
- eventual reversão.

**Risco atual:** dificuldade para demonstrar quem alterou um dado e por qual motivo.

### 5.3 Persistência de alterações de negócio

Configurações visuais podem permanecer em estruturas JSON genéricas. Alterações orçamentárias e justificativas devem utilizar tabelas relacionais próprias.

Modelos sugeridos:

- `AlteracaoOrcamentaria`;
- `JustificativaAlteracao`;
- `HistoricoAlteracao`;
- `AprovacaoAlteracao`.

**Risco atual:** sobrescrita de objetos JSON, baixa rastreabilidade e dificuldade de consulta histórica.

### 5.4 Complexidade do frontend

O componente principal de análise concentra carregamento, cálculos, filtros, persistência, edição, tabelas e modais. Essa concentração aumenta o risco de regressões e conflitos.

Separações recomendadas:

- serviço de acesso aos dados;
- estado e regras da análise;
- filtros;
- tabela hierárquica;
- edição de despesa;
- justificativas;
- modais;
- persistência e tratamento de erros.

### 5.5 Qualidade automatizada

Na avaliação realizada:

- 19 testes unitários passaram;
- o comando geral de testes falhou por misturar testes Vitest e Playwright;
- o lint apresentou 47 erros;
- existem tratamentos de erro silenciosos e usos frequentes de tipos genéricos.

**Risco atual:** não existe uma barreira automatizada confiável antes da publicação.

### 5.6 Experiência do usuário

O sistema oferece muitas informações simultaneamente. A navegação deve ser reorganizada segundo as tarefas reais do usuário:

1. consultar;
2. analisar divergências;
3. editar;
4. justificar;
5. revisar;
6. aprovar;
7. exportar ou publicar.

**Risco atual:** telas completas tecnicamente, mas cansativas e difíceis para usuários ocasionais.

### 5.7 Operação em produção

O sistema precisa de procedimentos formais para:

- ambiente de desenvolvimento;
- ambiente de homologação;
- ambiente de produção;
- migrations versionadas;
- backup automático;
- testes periódicos de restauração;
- logs centralizados;
- monitoramento de erros;
- métricas de importação;
- publicação e rollback.

## 6. Plano de execução

### Fase 1 — Estabilização

**Objetivo:** estabelecer uma base confiável para continuar o desenvolvimento.

Entregas:

- corrigir todos os erros de lint;
- separar testes unitários e testes E2E;
- garantir que lint, testes e build sejam executados automaticamente;
- revisar os tratamentos de erro silenciosos;
- padronizar mensagens de sucesso, erro e carregamento;
- documentar o processo atual de implantação;
- criar ambiente de homologação.

Critérios de conclusão:

- lint sem erros;
- testes unitários aprovados;
- testes E2E críticos aprovados;
- build de produção aprovada;
- nenhuma publicação ocorre com pipeline vermelho.

### Fase 2 — Segurança, dados e auditoria

**Objetivo:** garantir responsabilidade e rastreabilidade institucional.

Entregas:

- implementar autenticação;
- criar perfis e permissões;
- proteger todas as rotas de escrita;
- criar tabelas próprias para alterações e justificativas;
- migrar os dados relevantes armazenados em JSON;
- registrar usuário, data, valores anterior e posterior;
- implementar histórico e reversão controlada;
- impedir alterações concorrentes silenciosas.

Critérios de conclusão:

- toda operação de escrita possui usuário identificado;
- toda alteração possui histórico consultável;
- nenhuma alteração de negócio depende de `localStorage`;
- permissões são verificadas no servidor;
- operações críticas podem ser auditadas e revertidas.

### Fase 3 — Arquitetura e manutenção

**Objetivo:** reduzir o risco e o custo de futuras mudanças.

Entregas:

- dividir componentes excessivamente grandes;
- mover regras de negócio para serviços e módulos testáveis;
- definir contratos tipados para as APIs;
- padronizar validação com esquemas no servidor;
- eliminar usos desnecessários de `any`;
- consolidar operações de importação em serviços comuns;
- documentar decisões arquiteturais relevantes.

Critérios de conclusão:

- componentes possuem responsabilidades claras;
- regras de negócio podem ser testadas sem renderizar telas;
- APIs possuem entrada e saída validadas;
- mudanças pequenas deixam de exigir edição em arquivos muito grandes.

### Fase 4 — Experiência e identidade profissional

**Objetivo:** tornar o sistema mais claro, previsível e consistente.

Entregas:

- realizar entrevistas e testes com usuários reais;
- mapear as tarefas e jornadas principais;
- simplificar telas densas;
- estabelecer um design system oficial;
- padronizar tabelas, campos, filtros, botões, badges e modais;
- melhorar estados vazios, carregamento, erro e confirmação;
- refletir filtros e abas importantes na URL;
- revisar acessibilidade por teclado, foco e leitores de tela;
- otimizar tabelas e listas extensas.

Critérios de conclusão:

- usuários conseguem executar tarefas principais sem orientação constante;
- ações destrutivas possuem confirmação ou possibilidade de desfazer;
- componentes visuais seguem padrões únicos;
- navegação por teclado cobre os fluxos críticos;
- mensagens sempre indicam problema e próximo passo.

### Fase 5 — Operação e governança

**Objetivo:** sustentar o sistema com segurança em produção.

Entregas:

- implantar logs e monitoramento de erros;
- definir indicadores de disponibilidade e desempenho;
- automatizar backups;
- testar restauração de banco;
- formalizar migrations e releases;
- manter changelog de versões;
- criar procedimento de incidente e rollback;
- definir política de retenção e acesso aos dados;
- revisar requisitos de LGPD.

Critérios de conclusão:

- erros de produção geram alertas;
- backups são verificados por restauração;
- toda versão possui changelog;
- implantação e rollback são reproduzíveis;
- responsabilidades operacionais estão documentadas.

## 7. Backlog priorizado

### Prioridade crítica

- Autenticação e autorização.
- Proteção das APIs de escrita.
- Auditoria completa de alterações.
- Persistência relacional de alterações e justificativas.
- Correção do pipeline de lint, testes e build.
- Backup e restauração do banco.

### Prioridade alta

- Separação do componente principal.
- Padronização do tratamento de erros.
- Ambiente de homologação.
- Testes E2E de importação, edição, justificativa e exclusão.
- Design system e simplificação das jornadas principais.

### Prioridade média

- Estado de filtros e abas na URL.
- Otimização de tabelas extensas.
- Auditoria completa de acessibilidade.
- Documentação técnica e funcional.
- Métricas de uso e desempenho.

### Prioridade posterior

- Novos dashboards.
- Novos cards.
- Novos campos que não sejam exigência legal ou operacional.
- Recursos avançados de personalização visual.

## 8. Indicadores de sucesso

| Indicador | Meta recomendada |
|---|---|
| Erros de lint | 0 |
| Build de produção | 100% aprovada antes de publicar |
| Testes dos fluxos críticos | 100% aprovados |
| Operações de escrita auditadas | 100% |
| APIs de escrita protegidas | 100% |
| Alterações dependentes de `localStorage` | 0 |
| Backups testados | Restauração verificada periodicamente |
| Erros silenciosos | 0 nos fluxos críticos |
| Componentes excessivamente grandes | Redução progressiva e mensurável |
| Tarefas principais validadas com usuários | Todas antes da reformulação final |

## 9. Decisões que devem ser formalizadas

Antes da implementação, registrar decisões arquiteturais sobre:

1. provedor e estratégia de autenticação;
2. modelo de perfis e permissões;
3. modelo relacional de alterações e auditoria;
4. estratégia de versionamento das importações;
5. política de substituição e desfazimento de dados;
6. ambientes e processo de implantação;
7. backups e retenção;
8. limites entre configurações visuais e dados de negócio.

## 10. Próxima ação recomendada

O próximo passo deve ser uma reunião de planejamento técnico e funcional para aprovar:

- os riscos críticos;
- a ordem das fases;
- os responsáveis;
- os critérios de aceite;
- quais novas funcionalidades ficarão temporariamente suspensas.

Após essa decisão, iniciar a Fase 1 e não avançar para novas funcionalidades enquanto lint, testes e build não estiverem estáveis.

## 11. Conclusão

O Painel LOA possui uma base de negócio promissora. O principal desafio agora é transformar essa capacidade funcional em confiança institucional.

O sistema será percebido como mais profissional quando cada ação for segura, cada mudança for rastreável, cada tela for previsível e cada publicação for validada. Esse trabalho de consolidação deve preceder a próxima expansão funcional.
