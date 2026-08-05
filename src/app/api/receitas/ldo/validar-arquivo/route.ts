import { NextRequest, NextResponse } from "next/server";
import { parseLdoWorkbook } from "@/lib/ldo-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const exercicioStr = formData.get("exercicio") as string;
    const exercicio = exercicioStr ? parseInt(exercicioStr) : new Date().getFullYear() + 1;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsedResult = parseLdoWorkbook(buffer);

    return NextResponse.json({
      exercicio,
      nomeArquivo: file.name,
      ...parsedResult,
    });
  } catch (error) {
    console.error("Erro ao validar arquivo LDO:", error);
    return NextResponse.json({ error: "Falha ao processar arquivo" }, { status: 500 });
  }
}
