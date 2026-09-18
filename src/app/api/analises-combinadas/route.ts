import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercicioParam = searchParams.get("exercicio");
    const exercicio = exercicioParam ? parseInt(exercicioParam) : undefined;

    // 1. Verificar disponibilidade das bases
    const countLdo = await db.ldoReceita.count({
      where: exercicio ? { exercicio } : {},
    });

    const countReceitaArrecadada = await db.receitaArrecadada.count({
      where: exercicio ? { exercicio } : {},
    });

    const countLoaDespesas = await db.budgetRecord.count();

    // LOA Receitas: consulta a base de previsão da LOA
    const countLoaReceitas = await db.loaReceita.count({
      where: exercicio ? { exercicio } : {},
    });

    const statusBases = {
      loaDespesas: {
        existe: countLoaDespesas > 0,
        count: countLoaDespesas,
        status: countLoaDespesas > 0 ? ("DISPONIVEL" as const) : ("INDISPONIVEL" as const),
      },
      ldoReceitas: {
        existe: countLdo > 0,
        count: countLdo,
        status: countLdo > 0 ? ("DISPONIVEL" as const) : ("INDISPONIVEL" as const),
      },
      loaReceitas: {
        existe: countLoaReceitas > 0,
        count: countLoaReceitas,
        status: countLoaReceitas > 0 ? ("DISPONIVEL" as const) : ("INDISPONIVEL" as const),
      },
      receitaArrecadada: {
        existe: countReceitaArrecadada > 0,
        count: countReceitaArrecadada,
        status: countReceitaArrecadada > 0 ? ("DISPONIVEL" as const) : ("INDISPONIVEL" as const),
      },
    };

    // 2. Obter totais para cálculos rápidos de fallback / resumo
    // LOA Despesas
    const totalDespesaLoaRaw = await db.budgetRecord.aggregate({
      _sum: { value: true },
    });
    const totalDespesaLoa = Number(totalDespesaLoaRaw._sum?.value || 0);

    // LDO Receitas
    const ldoRecords = await db.ldoReceita.findMany({
      where: exercicio ? { exercicio } : {},
    });
    const totalReceitaLdo = ldoRecords.reduce(
      (sum, r) => sum + Number(r.valorTotalLdo || 0),
      0
    );

    // LDO da administração indireta (o restante é da Prefeitura). "IPMO - RC" vem antes de "IPMO".
    const entidadesIndiretas = [
      { nome: "CMO", padrao: /\bCMO\b/i },
      { nome: "IPMO - RC", padrao: /IPMO\s*-\s*RC/i },
      { nome: "IPMO", padrao: /\bIPMO\b/i },
      { nome: "FITO", padrao: /\bFITO\b/i },
    ];
    const ldoEntidades = entidadesIndiretas.map(({ nome }) => ({ nome, valor: 0 }));
    ldoRecords.forEach((r) => {
      const apelido = r.apelidoNormalizado || r.apelidoOriginal || "";
      const index = entidadesIndiretas.findIndex(({ padrao }) => padrao.test(apelido));
      if (index >= 0) ldoEntidades[index].valor += Number(r.valorTotalLdo || 0);
    });
    ldoEntidades.forEach((entidade) => { entidade.valor = Math.round(entidade.valor * 100) / 100; });

    // LDO por Vínculo consolidado
    const ldoPorVinculoMap: Record<string, { vinculo: string; descricao: string; totalLdo: number }> = {};
    ldoRecords.forEach((r) => {
      const v = r.vinculo || "SEM_VINCULO";
      if (!ldoPorVinculoMap[v]) {
        ldoPorVinculoMap[v] = { vinculo: v, descricao: r.descricaoVinculo || "Sem Descrição", totalLdo: 0 };
      }
      ldoPorVinculoMap[v].totalLdo += Number(r.valorTotalLdo || 0);
    });

    // Receita Arrecadada por Vínculo e Média Histórica / Exequível
    const arrecadadaRecords = await db.receitaArrecadada.findMany({
      select: {
        vinculo: true,
        valor: true,
        exercicio: true,
      },
    });

    const arrecadadaTotal = arrecadadaRecords.reduce(
      (sum, r) => sum + Number(r.valor || 0),
      0
    );

    const exerciciosDisponiveis = [...new Set(arrecadadaRecords.map((r) => r.exercicio))];
    const qtdAnosArrecadacao = Math.max(1, exerciciosDisponiveis.length);

    const arrecadadaPorVinculoMap: Record<string, { totalArrecadado: number; mediaHistorica: number }> = {};
    arrecadadaRecords.forEach((r) => {
      const v = r.vinculo || "SEM_VINCULO";
      if (!arrecadadaPorVinculoMap[v]) {
        arrecadadaPorVinculoMap[v] = { totalArrecadado: 0, mediaHistorica: 0 };
      }
      arrecadadaPorVinculoMap[v].totalArrecadado += Number(r.valor || 0);
    });

    Object.keys(arrecadadaPorVinculoMap).forEach((v) => {
      arrecadadaPorVinculoMap[v].mediaHistorica =
        arrecadadaPorVinculoMap[v].totalArrecadado / qtdAnosArrecadacao;
    });

    // Tabela Comparativa Botão 1: Despesa LOA x Receita LDO por Vínculo
    // (Nota: Despesa LOA atual não possui coluna 'vinculo' direta na tabela BudgetRecord,
    // então a comparação por vínculo mapeia LDO por Vínculo e compara com o Total Geral ou proporção)
    const tabelaBotao1 = Object.values(ldoPorVinculoMap).map((ldoItem) => {
      const recLdo = ldoItem.totalLdo;
      // Proporção estimada se despesa não tiver vínculo explícito ou valor total
      const valDespesa = 0; // Despesa sem vínculo individual no modelo atual
      const diff = recLdo - valDespesa;
      return {
        vinculo: ldoItem.vinculo,
        descricao: ldoItem.descricao,
        valorReceita: recLdo,
        valorDespesa: valDespesa,
        diferenca: diff,
        situacao: diff >= 0 ? "Receita LDO Superior / Disponível" : "Despesa Superior",
      };
    });

    // Tabela Comparativa Botão 4: Receita Arrecadada x Receita LDO por Vínculo
    const tabelaBotao4 = Object.values(ldoPorVinculoMap).map((ldoItem) => {
      const v = ldoItem.vinculo;
      const recLdo = ldoItem.totalLdo;
      const arrInfo = arrecadadaPorVinculoMap[v];
      const mediaArr = arrInfo ? arrInfo.mediaHistorica : 0;
      const totalArr = arrInfo ? arrInfo.totalArrecadado : 0;
      const diffMedia = mediaArr - recLdo;

      let situacao = "LDO dentro da média histórica";
      if (!arrInfo) {
        situacao = "Receita sem histórico";
      } else if (recLdo > mediaArr * 1.15) {
        situacao = "LDO acima da média histórica";
      } else if (recLdo < mediaArr * 0.85) {
        situacao = "LDO abaixo da média histórica";
      }

      return {
        vinculo: v,
        descricao: ldoItem.descricao,
        valorReceita: mediaArr,
        valorDespesa: recLdo, // Usando despesa como valor da LDO para reutilização das colunas na tabela
        totalArrecadado: totalArr,
        diferenca: diffMedia,
        situacao,
      };
    });

    // Iniciativas Estratégicas
    let countIniciativas = 0;
    let totalIniciativas = 0;
    try {
      countIniciativas = await db.iniciativaEstrategica.count();
      const totalIniciativasRaw = await db.iniciativaEstrategica.aggregate({
        _sum: { valorFinalPldo27: true },
      });
      totalIniciativas = Number(totalIniciativasRaw._sum?.valorFinalPldo27 || 0);
    } catch (iniciativaErr) {
      console.error("Erro ao consultar IniciativaEstrategica:", iniciativaErr instanceof Error ? iniciativaErr.message : iniciativaErr);
    }

    const totalLoaReceitasRaw = await db.loaReceita.aggregate({
      where: exercicio ? { exercicio } : {},
      _sum: { valor: true },
    });
    const totalLoaReceitas = Number(totalLoaReceitasRaw._sum?.valor || 0);

    // Receita LOA por natureza (apelido) e fontes com valor previsto, para os cards do painel LOA
    const loaReceitaPorNatureza = await db.loaReceita.groupBy({
      by: ["naturezaReceita"],
      where: exercicio ? { exercicio } : {},
      _sum: { valor: true },
    });
    const maiorReceitaLoa = loaReceitaPorNatureza
      .map((r) => ({ natureza: r.naturezaReceita, valor: Number(r._sum.valor || 0) }))
      .sort((a, b) => b.valor - a.valor)[0] ?? null;
    const fontesLoaReceita = await db.loaReceita.findMany({
      where: { ...(exercicio ? { exercicio } : {}), valor: { not: 0 } },
      distinct: ["fonteRecurso"],
      select: { fonteRecurso: true },
    });

    return NextResponse.json({
      statusBases: {
        ...statusBases,
        iniciativasEstrategicas: {
          existe: countIniciativas > 0,
          count: countIniciativas,
          status: countIniciativas > 0 ? ("DISPONIVEL" as const) : ("INDISPONIVEL" as const),
        },
      },
      totais: {
        totalDespesaLoa,
        totalReceitaLdo,
        ldoEntidades,
        totalLoaReceitas,
        maiorReceitaLoa,
        qtdFontesLoaReceita: fontesLoaReceita.length,
        totalReceitaArrecadada: arrecadadaTotal,
        qtdAnosArrecadacao,
        totalIniciativas,
        countIniciativas,
      },
      tabelas: {
        botao1: tabelaBotao1,
        botao4: tabelaBotao4,
      },
    });
  } catch (error) {
    console.error("Erro na API de Análises Combinadas:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Erro interno ao processar Análises Combinadas", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
