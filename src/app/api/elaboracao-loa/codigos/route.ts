import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exercise = Number(searchParams.get("exercise") || 2026);
    const type = searchParams.get("type")?.trim();
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 30)));
    const activeImport = await db.codigoAuxiliarImportacao.findFirst({ where: { exercicio: exercise, ativo: true }, orderBy: { criadoEm: "desc" } });
    if (!activeImport) return NextResponse.json({ items: [], import: null });
    const items = await db.codigoAuxiliar.findMany({
      where: {
        importacaoId: activeImport.id,
        ativo: true,
        ...(type ? { tipo: type } : {}),
        ...(search ? { OR: [{ codigo: { contains: search, mode: "insensitive" } }, { nome: { contains: search, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ codigo: "asc" }],
      take: limit,
    });
    return NextResponse.json({ items, import: activeImport });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível consultar os códigos auxiliares." }, { status: 500 });
  }
}
