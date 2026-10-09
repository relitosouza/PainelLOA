import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assegurarTabelasTransparente } from "@/lib/transparente-migrations.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assegurarTabelasTransparente();
    const body = await req.json();
    const { nome, email, bairro, area, titulo, descricao } = body;

    if (!nome?.trim() || !area?.trim() || !titulo?.trim() || !descricao?.trim()) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os campos obrigatórios (Nome, Área, Título e Descrição)." },
        { status: 400 }
      );
    }

    const sugestao = await db.transparenteSugestao.create({
      data: {
        nome: nome.trim(),
        email: email?.trim() || null,
        bairro: bairro?.trim() || null,
        area: area.trim(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        status: "PENDENTE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sua sugestão de investimento foi enviada com sucesso! Agradecemos sua participação.",
      id: sugestao.id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao registrar sugestão de investimento:", error);
    return NextResponse.json(
      { error: `Falha ao registrar sugestão: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await assegurarTabelasTransparente();
    const sugestoes = await db.transparenteSugestao.findMany({
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json({ success: true, sugestoes });
  } catch (error) {
    console.error("Erro ao listar sugestões:", error);
    return NextResponse.json({ error: "Falha ao obter sugestões." }, { status: 500 });
  }
}
