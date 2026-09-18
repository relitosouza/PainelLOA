import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildNomenclaturaMap } from "@/lib/nomenclatura-map";

export async function GET() {
  try {
    const items = await db.nomenclaturaDespesa.findMany({
      select: {
        codigo: true,
        codigoFormatado: true,
        descricao: true,
      },
    });

    const mapa = buildNomenclaturaMap(items);

    return NextResponse.json({ mapa, count: items.length });
  } catch (error) {
    console.error("Erro ao buscar nomenclaturas de despesa:", error);
    return NextResponse.json({ mapa: {}, count: 0, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
