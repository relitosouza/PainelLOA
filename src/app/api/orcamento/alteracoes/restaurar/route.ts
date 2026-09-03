import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const restaurarExclusaoSchema = z.object({
  exclusaoId: z.string().or(z.number()),
  nomeOperador: z.string().optional(),
  emailOperador: z.string().email().optional().nullable(),
  justificativa: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = restaurarExclusaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos para restauração", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { exclusaoId, nomeOperador, emailOperador, justificativa } = parsed.data;
    const idBigInt = BigInt(exclusaoId);

    // Buscar o registro de exclusão
    const exclusao = await db.exclusaoDotacao.findUnique({
      where: { id: idBigInt },
    });

    if (!exclusao) {
      return NextResponse.json(
        { success: false, error: "Registro de exclusão não encontrado" },
        { status: 404 }
      );
    }

    // Executar atualização em transação
    await db.$transaction(async (tx) => {
      // 1. Marcar como restaurado
      await tx.exclusaoDotacao.update({
        where: { id: idBigInt },
        data: {
          restaurado: true,
          restauradoEm: new Date(),
        },
      });

      // 2. Registrar no log de auditoria de alterações
      await tx.alteracaoOrcamentaria.create({
        data: {
          dotacaoId: exclusao.dotacaoId,
          exercicio: exclusao.exercicio,
          secretaria: exclusao.secretaria,
          codigoSecretaria: exclusao.codigoSecretaria,
          programa: exclusao.programa,
          acao: exclusao.acao,
          natureza: exclusao.natureza,
          subelemento: exclusao.subelemento,
          processo: exclusao.processo,
          apelido: exclusao.apelido,
          valorAnterior: 0,
          valorNovo: exclusao.valorOriginal,
          diferenca: exclusao.valorOriginal,
          justificativa: justificativa || `Restauração de dotação excluída por acidente (Auditoria ID #${exclusao.id})`,
          tipoAlteracao: "RESTAURACAO_EXCLUSAO",
          nomeOperador: nomeOperador || exclusao.nomeOperador || "Operador do Sistema",
          emailOperador: emailOperador || exclusao.emailOperador || null,
        },
      });

      // 3. Remover o dotacaoId da lista de exclusões salvas em painel_loa_removed_expenses
      const configRemovidos = await tx.painelConfig.findUnique({
        where: { chave: "painel_loa_removed_expenses" },
      });

      if (configRemovidos && Array.isArray(configRemovidos.valor)) {
        const novoValor = (configRemovidos.valor as string[]).filter((id) => id !== exclusao.dotacaoId);
        await tx.painelConfig.update({
          where: { chave: "painel_loa_removed_expenses" },
          data: { valor: novoValor },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Dotação restaurada com sucesso!",
      dotacaoId: exclusao.dotacaoId,
      dadosOriginais: exclusao.dadosOriginais,
    });
  } catch (error) {
    console.error("Erro ao restaurar exclusão orçamentária:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao restaurar registro de exclusão" },
      { status: 500 }
    );
  }
}
