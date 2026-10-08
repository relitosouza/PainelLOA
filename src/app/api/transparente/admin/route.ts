import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTransparenteDados } from "@/lib/transparente-dados.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dados = await getTransparenteDados();
    return NextResponse.json({ success: true, ...dados });
  } catch (error) {
    console.error("Erro ao carregar dados administrativos do Orçamento Transparente:", error);
    return NextResponse.json({ error: "Falha ao obter dados do orçamento." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { config, areas, topInvestimentos } = body;

    await db.$transaction(async (tx) => {
      // 1. Atualizar Configuração Geral
      if (config) {
        await tx.transparenteConfig.upsert({
          where: { id: "default" },
          create: {
            id: "default",
            exercicio: config.exercicio || "2027",
            totalGeral: config.totalGeral ?? 0,
            totalInvestimentos: config.totalInvestimentos ?? 0,
            totalSecretarias: config.totalSecretarias ?? 0,
            tituloHero: config.tituloHero ?? null,
            subtituloHero: config.subtituloHero ?? null,
            notaInformativa: config.notaInformativa ?? null,
            atualizadoEm: new Date(),
          },
          update: {
            exercicio: config.exercicio,
            totalGeral: config.totalGeral,
            totalInvestimentos: config.totalInvestimentos,
            totalSecretarias: config.totalSecretarias,
            tituloHero: config.tituloHero,
            subtituloHero: config.subtituloHero,
            notaInformativa: config.notaInformativa,
            atualizadoEm: new Date(),
          },
        });
      }

      // 2. Atualizar Áreas Temáticas se enviadas
      if (Array.isArray(areas)) {
        await tx.transparenteArea.deleteMany();
        for (let i = 0; i < areas.length; i++) {
          const a = areas[i];
          await tx.transparenteArea.create({
            data: {
              key: a.key || `area-${i}`,
              label: a.label || "Área",
              valor: a.valor ?? 0,
              percentual: a.percentual ?? 0,
              icone: a.icone || "category",
              corTexto: a.corTexto || "text-primary",
              corFundo: a.corFundo || "bg-primary-100",
              corBarra: a.corBarra || "#3B82F6",
              destaque: Boolean(a.destaque),
              ordem: i,
              tags: Array.isArray(a.tags) ? a.tags : [],
            },
          });
        }
      }

      // 3. Atualizar Principais Investimentos se enviados
      if (Array.isArray(topInvestimentos)) {
        await tx.transparenteInvestimento.deleteMany();
        for (let i = 0; i < topInvestimentos.length; i++) {
          const inv = topInvestimentos[i];
          await tx.transparenteInvestimento.create({
            data: {
              titulo: inv.titulo || "Investimento",
              secretaria: inv.secretaria || "Geral",
              valor: inv.valor ?? 0,
              ordem: i,
              destaque: inv.destaque !== false,
            },
          });
        }
      }
    });

    const atualizado = await getTransparenteDados();
    return NextResponse.json({
      success: true,
      message: "Dados do Orçamento Transparente atualizados com sucesso.",
      dados: atualizado,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Erro detalhado ao salvar alterações do Orçamento Transparente:", error);
    return NextResponse.json(
      { error: `Falha ao salvar modificações no banco de dados: ${errorMsg}` },
      { status: 500 }
    );
  }
}
