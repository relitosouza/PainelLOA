# 🔐 Catálogo Oficial de Perfis, Usuários e Credenciais de Acesso
**Sistema:** Painel LOA - Portal de Gestão Orçamentária e Análise da LOA  
**Município:** Prefeitura Municipal de Osasco  
**Exercício de Referência:** LOA 2027  
**Data de Atualização:** 24 de Agosto de 2026  

---

## 🌐 1. Informações de Acesso ao Sistema

* **URL da Tela de Login:** `http://localhost:3000/login` (ou na porta ativa, ex: `:3001/login`)
* **URL Principal do Painel:** `http://localhost:3000/`
* **Painel Administrativo & Gestão de Usuários:** `http://localhost:3000/configuracoes`
* **Comando para Restaurar/Atualizar Usuários Padrão no Banco:**
  ```bash
  npm run db:seed:usuarios
  ```

---

## 👥 2. Tabela Geral de Credenciais (E-mails e Senhas)

| Perfil / Papel | Nome Completo | E-mail Institucional (Login) | Senha de Acesso | Secretaria / Órgão Vinculado | Cargo / Função |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 👑 **ADMIN** | Administrador do Sistema | `admin@osasco.sp.gov.br` | `Admin@Osasco2027` | *Acesso Geral (Todas)* | Administrador Geral do Sistema |
| 📊 **PLANEJAMENTO** | Alex - Planejamento LOA | `alex.sf@osasco.sp.gov.br` | `Plan@Osasco2027` | 04 - SECRETARIA DE FINANÇAS | Diretor de Planejamento Orçamentário |
| 📊 **PLANEJAMENTO** | Equipe Central de Planejamento | `planejamento@osasco.sp.gov.br` | `Plan@Osasco2027` | 24 - SECRETARIA DE PLANEJAMENTO E GESTÃO | Analista de Planejamento e Orçamento |
| 🏥 **TECNICO_SECRETARIA** | Técnico Setorial - Saúde | `tecnico.saude@osasco.sp.gov.br` | `Saude@Osasco2027` | 09 - SECRETARIA DA SAÚDE | Analista Orçamentário da Saúde |
| 🎓 **TECNICO_SECRETARIA** | Técnico Setorial - Educação | `tecnico.educacao@osasco.sp.gov.br` | `Educacao@Osasco2027` | 08 - SECRETARIA DE EDUCAÇÃO | Analista Orçamentário da Educação |
| 🏗️ **TECNICO_SECRETARIA** | Técnico Setorial - Obras e Serviços | `tecnico.obras@osasco.sp.gov.br` | `Obras@Osasco2027` | 11 - SECRETARIA DE SERVIÇOS E OBRAS | Analista de Gestão de Obras |
| 🤝 **TECNICO_SECRETARIA** | Técnico Setorial - Assistência Social | `tecnico.social@osasco.sp.gov.br` | `Social@Osasco2027` | 14 - SECRETARIA DE ASSISTÊNCIA SOCIAL | Analista de Projetos Sociais |
| 🛡️ **TECNICO_SECRETARIA** | Técnico Setorial - Segurança Urbana | `tecnico.seguranca@osasco.sp.gov.br` | `Seguranca@Osasco2027` | 20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO | Analista de Segurança Pública |
| 🚌 **TECNICO_SECRETARIA** | Técnico Setorial - Transporte e Mobilidade | `tecnico.transporte@osasco.sp.gov.br` | `Transporte@Osasco2027` | 19 - SECRETARIA DE TRANSPORTE E MOBILIDADE | Analista de Mobilidade Urbana |
| 🏠 **TECNICO_SECRETARIA** | Técnico Setorial - Habitação | `tecnico.habitacao@osasco.sp.gov.br` | `Habitacao@Osasco2027` | 13 - SECRETARIA DE HABITAÇÃO | Analista de Programas Habitacionais |
| 🌳 **TECNICO_SECRETARIA** | Técnico Setorial - Meio Ambiente | `tecnico.meioambiente@osasco.sp.gov.br` | `Ambiente@Osasco2027` | 17 - SECRETARIA DE MEIO AMBIENTE E REC. HÍDRICOS | Analista Ambiental |
| 🔍 **LEITURA** | Auditoria Interna / CGM | `auditoria@osasco.sp.gov.br` | `Consulta@Osasco2027` | 27 - CONTROLADORIA GERAL DO MUNICÍPIO | Auditor de Controle Interno |
| 👁️ **LEITURA** | Consulta Geral - Transparência | `transparencia@osasco.sp.gov.br` | `Leitura@Osasco2027` | 02 - GABINETE DO PREFEITO | Consultor de Transparência Pública |

---

## 🛡️ 3. Níveis de Permissão e Papéis do Sistema

### 1. 👑 Administrador Geral (`ADMIN`)
* **Escopo:** Acesso irrestrito a todas as funcionalidades e dados de todas as secretarias.
* **Permissões:**
  * Gestão de usuários (criar, editar, ativar/inativar contas e definir senhas).
  * Personalização do layout, menu e identidade visual.
  * Execução de backups e restaurações críticas do banco de dados.
  * Edição analítica de dotações e exclusão de dotações com registro de auditoria.

### 2. 📊 Equipe de Planejamento Central (`PLANEJAMENTO`)
* **Escopo:** Secretaria de Finanças e Secretaria de Planejamento e Gestão.
* **Permissões:**
  * Elaboração e consolidação da LOA Municipal.
  * Análise analítica e remanejamento orçamentário entre secretarias.
  * Importação e conferência de planilhas orçamentárias (LDO e LOA).
  * Visualização de dashboards executivos e relatórios consolidados.

### 3. 🏢 Técnicos Setoriais (`TECNICO_SECRETARIA`)
* **Escopo:** Vinculado estritamente à sua respectiva Secretaria / Pasta.
* **Permissões:**
  * Visualização e edição das dotações e subelementos da sua secretaria.
  * Inserção de justificativas para alterações e propostas orçamentárias setoriais.
  * Acompanhamento de metas e iniciativas da sua pasta.

### 4. 👁️ Apenas Consulta / Auditoria (`LEITURA`)
* **Escopo:** Controladoria Geral, Gabinete e Órgãos de Controle.
* **Permissões:**
  * Consulta e navegação em todos os relatórios, gráficos e painéis da LOA.
  * Acesso ao histórico de auditoria orçamentária para fiscalização.
  * Sem permissão para realizar alterações de valores ou exclusões de dotações.

---

## 🔒 4. Senhas Especiais de Segurança para Infraestrutura

| Finalidade | Onde é Utilizada | Senha | Configurada em |
| :--- | :--- | :--- | :--- |
| **Restauração Crítica de Snapshot do Banco de Dados** | Na aba de Restauração em `/configuracoes` | `Admin@LOA2027#Osasco` | Variável `RESTORE_SECURITY_PASSWORD` no arquivo `.env` |

---

## 💡 5. Como Adicionar ou Alterar Usuários

1. Acesse o menu **Configurações** (`/configuracoes`) logado como Administrador.
2. Na seção **Gestão de Usuários & Secretarias**, clique em **"+ Novo Usuário"** ou no botão de edição de um usuário existente.
3. Para reinicializar a base com as credenciais padrão deste documento, execute no terminal:
   ```bash
   npm run db:seed:usuarios
   ```
