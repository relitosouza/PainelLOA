import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreExpenseSuggestion } from "@/lib/enquadramento-rules";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const actionId = searchParams.get("actionId");
    if (!actionId) return NextResponse.json({ message: "Informe a ação LDO." }, { status: 400 });
    const action = await db.ldoAcao.findUnique({ where: { id: actionId }, include: { importacao: true } });
    if (!action) return NextResponse.json({ message: "Ação LDO não encontrada." }, { status: 404 });
    const catalogImport = await db.codigoAuxiliarImportacao.findFirst({ where: { exercicio: action.exercicio, ativo: true }, orderBy: { criadoEm: "desc" } });
    if (!catalogImport) return NextResponse.json({ suggestions: [] });
    const expenses = await db.codigoAuxiliar.findMany({
      where: { importacaoId: catalogImport.id, tipo: { in: ["ELEMENTO_DESPESA", "SUBELEMENTO_DESPESA"] }, ativo: true },
      take: 2500,
    });
    const actionText = `${action.acaoCodigo} ${action.acaoNome ?? ""}`;
    const suggestions = expenses
      .map((expense) => ({ ...expense, ...scoreExpenseSuggestion({ actionText, product: action.produto, code: expense.codigo, name: expense.nome }) }))
      .filter((expense) => expense.score > 0)
      .sort((left, right) => right.score - left.score || left.codigo.localeCompare(right.codigo))
      .slice(0, 8);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível gerar sugestões." }, { status: 500 });
  }
}
