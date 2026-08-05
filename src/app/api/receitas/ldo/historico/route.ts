import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercicioParam = searchParams.get("exercicio");
    const exercicio = exercicioParam ? parseInt(exercicioParam) : new Date().getFullYear() + 1;

    const historico = await db.arquivoImportacao.findMany({
      where: {
        tipoImportacao: "LDO_RECEITAS",
        ...(exercicio ? { exercicioReferencia: exercicio } : {}),
      },
      orderBy: { iniciadoEm: "desc" },
    });

    return NextResponse.json(
      historico.map((h) => ({
        id: h.id.toString(),
        nomeArquivo: h.nomeArquivo,
        exercicio: h.exercicioReferencia,
        quantidadeLinhas: h.quantidadeLinhas,
        registrosImportados: h.registrosImportados,
        registrosIgnorados: h.registrosIgnorados,
        valorTotalImportado: Number(h.valorTotalImportado || 0),
        status: h.status,
        usuarioResponsavel: h.usuarioResponsavel,
        iniciadoEm: h.iniciadoEm,
        concluidoEm: h.concluidoEm,
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar histórico de importações LDO:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}
