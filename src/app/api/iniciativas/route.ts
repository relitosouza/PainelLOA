import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secretaria = searchParams.get("secretaria");
    const acao = searchParams.get("acao");
    const despesa = searchParams.get("despesa");
    const vinculo = searchParams.get("vinculo");
    const programa = searchParams.get("programa");
    const funcao = searchParams.get("funcao");
    const subfuncao = searchParams.get("subfuncao");
    const unidade = searchParams.get("unidade");
    const search = searchParams.get("search");

    const where: Prisma.IniciativaEstrategicaWhereInput = {};

    if (secretaria) {
      const secCodeMatch = secretaria.trim().match(/^\d+/);
      if (secCodeMatch) {
        where.secretaria = { startsWith: secCodeMatch[0] };
      } else {
        where.secretaria = { contains: secretaria.trim(), mode: "insensitive" };
      }
    }

    if (programa) {
      const progMatch = programa.trim().match(/\d+/);
      const cleanProg = progMatch ? progMatch[0] : programa.trim();
      where.programa = { contains: cleanProg, mode: "insensitive" };
    }

    if (funcao) {
      where.funcao = { contains: funcao.trim(), mode: "insensitive" };
    }

    if (subfuncao) {
      where.subfuncao = { contains: subfuncao.trim(), mode: "insensitive" };
    }

    if (unidade) {
      where.unidade = { contains: unidade.trim(), mode: "insensitive" };
    }

    if (acao) {
      const acaoMatch = acao.trim().match(/\d+(\.\d+)*/);
      const cleanAcao = acaoMatch ? acaoMatch[0] : acao.trim();
      where.acao = { contains: cleanAcao, mode: "insensitive" };
    }

    if (despesa) {
      const despesaMatch = despesa.trim().match(/\d+(\.\d+)*/);
      const cleanDespesa = despesaMatch ? despesaMatch[0] : despesa.trim();
      where.despesa = { contains: cleanDespesa, mode: "insensitive" };
    }

    if (vinculo) {
      const vinculoMatch = vinculo.trim().match(/\d+(\.\d+)*/);
      const cleanVinculo = vinculoMatch ? vinculoMatch[0] : vinculo.trim();
      where.vinculo = { contains: cleanVinculo, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { dsIniciativa: { contains: search, mode: "insensitive" } },
        { programaticaLdo: { contains: search, mode: "insensitive" } },
        { secretaria: { contains: search, mode: "insensitive" } },
        { programa: { contains: search, mode: "insensitive" } },
        { acao: { contains: search, mode: "insensitive" } },
        { vinculo: { contains: search, mode: "insensitive" } },
        { despesa: { contains: search, mode: "insensitive" } },
      ];
    }

    const iniciativas = await db.iniciativaEstrategica.findMany({
      where,
      orderBy: { valorFinalPldo27: "desc" },
      take: 500,
    });

    const formattedIniciativas = iniciativas.map((item) => ({
      ...item,
      id: item.id.toString(),
      valorFinalPldo27: Number(item.valorFinalPldo27),
    }));

    const totalValorRaw = await db.iniciativaEstrategica.aggregate({
      where,
      _sum: { valorFinalPldo27: true },
    });

    return NextResponse.json({
      iniciativas: formattedIniciativas,
      totalCount: formattedIniciativas.length,
      totalValor: Number(totalValorRaw._sum?.valorFinalPldo27 || 0),
    });
  } catch (error) {
    console.error("Erro ao buscar iniciativas estratégicas:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erro ao buscar iniciativas estratégicas", details: message },
      { status: 500 }
    );
  }
}
