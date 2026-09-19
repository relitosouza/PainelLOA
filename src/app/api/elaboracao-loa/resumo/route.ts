import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValorPrevistoLoaDespesa, getValorPrevistoLoaDetalhado } from "@/lib/loa-valor-previsto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exercise = Number(searchParams.get("exercise") || 2026);

    const loaRevenueImport = await db.arquivoImportacao.findFirst({
      where: {
        tipoImportacao: "LOA_RECEITAS",
        status: { in: ["CONCLUIDO", "CONCLUIDO_COM_ALERTAS"] },
        OR: [{ exercicioReferencia: exercise }, { exercicioReferencia: null }],
      },
      orderBy: { concluidoEm: "desc" },
    });

    let loaReceitaValor: number | null = loaRevenueImport ? Number(loaRevenueImport.valorTotalImportado ?? 0) : null;
    let loaReceitaArquivo: string | null = loaRevenueImport?.nomeArquivo ?? null;

    let receitaPropria = 0;
    let receitaTransferencias = 0;
    let receitaCapital = 0;

    const loaReceitasDetalhes = await db.loaReceita.findMany({
      where: {
        OR: [{ exercicio: exercise }, { exercicio: 2027 }],
      },
    });

    if (loaReceitasDetalhes.length > 0) {
      for (const r of loaReceitasDetalhes) {
        const val = Number(r.valor || 0);
        const nat = (r.naturezaReceita || "").trim();
        const natLower = nat.toLowerCase();
        if (natLower.includes("capital") || nat.startsWith("2.")) {
          receitaCapital += val;
          receitaTransferencias += val;
        } else if (
          natLower.includes("iss") ||
          natLower.includes("iptu") ||
          natLower.includes("irrf") ||
          natLower.includes("itbi") ||
          natLower.includes("taxas") ||
          natLower.includes("cosip") ||
          natLower.includes("patrimonial") ||
          natLower.includes("serviço") ||
          natLower === "1.9"
        ) {
          receitaPropria += val;
        } else {
          receitaTransferencias += val;
        }
      }
    }

    // Entidades Indiretas (IPMO, IPMO-RC, FITO) da planilha LOA 2027
    const entidadesIndiretas = [
      { codigo: "21", nome: "IPMO", valor: 590133000 },
      { codigo: "77", nome: "IPMO - RC", valor: 60640307 },
      { codigo: "22", nome: "FITO", valor: 23896825.55 },
    ];
    const totalIndiretas = entidadesIndiretas.reduce((sum, e) => sum + e.valor, 0);

    if (loaReceitaValor === null && (receitaPropria > 0 || receitaTransferencias > 0)) {
      loaReceitaValor = receitaPropria + receitaTransferencias;
      loaReceitaArquivo = "Base LoaReceita (Banco de Dados)";
    }

    const receitaTotalPrefeitura = loaReceitaValor ?? (receitaPropria + receitaTransferencias);
    const receitaTotalConsolidada = receitaTotalPrefeitura + totalIndiretas;

    const [loaDespesaProposta, despesaDetalhada] = await Promise.all([
      getValorPrevistoLoaDespesa(),
      getValorPrevistoLoaDetalhado(),
    ]);

    const resultadoProjetado = (loaDespesaProposta !== null && receitaTotalConsolidada > 0)
      ? receitaTotalConsolidada - loaDespesaProposta
      : null;

    return NextResponse.json({
      loaDespesaProposta,
      loaReceita: loaReceitaValor,
      loaReceitaArquivo,
      receitaPropria,
      receitaTransferencias,
      receitaCapital,
      entidadesIndiretas,
      totalIndiretas,
      receitaTotalPrefeitura,
      receitaTotalConsolidada,
      resultadoProjetado,
      despesaDetalhada,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível carregar o resumo da LOA." }, { status: 500 });
  }
}

