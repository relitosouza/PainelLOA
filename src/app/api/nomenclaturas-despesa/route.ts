import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.nomenclaturaDespesa.findMany({
      select: {
        codigo: true,
        codigoFormatado: true,
        descricao: true,
      },
    });

    const mapa: Record<string, string> = {};
    items.forEach((item) => {
      if (item.codigo) mapa[item.codigo] = item.descricao;
      if (item.codigoFormatado) mapa[item.codigoFormatado] = item.descricao;

      // Adiciona formato reduzido de 4 partes (ex: 3.3.90.30) se aplicável
      const parts = item.codigoFormatado.split(".");
      if (parts.length === 5) {
        const short4 = `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`;
        mapa[short4] = item.descricao;
      }
    });

    return NextResponse.json({ mapa, count: items.length });
  } catch (error) {
    console.error("Erro ao buscar nomenclaturas de despesa:", error);
    return NextResponse.json({ mapa: {}, count: 0, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
