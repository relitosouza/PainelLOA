import { NextResponse } from "next/server";
import { sincronizarSnapshotTransparente } from "@/lib/transparente-dados.server";

export async function POST() {
  try {
    const dados = await sincronizarSnapshotTransparente();
    return NextResponse.json({
      success: true,
      message: "Snapshot do Orçamento Transparente gerado com sucesso a partir da Análise LOA.",
      dados,
    });
  } catch (error) {
    console.error("Erro ao sincronizar snapshot do Orçamento Transparente:", error);
    return NextResponse.json(
      { error: "Falha ao sincronizar dados com a LOA ativa." },
      { status: 500 }
    );
  }
}
