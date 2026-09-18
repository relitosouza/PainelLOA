import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getValorPrevistoLoaDespesa } from "@/lib/loa-valor-previsto";

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

    const loaDespesaProposta = await getValorPrevistoLoaDespesa();

    return NextResponse.json({
      loaDespesaProposta,
      loaReceita: loaRevenueImport ? Number(loaRevenueImport.valorTotalImportado ?? 0) : null,
      loaReceitaArquivo: loaRevenueImport?.nomeArquivo ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível carregar o resumo da LOA." }, { status: 500 });
  }
}
