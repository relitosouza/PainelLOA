import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get("chave") || "analise_loa_cards_layout";

    const config = await db.painelConfig.findUnique({
      where: { chave },
    });

    if (!config) {
      return NextResponse.json({ success: true, valor: null });
    }

    return NextResponse.json({ success: true, valor: config.valor });
  } catch (error) {
    console.error("Erro ao buscar configuração do painel:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar configurações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const chave = body.chave || "analise_loa_cards_layout";
    const valor = body.valor;

    if (valor === undefined) {
      return NextResponse.json(
        { success: false, error: "Valor de configuração não informado" },
        { status: 400 }
      );
    }

    const saved = await db.painelConfig.upsert({
      where: { chave },
      update: {
        valor,
      },
      create: {
        id: chave,
        chave,
        valor,
      },
    });

    return NextResponse.json({ success: true, valor: saved.valor });
  } catch (error) {
    console.error("Erro ao salvar configuração do painel:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao salvar configurações" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get("chave") || "analise_loa_cards_layout";

    await db.painelConfig.deleteMany({
      where: { chave },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao resetar configuração do painel:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao resetar configurações" },
      { status: 500 }
    );
  }
}
