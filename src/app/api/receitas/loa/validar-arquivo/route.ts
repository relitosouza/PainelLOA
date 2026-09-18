import { NextRequest, NextResponse } from "next/server";
import { parseLoaReceitaWorkbook } from "@/lib/loa-receita-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const exercicioStr = formData.get("exercicio") as string;
    const exercicio = exercicioStr ? parseInt(exercicioStr) : new Date().getFullYear() + 1;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado para validação." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsedResult = parseLoaReceitaWorkbook(buffer);

    return NextResponse.json({
      exercicio,
      nomeArquivo: file.name,
      tamanhoArquivo: file.size,
      ...parsedResult,
    });
  } catch (error) {
    console.error("Erro ao validar arquivo LOA Receitas:", error);
    return NextResponse.json({ error: "Falha ao processar e validar o arquivo enviado." }, { status: 500 });
  }
}
