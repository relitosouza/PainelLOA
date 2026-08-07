# Detalhamento Analítico Agrupado por Ação

## Objetivo

Reduzir o trabalho de preenchimento no card **Detalhamento Analítico Editável**, exibindo o total financeiro no nível da ação e permitindo consultar os subelementos que formam esse total.

## Proposta visual

```text
▼ 2.007 — Ampliação e Manutenção de Sistemas · Elemento 3.3.90.40
  Total do grupo      LDO R$ 900.000,00   LOA [R$ 920.000,00]   ▲ R$ 20.000,00   Suplementada

    Subelemento                         LDO              LOA editável       Diferença
    Material para bens imóveis           R$ 300.000,00   R$ 310.000,00      ▲ R$ 10.000,00
    Outros serviços de tecnologia        R$ 300.000,00   R$ 305.000,00      ▲ R$ 5.000,00
    Serviços de tecnologia               R$ 300.000,00   R$ 305.000,00      ▲ R$ 5.000,00
    Distribuição conferida: R$ 920.000,00 de R$ 920.000,00

▶ 2.002 — Transporte Escolar · Elemento 3.3.90.39 · 1 subelemento
  Total do grupo      LDO R$ 400.000,00   LOA [R$ 400.000,00]   —              Sem alteração
```

- Todos os grupos começam fechados, exibindo somente o botão **+**, a ação, o elemento de despesa e o total do grupo.
- Ao clicar no **+**, o grupo muda para **−** e revela as linhas filhas dos subelementos.
- Ao clicar novamente no **−**, os subelementos são ocultados e o grupo volta ao estado compacto.
- Grupos com vários subelementos aparecem com total no topo e linhas filhas expansíveis.
- Grupos com um único subelemento permanecem compactos, sem criar uma camada desnecessária.
- O total do grupo fica claramente separado das linhas de conferência.
- A tabela continua mostrando status, diferença e indicação de alteração.

## Comportamento de edição recomendado

1. O usuário edita o **total LOA do grupo** para preencher mais rapidamente.
2. O sistema distribui automaticamente o novo total entre os subelementos, preservando a proporção original de cada um.
3. O usuário pode expandir o grupo e ajustar um subelemento individualmente.
4. Após ajustes individuais, o sistema mostra se a soma dos subelementos bate com o total do grupo.
5. Diferenças de centavos ficam no maior subelemento para garantir fechamento exato.
6. O total superior não será somado novamente: exportação, métricas, status e salvamento usarão apenas as linhas filhas.

## Plano de implementação

- [ ] Preservar cada linha original por subelemento durante a leitura da planilha, evitando que o agrupamento atual descarte a distinção entre subelementos.
- [ ] Criar uma visão derivada cujo agrupamento principal seja a junção **Ação + Elemento de Despesa**; no exemplo, `2.007 + 3.3.90.40` gera um grupo com três subelementos filhos.
- [ ] Manter Secretaria, Programa, Unidade, Vínculo e Processo como contexto de identificação para evitar juntar registros iguais de áreas diferentes; eles não alteram a regra visual do grupo.
- [ ] Substituir a tabela plana por linhas de grupo inicialmente fechadas, com botão **+** no canto; ao expandir, exibir o total no cabeçalho e os subelementos abaixo.
- [ ] Implementar edição do total com distribuição proporcional e edição manual dos subelementos.
- [ ] Adicionar validação visual de soma, status e justificativa sem duplicar valores nos cálculos existentes.
- [ ] Adaptar busca, filtros, exportação Excel/PDF e restauração para operar sobre os itens originais e apresentar os grupos corretamente.
- [ ] Validar cenários: uma ação com um subelemento, uma ação com vários subelementos, filtros ativos, edição total, ajuste manual, valores zerados e arredondamento de centavos.

## Critérios de conclusão

- O usuário consegue alterar o total de uma ação sem editar todos os subelementos.
- Os subelementos não aparecem até o usuário clicar no botão **+**.
- É possível expandir o grupo e conferir exatamente como o valor foi distribuído.
- A soma das linhas filhas sempre fecha com o total exibido.
- Os totais gerais não ficam duplicados pela presença da linha de agrupamento.
- Os dados originais podem ser restaurados e exportados sem perda de detalhamento.

## Decisão pendente

A proposta assume distribuição proporcional automática quando o total do grupo for editado. Se preferir, podemos trocar por uma regra de total superior apenas informativo, exigindo a distribuição manual nos subelementos.
