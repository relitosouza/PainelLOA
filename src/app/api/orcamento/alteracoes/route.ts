import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { z } from "zod";

const alteracaoOrcamentariaSchema = z.object({
  dotacaoId: z.string().optional().nullable(),
  exercicio: z.number().int().default(2027),
  secretaria: z.string().min(1, "Secretaria é obrigatória"),
  codigoSecretaria: z.string().optional().nullable(),
  programa: z.string().optional().nullable(),
  acao: z.string().optional().nullable(),
  natureza: z.string().optional().nullable(),
  subelemento: z.string().optional().nullable(),
  processo: z.string().optional().nullable(),
  apelido: z.string().optional().nullable(),
  valorAnterior: z.number(),
  valorNovo: z.number(),
  justificativa: z.string().min(3, "Justificativa obrigatória (mínimo 3 caracteres)"),
  tipoAlteracao: z.string().default("AJUSTE_VALOR"),
  usuarioId: z.string().optional().nullable(),
  nomeOperador: z.string().min(2, "Nome do operador obrigatório"),
  emailOperador: z.string().email().optional().nullable(),
});

const loteAlteracoesSchema = z.object({
  nomeOperador: z.string().min(2, "Nome do operador obrigatório"),
  emailOperador: z.string().email().optional().nullable(),
  justificativaGeral: z.string().min(3, "Justificativa é obrigatória"),
  usuarioId: z.string().optional().nullable(),
  alteracoes: z.array(
    z.object({
      dotacaoId: z.string().optional().nullable(),
      exercicio: z.number().int().default(2027),
      secretaria: z.string().min(1),
      codigoSecretaria: z.string().optional().nullable(),
      programa: z.string().optional().nullable(),
      acao: z.string().optional().nullable(),
      natureza: z.string().optional().nullable(),
      subelemento: z.string().optional().nullable(),
      processo: z.string().optional().nullable(),
      apelido: z.string().optional().nullable(),
      valorAnterior: z.number(),
      valorNovo: z.number(),
      justificativa: z.string().optional().nullable(),
      tipoAlteracao: z.string().default("AJUSTE_VALOR"),
    })
  ).min(1, "Nenhuma alteração enviada"),
  exclusoes: z.array(
    z.object({
      dotacaoId: z.string(),
      exercicio: z.number().int().default(2027),
      secretaria: z.string(),
      codigoSecretaria: z.string().optional().nullable(),
      programa: z.string().optional().nullable(),
      acao: z.string().optional().nullable(),
      natureza: z.string().optional().nullable(),
      subelemento: z.string().optional().nullable(),
      processo: z.string().optional().nullable(),
      apelido: z.string().optional().nullable(),
      valorOriginal: z.number(),
      dadosOriginais: z.any().optional(),
      motivoExclusao: z.string().optional().nullable(),
    })
  ).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secretaria = searchParams.get("secretaria");
    const exercicioParam = searchParams.get("exercicio");
    const exercicio = exercicioParam ? parseInt(exercicioParam) : 2027;
    const limit = parseInt(searchParams.get("limit") || "200");

    const where: Prisma.AlteracaoOrcamentariaWhereInput = { exercicio };
    const whereExc: Prisma.ExclusaoDotacaoWhereInput = { exercicio, restaurado: false };
    if (secretaria) {
      where.OR = [
        { secretaria: { contains: secretaria, mode: "insensitive" } },
        { codigoSecretaria: secretaria },
      ];
      whereExc.OR = [
        { secretaria: { contains: secretaria, mode: "insensitive" } },
        { codigoSecretaria: secretaria },
      ];
    }

    const alteracoes = await db.alteracaoOrcamentaria.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: limit,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            secretaria: true,
          },
        },
      },
    });

    const exclusoes = await db.exclusaoDotacao.findMany({
      where: whereExc,
      orderBy: { criadoEm: "desc" },
      take: limit,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            secretaria: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      exercicio,
      totais: {
        alteracoes: alteracoes.length,
        exclusoes: exclusoes.length,
      },
      alteracoes: alteracoes.map((a) => ({
        ...a,
        id: a.id.toString(),
        valorAnterior: Number(a.valorAnterior),
        valorNovo: Number(a.valorNovo),
        diferenca: Number(a.diferenca),
      })),
      exclusoes: exclusoes.map((e) => ({
        ...e,
        id: e.id.toString(),
        valorOriginal: Number(e.valorOriginal),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar histórico orçamentário:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao buscar histórico de alterações" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Se for gravação em lote (múltiplas alterações + exclusões com 1 justificativa)
    if (body.alteracoes && Array.isArray(body.alteracoes)) {
      const parsedLote = loteAlteracoesSchema.safeParse(body);
      if (!parsedLote.success) {
        return NextResponse.json(
          { success: false, error: "Dados do lote inválidos", details: parsedLote.error.format() },
          { status: 400 }
        );
      }

      const { nomeOperador, emailOperador, justificativaGeral, usuarioId, alteracoes, exclusoes } = parsedLote.data;

      // Executar gravação em transação segura
      const result = await db.$transaction(async (tx) => {
        const registrosAlteracao = [];
        for (const item of alteracoes) {
          const diff = item.valorNovo - item.valorAnterior;
          const reg = await tx.alteracaoOrcamentaria.create({
            data: {
              dotacaoId: item.dotacaoId || null,
              exercicio: item.exercicio,
              secretaria: item.secretaria,
              codigoSecretaria: item.codigoSecretaria || item.secretaria.match(/^(\d+)/)?.[1] || null,
              programa: item.programa || null,
              acao: item.acao || null,
              natureza: item.natureza || null,
              subelemento: item.subelemento || null,
              processo: item.processo || null,
              apelido: item.apelido || null,
              valorAnterior: item.valorAnterior,
              valorNovo: item.valorNovo,
              diferenca: diff,
              justificativa: item.justificativa?.trim() || justificativaGeral,
              tipoAlteracao: item.tipoAlteracao,
              usuarioId: usuarioId || null,
              nomeOperador,
              emailOperador: emailOperador || null,
            },
          });
          registrosAlteracao.push(reg);
        }

        const registrosExclusao = [];
        if (exclusoes && exclusoes.length > 0) {
          for (const exc of exclusoes) {
            const regExc = await tx.exclusaoDotacao.create({
              data: {
                dotacaoId: exc.dotacaoId,
                exercicio: exc.exercicio,
                secretaria: exc.secretaria,
                codigoSecretaria: exc.codigoSecretaria || exc.secretaria.match(/^(\d+)/)?.[1] || null,
                programa: exc.programa || null,
                acao: exc.acao || null,
                natureza: exc.natureza || null,
                subelemento: exc.subelemento || null,
                processo: exc.processo || null,
                apelido: exc.apelido || null,
                valorOriginal: exc.valorOriginal,
                dadosOriginais: exc.dadosOriginais || null,
                motivoExclusao: exc.motivoExclusao?.trim() || justificativaGeral,
                usuarioId: usuarioId || null,
                nomeOperador,
                emailOperador: emailOperador || null,
              },
            });
            registrosExclusao.push(regExc);
          }
        }

        return { alteracoesCount: registrosAlteracao.length, exclusoesCount: registrosExclusao.length };
      });

      return NextResponse.json({
        success: true,
        message: "Alterações orçamentárias e exclusões registradas com sucesso!",
        result,
      });
    }

    // Gravação individual
    const parsedSingle = alteracaoOrcamentariaSchema.safeParse(body);
    if (!parsedSingle.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: parsedSingle.error.format() },
        { status: 400 }
      );
    }

    const item = parsedSingle.data;
    const diff = item.valorNovo - item.valorAnterior;

    const novaAlteracao = await db.alteracaoOrcamentaria.create({
      data: {
        dotacaoId: item.dotacaoId || null,
        exercicio: item.exercicio,
        secretaria: item.secretaria,
        codigoSecretaria: item.codigoSecretaria || item.secretaria.match(/^(\d+)/)?.[1] || null,
        programa: item.programa || null,
        acao: item.acao || null,
        natureza: item.natureza || null,
        subelemento: item.subelemento || null,
        processo: item.processo || null,
        apelido: item.apelido || null,
        valorAnterior: item.valorAnterior,
        valorNovo: item.valorNovo,
        diferenca: diff,
        justificativa: item.justificativa,
        tipoAlteracao: item.tipoAlteracao,
        usuarioId: item.usuarioId || null,
        nomeOperador: item.nomeOperador,
        emailOperador: item.emailOperador || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        alteracao: {
          ...novaAlteracao,
          id: novaAlteracao.id.toString(),
          valorAnterior: Number(novaAlteracao.valorAnterior),
          valorNovo: Number(novaAlteracao.valorNovo),
          diferenca: Number(novaAlteracao.diferenca),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar alteração orçamentária:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao gravar alteração orçamentária" },
      { status: 500 }
    );
  }
}
