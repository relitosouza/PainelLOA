import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercicioParam = searchParams.get("exercicio");
    const exercicio = exercicioParam ? parseInt(exercicioParam) : undefined;

    const whereCondition = exercicio ? { exercicio } : {};

    let registros = await db.ldoReceita.findMany({
      where: whereCondition,
      orderBy: [{ vinculo: "asc" }, { apelidoOriginal: "asc" }],
    });

    if (registros.length === 0 && exercicio) {
      // Fallback: se não encontrou no exercício filtrado, busca os registros mais recentes cadastrados
      registros = await db.ldoReceita.findMany({
        orderBy: [{ exercicio: "desc" }, { vinculo: "asc" }],
      });
    }

    const totalPrevistoLdo = registros.reduce((acc, r) => acc + Number(r.valorTotalLdo || 0), 0);
    const totalDistribuidoLoa = registros.reduce((acc, r) => acc + Number(r.valorDistribuidoLoa || 0), 0);
    const saldoNaoDistribuido = totalPrevistoLdo - totalDistribuidoLoa;

    const vinculosSet = new Set(registros.map((r) => r.vinculo));
    const totalVinc = vinculosSet.size;

    const totalmenteDistribuido = registros.filter((r) => r.statusDistribuicao === "TOTALMENTE_DISTRIBUIDO").length;
    const parcialmenteDistribuido = registros.filter((r) => r.statusDistribuicao === "PARCIALMENTE_DISTRIBUIDO").length;
    const naoIniciado = registros.filter((r) => r.statusDistribuicao === "NAO_INICIADO").length;
    const acimaLdo = registros.filter((r) => r.statusDistribuicao === "ACIMA_LDO").length;

    // Agrupamento por vínculo para comparativo
    const vinculoMap: Record<string, { vinculo: string; descricao: string; totalLdo: number; totalLoa: number }> = {};

    registros.forEach((r) => {
      if (!vinculoMap[r.vinculo]) {
        vinculoMap[r.vinculo] = {
          vinculo: r.vinculo,
          descricao: r.descricaoVinculo,
          totalLdo: 0,
          totalLoa: 0,
        };
      }
      vinculoMap[r.vinculo].totalLdo += Number(r.valorTotalLdo || 0);
      vinculoMap[r.vinculo].totalLoa += Number(r.valorDistribuidoLoa || 0);
    });

    const vinculosComparativo = Object.values(vinculoMap);

    return NextResponse.json({
      exercicio: exercicio || (registros[0]?.exercicio ?? 2027),
      registros: registros.map((r) => ({
        ...r,
        id: r.id ? r.id.toString() : "",
        arquivoImportacaoId: r.arquivoImportacaoId ? r.arquivoImportacaoId.toString() : null,
        valorTotalLdo: Number(r.valorTotalLdo || 0),
        valorDistribuidoLoa: Number(r.valorDistribuidoLoa || 0),
        saldoDistribuir: Number(r.saldoDistribuir || 0),
      })),
      kpis: {
        totalPrevistoLdo,
        totalDistribuidoLoa,
        saldoNaoDistribuido,
        quantidadeVinculos: totalVinc,
        quantidadeRegistros: registros.length,
        totalmenteDistribuido,
        parcialmenteDistribuido,
        naoIniciado,
        acimaLdo,
      },
      vinculosComparativo,
    });
  } catch (error) {
    console.error("Erro ao carregar receitas LDO:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
