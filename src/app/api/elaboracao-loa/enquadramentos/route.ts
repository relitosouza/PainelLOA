import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { validateClassification } from "@/lib/enquadramento-rules";
import { getExistingLoaExpenses, getExistingLoaTotal } from "@/lib/loa-existing-expenses";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      actionId?: string; expenseId?: string; sourceId?: string; applicationId?: string;
      value?: number; justification?: string; suggestionReason?: string; responsible?: string;
    };
    if (!body.actionId || !body.expenseId || !body.sourceId || !body.applicationId) return NextResponse.json({ message: "Preencha ação, despesa, fonte e aplicação." }, { status: 400 });
    const result = await db.$transaction(async (tx) => {
      const action = await tx.ldoAcao.findUnique({ where: { id: body.actionId }, include: { importacao: true, enquadramentos: { where: { removidoEm: null } } } });
      if (!action) throw new Error("ACTION_NOT_FOUND");
      const [expense, source, application] = await Promise.all([
        tx.codigoAuxiliar.findUnique({ where: { id: body.expenseId } }),
        tx.codigoAuxiliar.findUnique({ where: { id: body.sourceId } }),
        tx.codigoAuxiliar.findUnique({ where: { id: body.applicationId } }),
      ]);
      if (!expense || !source || !application || !expense.ativo || !source.ativo || !application.ativo) throw new Error("INVALID_CODES");
      if (!action.importacao.ativo || expense.exercicio !== action.exercicio || source.exercicio !== action.exercicio || application.exercicio !== action.exercicio) throw new Error("INVALID_EXERCISE");
      if (!["ELEMENTO_DESPESA", "SUBELEMENTO_DESPESA"].includes(expense.tipo) || source.tipo !== "FONTE_RECURSO" || application.tipo !== "CODIGO_APLICACAO") throw new Error("INVALID_TYPES");
      const enquadrado = action.enquadramentos.reduce((sum, item) => sum + Number(item.valor), 0);
      const jaDigitado = getExistingLoaTotal(getExistingLoaExpenses(), action.secretaria, action.acaoCodigo);
      const distributed = enquadrado + jaDigitado;
      const remaining = Math.max(0, Number(action.custoFinanceiro) - distributed);
      const value = Number(body.value);
      const messages = validateClassification({
        actionText: `${action.acaoCodigo} ${action.acaoNome ?? ""}`,
        product: action.produto,
        expenseCode: expense.codigo,
        sourceCode: source.codigo,
        applicationCode: application.codigo,
        value,
        remaining,
        justification: body.justification,
      });
      if (messages.some((message) => message.severity === "error")) return { validation: messages };
      const created = await tx.enquadramentoLdoLoa.create({
        data: {
          ldoAcaoId: action.id,
          despesaId: expense.id,
          fonteRecursoId: source.id,
          codigoAplicacaoId: application.id,
          valor: new Prisma.Decimal(value),
          justificativa: body.justification?.trim() || null,
          motivoSugestao: body.suggestionReason?.trim() || null,
          responsavel: body.responsible?.trim() || null,
        },
      });
      return { created: { ...created, valor: Number(created.valor) }, validation: messages };
    });
    if (!("created" in result)) return NextResponse.json({ message: "Revise as regras de enquadramento.", validation: result.validation }, { status: 422 });
    return NextResponse.json({ message: "Enquadramento salvo.", ...result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const known: Record<string, string> = {
      ACTION_NOT_FOUND: "A ação LDO não foi encontrada.", INVALID_CODES: "Um dos códigos selecionados não existe ou está inativo.",
      INVALID_EXERCISE: "Os códigos devem pertencer ao mesmo exercício da ação.", INVALID_TYPES: "A classificação selecionada não corresponde ao tipo esperado.",
    };
    if (known[code]) return NextResponse.json({ message: known[code] }, { status: 422 });
    console.error(error);
    return NextResponse.json({ message: "Não foi possível salvar o enquadramento." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ message: "Informe o vínculo." }, { status: 400 });
    await db.enquadramentoLdoLoa.update({ where: { id }, data: { removidoEm: new Date() } });
    return NextResponse.json({ message: "Enquadramento removido do planejamento e preservado no histórico." });
  } catch {
    return NextResponse.json({ message: "Não foi possível remover o enquadramento." }, { status: 500 });
  }
}
