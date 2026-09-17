import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSecretariatDemoRecords } from "@/lib/secretariat-data";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";

export interface ComparativoSecretariaItem {
  id: string;
  secretaria: string;
  valLoaVigente: number;
  valorReajuste: number;
  valorAditamento: number;
  valLoaProposta: number;
  valLdo: number;
  diferenca: number;
  percentual: number;
  situacao: "SUPERAVIT" | "DEFICIT" | "EQUILIBRIO";
}

function getSecretariatCode(name: string): string | null {
  const match = name.match(/^(\d+)/);
  return match ? match[1].padStart(2, "0") : null;
}

async function getLdoMapFromAnaliseFile(): Promise<Map<string, number>> {
  const file = await readFile(path.join(process.cwd(), "public", "loa_new.xlsx"));
  const workbook = XLSX.read(file, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const headers = (rows[0] ?? []).map((value) => String(value ?? "").toLowerCase().trim());
  const findColumn = (...aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
  const pieceColumn = findColumn("peça orçamentária", "peca orcamentaria", "peça", "peca");
  const secretariatColumn = findColumn("secretaria", "orgao", "órgão", "secretaria_nome");
  const valueColumn = findColumn("valor", "val_loa", "valor loa", "valor_loa");
  if (pieceColumn < 0 || secretariatColumn < 0 || valueColumn < 0) return new Map();

  const totals = new Map<string, number>();
  for (const row of rows.slice(1)) {
    if (!row || String(row[pieceColumn] ?? "").trim().toUpperCase() !== "LDO") continue;
    const secretariat = String(row[secretariatColumn] ?? "").trim();
    const code = getSecretariatCode(secretariat) || secretariat;
    if (!code) continue;
    // A planilha pode trazer casas residuais de cálculos do Excel. Cada
    // dotação é monetária, portanto consolida-se o valor já arredondado a
    // centavos para manter a mesma referência exibida na Análise LOA.
    const value = Math.round(((Number(row[valueColumn]) || 0) + Number.EPSILON) * 100) / 100;
    totals.set(code, (totals.get(code) || 0) + value);
  }
  return totals;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercise = Number(searchParams.get("exercise") || 2027);
    const importIdParam = searchParams.get("importId");

    // 1. Identificar importação ativa de LOA
    let activeLoa = null;
    if (importIdParam) {
      activeLoa = await db.loaImport.findUnique({
        where: { id: importIdParam },
      });
    }
    if (!activeLoa) {
      activeLoa = await db.loaImport.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    // Consultar registros originais da LOA para a importação ativa. Quando a
    // Análise LOA foi salva, o mapa de edições passa a ser a fonte consolidada:
    // ele já inclui inclusões, exclusões e redistribuições de subelementos.
    let loaByOrgan: Array<{ organ: string; _sum: { value: number | null } }> = activeLoa
      ? (await db.budgetRecord.groupBy({
          by: ["organ"],
          where: { importId: activeLoa.id },
          _sum: { value: true },
        })).map((row) => ({ organ: row.organ, _sum: { value: Number(row._sum.value || 0) } }))
      : [];

    const customEditsConfig = await db.painelConfig.findUnique({
      where: { chave: "painel_loa_custom_edits" },
    });
    const addedExpensesConfig = await db.painelConfig.findUnique({
      where: { chave: "painel_loa_added_expenses" },
    });

    if (customEditsConfig?.valor && typeof customEditsConfig.valor === "object") {
      const customValues = customEditsConfig.valor as Record<string, number>;
      const addedById = new Map<string, { secretaria?: string }>();
      if (Array.isArray(addedExpensesConfig?.valor)) {
        for (const item of addedExpensesConfig.valor) {
          if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
            addedById.set(item.id, item as { secretaria?: string });
          }
        }
      }

      const totalsByOrgan = new Map<string, number>();
      for (const [id, value] of Object.entries(customValues)) {
        const addedItem = addedById.get(id);
        const organ = addedItem?.secretaria || id.split("|")[0];
        if (!organ || !id.includes("|") && !addedItem) continue;
        totalsByOrgan.set(organ, (totalsByOrgan.get(organ) || 0) + (Number(value) || 0));
      }

      if (totalsByOrgan.size > 0) {
        loaByOrgan = [...totalsByOrgan.entries()].map(([organ, value]) => ({
          organ,
          _sum: { value },
        }));
      }
    }

    const hasRealLoa = loaByOrgan.length > 0;

    // 2. Consultar ações LDO ativas da importação oficial vigente
    const ldoImport = await db.ldoAcaoImportacao.findFirst({
      where: { ativo: true },
      orderBy: { criadoEm: "desc" },
      include: { acoes: true },
    });

    let ldoMap = new Map<string, number>();
    try {
      ldoMap = await getLdoMapFromAnaliseFile();
    } catch (error) {
      console.warn("Não foi possível ler a base LDO da Análise LOA; usando a importação LDO:", error);
    }
    if (ldoMap.size === 0 && ldoImport?.acoes) {
      for (const acao of ldoImport.acoes) {
        const code = getSecretariatCode(acao.secretaria) || acao.secretaria.trim();
        const current = ldoMap.get(code) || 0;
        ldoMap.set(code, current + Number(acao.custoFinanceiro || 0));
      }
    }

    // 3. Consultar reajustes e aditamentos persistidos
    const reajusteMap = new Map<string, number>();
    const aditamentoMap = new Map<string, number>();
    try {
      // Mapear dotacaoId -> código de secretaria usando alteracaoOrcamentaria e subelementoCustomizado
      const dotacaoToSec = new Map<string, string>();

      const alts = await db.alteracaoOrcamentaria.findMany({
        select: { dotacaoId: true, codigoSecretaria: true, secretaria: true },
      });
      for (const a of alts) {
        if (a.dotacaoId && (a.codigoSecretaria || a.secretaria)) {
          const code = getSecretariatCode(a.codigoSecretaria || a.secretaria);
          if (code) dotacaoToSec.set(a.dotacaoId, code);
        }
      }

      const subs = await db.subelementoCustomizado.findMany({
        select: { id: true, secretaria: true },
      });
      for (const s of subs) {
        if (s.id && s.secretaria) {
          const code = getSecretariatCode(s.secretaria);
          if (code) dotacaoToSec.set(s.id, code);
        }
      }

      // Complementar com config de reajustes e aditamentos da Análise LOA
      const configReajustes = await db.painelConfig.findUnique({
        where: { chave: "painel_loa_reajustes_aditamentos" },
      });
      if (configReajustes?.valor && typeof configReajustes.valor === "object") {
        const valMap = configReajustes.valor as Record<string, { valorReajuste?: number; valorAditamento?: number }>;
        for (const [id, vals] of Object.entries(valMap)) {
          const secCode = dotacaoToSec.get(id);
          const reajuste = Number(vals.valorReajuste) || 0;
          const aditamento = Number(vals.valorAditamento) || 0;
          if (secCode && reajuste) {
            reajusteMap.set(secCode, (reajusteMap.get(secCode) || 0) + reajuste);
          }
          if (secCode && aditamento) {
            aditamentoMap.set(secCode, (aditamentoMap.get(secCode) || 0) + aditamento);
          }
        }
      }
    } catch (e) {
      console.warn("Aviso: falha ao agregar reajustes:", e);
    }

    const items: ComparativoSecretariaItem[] = [];

    if (hasRealLoa) {
      // Calcular totais por código de órgão no LOA para rateio proporcional de LDO/Reajuste compartilhado (ex: órgão 18)
      const loaTotalsByCode = new Map<string, number>();
      for (const row of loaByOrgan) {
        const rawName = row.organ || "Não Identificado";
        const code = getSecretariatCode(rawName) || rawName;
        const val = Number(row._sum.value || 0);
        loaTotalsByCode.set(code, (loaTotalsByCode.get(code) || 0) + val);
      }

      for (const row of loaByOrgan) {
        const rawName = row.organ || "Não Identificado";
        const code = getSecretariatCode(rawName) || rawName;
        const valLoaVigente = Number(Number(row._sum.value || 0).toFixed(2));

        const totalLoaForCode = loaTotalsByCode.get(code) || valLoaVigente;
        const share = totalLoaForCode > 0 ? valLoaVigente / totalLoaForCode : 1;

        // Ratear reajuste proporcionalmente ao peso do órgão dentro do mesmo código
        const rawReajusteForCode = reajusteMap.get(code) || 0;
        const valorReajuste = Number((rawReajusteForCode * share).toFixed(2));
        const valorAditamento = Number(((aditamentoMap.get(code) || 0) * share).toFixed(2));

        const valLoaProposta = Number((valLoaVigente + valorReajuste + valorAditamento).toFixed(2));

        // Obter valor LDO mapeado pelo código do órgão (rateado se houver múltiplos órgãos com mesmo código, como 18)
        const fullLdoForCode = ldoMap.get(code) ?? 0;
        const valLdo = Number((fullLdoForCode * share).toFixed(2));

        const diferenca = Number((valLoaProposta - valLdo).toFixed(2));
        const percentual = valLdo > 0 ? Number(((valLoaProposta / valLdo) * 100).toFixed(2)) : 100;
        const situacao: "SUPERAVIT" | "DEFICIT" | "EQUILIBRIO" =
          Math.abs(diferenca) < 1 ? "EQUILIBRIO" : diferenca > 0 ? "DEFICIT" : "SUPERAVIT";

        items.push({
          id: rawName,
          secretaria: rawName,
          valLoaVigente,
          valorReajuste,
          valorAditamento,
          valLoaProposta,
          valLdo,
          diferenca,
          percentual,
          situacao,
        });
      }
    } else {
      // Fallback para Base Demonstrativa / Fictícia preservada
      const demoRecords = getSecretariatDemoRecords(2027);
      const demoMap = new Map<string, number>();
      for (const r of demoRecords) {
        demoMap.set(r.secretariat, (demoMap.get(r.secretariat) || 0) + r.value);
      }

      let index = 1;
      for (const [secName, valLoaVigente] of demoMap.entries()) {
        const reajusteRate = (index % 3 === 0 ? 0.03 : index % 2 === 0 ? 0.015 : 0);
        const valorReajuste = Math.round(valLoaVigente * reajusteRate);
        const valorAditamento = 0;
        const valLoaProposta = valLoaVigente + valorReajuste + valorAditamento;
        // Simular LDO ligeiramente variável
        const ldoFactor = (index % 2 === 0 ? 0.97 : 1.02);
        const valLdo = Math.round(valLoaVigente * ldoFactor);
        const diferenca = Number((valLoaProposta - valLdo).toFixed(2));
        const percentual = valLdo > 0 ? Number(((valLoaProposta / valLdo) * 100).toFixed(2)) : 100;
        const situacao = Math.abs(diferenca) < 1 ? "EQUILIBRIO" : diferenca > 0 ? "DEFICIT" : "SUPERAVIT";

        items.push({
          id: secName,
          secretaria: secName,
          valLoaVigente,
          valorReajuste,
          valorAditamento,
          valLoaProposta,
          valLdo,
          diferenca,
          percentual,
          situacao,
        });
        index++;
      }
    }

    // Ordenar decrescente pelo Valor LOA Proposta
    items.sort((a, b) => b.valLoaProposta - a.valLoaProposta);

    const totais = items.reduce(
      (acc, item) => ({
        valLoaVigente: acc.valLoaVigente + item.valLoaVigente,
        valorReajuste: acc.valorReajuste + item.valorReajuste,
        valorAditamento: acc.valorAditamento + item.valorAditamento,
        valLoaProposta: acc.valLoaProposta + item.valLoaProposta,
        valLdo: acc.valLdo + item.valLdo,
        diferenca: acc.diferenca + item.diferenca,
      }),
      { valLoaVigente: 0, valorReajuste: 0, valorAditamento: 0, valLoaProposta: 0, valLdo: 0, diferenca: 0 }
    );

    return NextResponse.json({
      success: true,
      exercise,
      isRealData: hasRealLoa,
      totalSecretarias: items.length,
      totais,
      items,
    });
  } catch (error) {
    console.error("Erro ao buscar comparativo de secretarias:", error);
    return NextResponse.json({ error: "Falha ao gerar comparativo de secretarias." }, { status: 500 });
  }
}
