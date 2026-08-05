import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercicioParam = searchParams.get("exercicio");
    const exercicio = exercicioParam ? parseInt(exercicioParam) : undefined;

    // 1. Verificar disponibilidade das bases
    const countLdo = await (db as any).ldoReceita.count({
      where: exercicio ? { exercicio } : {},
    });

    const countReceitaArrecadada = await (db as any).receitaArrecadada.count({
      where: exercicio ? { exercicio } : {},
    });

    const countLoaDespesas = await (db as any).budgetRecord.count();

    // LOA Receitas: podemos verificar no ArquivoImportacao ou se existe alguma tabela futura
    const countLoaReceitas = await (db as any).arquivoImportacao.count({
      where: {
        tipoImportacao: "LOA_RECEITAS",
        status: { in: ["CONCLUIDO", "CONCLUIDO_COM_ALERTAS"] },
      },
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
    const totalDespesaLoaRaw = await (db as any).budgetRecord.aggregate({
      _sum: { value: true },
    });
    const totalDespesaLoa = Number(totalDespesaLoaRaw._sum?.value || 0);

    // LDO Receitas
    const ldoRecords = await (db as any).ldoReceita.findMany({
      where: exercicio ? { exercicio } : {},
    });
    const totalReceitaLdo = ldoRecords.reduce(
      (sum: number, r: any) => sum + Number(r.valorTotalLdo || 0),
      0
    );

    // LDO por Vínculo consolidado
    const ldoPorVinculoMap: Record<string, { vinculo: string; descricao: string; totalLdo: number }> = {};
    ldoRecords.forEach((r: any) => {
      const v = r.vinculo || "SEM_VINCULO";
      if (!ldoPorVinculoMap[v]) {
        ldoPorVinculoMap[v] = { vinculo: v, descricao: r.descricaoVinculo || "Sem Descrição", totalLdo: 0 };
      }
      ldoPorVinculoMap[v].totalLdo += Number(r.valorTotalLdo || 0);
    });

    // Receita Arrecadada por Vínculo e Média Histórica / Exequível
    const arrecadadaRecords = await (db as any).receitaArrecadada.findMany({
      select: {
        vinculo: true,
        valor: true,
        exercicio: true,
      },
    });

    const arrecadadaTotal = arrecadadaRecords.reduce(
      (sum: number, r: any) => sum + Number(r.valor || 0),
      0
    );

    const exerciciosDisponiveis = [...new Set(arrecadadaRecords.map((r: any) => r.exercicio))];
    const qtdAnosArrecadacao = Math.max(1, exerciciosDisponiveis.length);

    const arrecadadaPorVinculoMap: Record<string, { totalArrecadado: number; mediaHistorica: number }> = {};
    arrecadadaRecords.forEach((r: any) => {
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
    } catch (iniciativaErr: any) {
      console.error("Erro ao consultar IniciativaEstrategica:", iniciativaErr?.message || iniciativaErr);
    }

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
        totalLoaReceitas: 0, // Inexistente ou parcial
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
  } catch (error: any) {
    console.error("Erro na API de Análises Combinadas:", error?.message || error);
    return NextResponse.json({ error: "Erro interno ao processar Análises Combinadas", details: String(error) }, { status: 500 });
  }
}
