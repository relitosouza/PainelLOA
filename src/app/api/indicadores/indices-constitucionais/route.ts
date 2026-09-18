import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularIndicesConstitucionais } from "@/lib/indicadores-constitucionais";

// Base dos índices: impostos e transferências da LoaReceita do exercício.
export async function GET(req: NextRequest) {
  try {
    const exercicio = Number(new URL(req.url).searchParams.get("exercicio")) || 2027;
    const receitas = await db.loaReceita.findMany({
      where: { exercicio },
      select: { naturezaReceita: true, fonteRecurso: true, valor: true },
    });
    const indices = calcularIndicesConstitucionais(receitas.map((r) => ({ ...r, valor: Number(r.valor) })));
    return NextResponse.json({ exercicio, possuiReceita: receitas.length > 0, ...indices });
  } catch (error) {
    console.error("Erro ao calcular índices constitucionais:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Erro ao calcular os índices constitucionais" }, { status: 500 });
  }
}
