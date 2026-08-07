import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLoaSecretariatNames } from "@/lib/loa-secretariat-names";
import { getExistingLoaExpenses, getExistingLoaTotal } from "@/lib/loa-existing-expenses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exercise = Number(searchParams.get("exercise") || 2026);
    const secretariat = searchParams.get("secretariat")?.trim();
    const search = searchParams.get("search")?.trim();
    const activeImport = await db.ldoAcaoImportacao.findFirst({ where: { exercicio: exercise, ativo: true }, orderBy: { criadoEm: "desc" } });
    if (!activeImport) return NextResponse.json({ actions: [], secretariats: [], import: null });

    const actions = await db.ldoAcao.findMany({
      where: {
        importacaoId: activeImport.id,
        ...(secretariat ? { secretaria: secretariat } : {}),
        ...(search ? { OR: [
          { secretaria: { contains: search, mode: "insensitive" } },
          { programaNome: { contains: search, mode: "insensitive" } },
          { acaoCodigo: { contains: search, mode: "insensitive" } },
          { produto: { contains: search, mode: "insensitive" } },
        ] } : {}),
      },
      include: {
        enquadramentos: {
          where: { removidoEm: null },
          include: { despesa: true, fonteRecurso: true, codigoAplicacao: true },
          orderBy: { criadoEm: "asc" },
        },
      },
      orderBy: [{ secretaria: "asc" }, { programaNome: "asc" }, { acaoCodigo: "asc" }],
    });

    const secretariatNames = getLoaSecretariatNames();
    const existingLoaExpenses = getExistingLoaExpenses();
    const catalogImport = await db.codigoAuxiliarImportacao.findFirst({ where: { exercicio: exercise, ativo: true }, orderBy: { criadoEm: "desc" } });
    const functionCodes = catalogImport ? await db.codigoAuxiliar.findMany({ where: { importacaoId: catalogImport.id, tipo: { in: ["FUNCAO_GOVERNO", "SUBFUNCAO_GOVERNO"] }, ativo: true }, select: { tipo: true, codigo: true, nome: true } }) : [];
    const normalizeLookupCode = (value: string) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    const functionNames = new Map(functionCodes.map((item) => [`${item.tipo}|${normalizeLookupCode(item.codigo)}`, item.nome]));
    const serialized = actions.map((action) => {
      const cost = Number(action.custoFinanceiro);
      const enquadrado = action.enquadramentos.reduce((sum, item) => sum + Number(item.valor), 0);
      const jaDigitado = getExistingLoaTotal(existingLoaExpenses, action.secretaria, action.acaoCodigo);
      const distributed = enquadrado + jaDigitado;
      const status = distributed <= 0 ? "PENDENTE" : distributed + 0.001 < cost ? "PARCIAL" : "CONCLUIDO";
      return {
        ...action,
        secretariaNome: secretariatNames.get(action.secretaria.replace(/\D/g, "").padStart(2, "0")) ?? action.secretaria,
        funcaoNome: action.funcaoNome || functionNames.get(`FUNCAO_GOVERNO|${normalizeLookupCode(action.funcaoCodigo ?? "")}`) || action.funcaoCodigo,
        subfuncaoNome: action.subfuncaoNome || functionNames.get(`SUBFUNCAO_GOVERNO|${normalizeLookupCode(action.subfuncaoCodigo ?? "")}`) || action.subfuncaoCodigo,
        custoFinanceiro: cost,
        metaFisica: action.metaFisica === null ? null : Number(action.metaFisica),
        valorDistribuido: distributed,
        saldo: Math.max(0, cost - distributed),
        valorJaDigitadoSemSubelemento: jaDigitado,
        status,
        enquadramentos: action.enquadramentos.map((item) => ({ ...item, valor: Number(item.valor) })),
      };
    });
    const secretariats = [...new Set(serialized.map((action) => action.secretaria))];
    return NextResponse.json({ actions: serialized, secretariats, import: activeImport });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível carregar as ações da LDO." }, { status: 500 });
  }
}
