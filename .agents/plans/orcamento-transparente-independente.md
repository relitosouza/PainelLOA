# Plano de Implementação: Desacoplamento e Gestão Própria do Orçamento Transparente

## 1. Visão Geral
Tornar o módulo **Orçamento Transparente** (`/transparente`) independente das demais fases analíticas do sistema (LOA, LDO, Ajustes SF, Corte GP). Ele terá sua própria persistência no banco de dados com capacidade de:
- Tirar um snapshot inicial automático a partir do estado atual da LOA.
- Funcionar com dados desacoplados (não sofre alterações quando a planilha LOA é atualizada ou alterada).
- Permitir edição, inclusão e exclusão manual de dados através de uma interface administrativa dedicada (`/transparente/admin`).
- Permitir, caso desejado pelo operador, re-sincronizar snapshot a qualquer momento.

---

## 2. Modelagem de Dados no Prisma (`prisma/schema.prisma`)
Criar modelos dedicados:
1. `TransparenteConfig`:
   - `id` (String / "default")
   - `exercicio` (ex: "2027")
   - `totalGeral` (Decimal)
   - `totalInvestimentos` (Decimal)
   - `totalSecretarias` (Int)
   - `tituloHero` (String)
   - `subtituloHero` (String)
   - `notaInformativa` (String)
   - `atualizadoEm` (DateTime)
2. `TransparenteArea`:
   - `id` (String)
   - `key` (String, unique)
   - `label` (String)
   - `valor` (Decimal)
   - `percentual` (Decimal)
   - `icone` (String)
   - `corTexto` (String)
   - `corFundo` (String)
   - `corBarra` (String)
   - `destaque` (Boolean)
   - `ordem` (Int)
   - `tags` (Json)
3. `TransparenteInvestimento`:
   - `id` (String)
   - `titulo` (String)
   - `secretaria` (String)
   - `valor` (Decimal)
   - `ordem` (Int)
   - `destaque` (Boolean)
4. `TransparenteSecretaria`:
   - `id` (String)
   - `codigo` (String, unique)
   - `nome` (String)
   - `valor` (Decimal)
   - `percentual` (Decimal)

---

## 3. Serviços e APIs
1. `src/lib/transparente-dados.server.ts`:
   - Leitura dos dados desacoplados.
   - Fallback e geração de snapshot a partir de `loadAnaliseLoaItems()`.
2. `src/app/api/transparente/resumo/route.ts`:
   - Adaptada para ler a fonte independente.
3. `src/app/api/transparente/admin/route.ts`:
   - `GET`: Retorna todas as configurações, áreas, investimentos e secretarias para edição.
   - `PUT`/`POST`: Atualiza configurações, áreas e investimentos.
4. `src/app/api/transparente/snapshot/route.ts`:
   - `POST`: Executa snapshot forçado (re-importação dos totais e investimentos da Análise LOA).

---

## 4. Frontend & Interface
1. `/transparente`:
   - Mantém o design visual com leitura rápida dos dados desacoplados.
   - Adicionar botão discreto para gestão (`/transparente/admin`).
2. `/transparente/admin`:
   - Tela com abas/cards modernos para gerenciamento:
     - **Visão Geral & Totais**: editar ano do exercício, valores consolidados, textos informativos.
     - **Áreas Temáticas**: editar/adicionar áreas, valores, cores, tags e marcar se entra no destaque dos "R$ 100".
     - **Maiores Investimentos**: CRUD de projetos de investimento para o ranking público.
     - **Snapshot & Sincronização**: botão para capturar ou resetar a partir da LOA ativa com confirmação.

---

## 5. Testes e Validação
- Validar Prisma migrate/push.
- Testar endpoints via scripts/testes automatizados.
- Rodar `npm run build` e validar fluxo.
