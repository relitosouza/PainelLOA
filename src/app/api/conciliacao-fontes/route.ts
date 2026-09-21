import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Linhas cadastradas do quadro de conciliação: receita prevista, ordem e blocos.
 * A despesa não vem daqui — é somada no cliente a partir dos itens da Análise LOA,
 * para o quadro acompanhar as edições sem recarregar a página.
 */
export async function GET(req: NextRequest) {
  try {
    const exercicioParam = new URL(req.url).searchParams.get("exercicio");
    const exercicio = exercicioParam ? parseInt(exercicioParam, 10) : 2027;

    const linhas = await db.conciliacaoFonte.findMany({
      where: { exercicio },
      orderBy: [{ bloco: "asc" }, { ordem: "asc" }],
      select: { ug: true, fa: true, conf: true, receita: true, bloco: true, ordem: true },
    });

    return NextResponse.json({
      success: true,
      exercicio,
      linhas: linhas.map((l) => ({ ...l, receita: Number(l.receita) })),
    });
  } catch (error) {
    console.error("Erro ao carregar a conciliação de fontes:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
