import { NextResponse } from "next/server";
import { getTransparenteResumo } from "@/lib/transparente-resumo.server";

export async function GET() {
  try {
    const resumo = await getTransparenteResumo();
    return NextResponse.json({ success: true, ...resumo });
  } catch (error) {
    console.error("Erro ao gerar o resumo do Orçamento Transparente:", error);
    return NextResponse.json({ error: "Falha ao gerar o resumo do orçamento." }, { status: 500 });
  }
}
