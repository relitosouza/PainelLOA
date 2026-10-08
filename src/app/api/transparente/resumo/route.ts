import { NextResponse } from "next/server";
import { getTransparenteDados } from "@/lib/transparente-dados.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resumo = await getTransparenteDados();
    return NextResponse.json({ success: true, ...resumo });
  } catch (error) {
    console.error("Erro ao gerar o resumo do Orçamento Transparente:", error);
    return NextResponse.json({ error: "Falha ao gerar o resumo do orçamento." }, { status: 500 });
  }
}
