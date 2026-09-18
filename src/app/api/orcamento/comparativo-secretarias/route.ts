import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSecretariatDemoRecords } from "@/lib/secretariat-data";
import { calculateAnalyticalValues } from "@/lib/loa-analytical-values";
import { loadAnaliseLoaItems } from "@/lib/loa-analise-items.server";
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

    // LOA por secretaria a partir das mesmas linhas da Análise LOA (planilha base + dados salvos do painel),
    // para que a Proposta aqui seja igual ao Valor Previsto LOA de lá.
    const analiseItems = await loadAnaliseLoaItems();
    const loaBySecretaria = new Map<string, { vigente: number; reajuste: number; aditamento: number; proposta: number }>();
    for (const item of analiseItems) {
      const valores = calculateAnalyticalValues(item);
      const atual = loaBySecretaria.get(item.secretaria) ?? { vigente: 0, reajuste: 0, aditamento: 0, proposta: 0 };
      atual.vigente += valores.vigente;
      atual.reajuste += valores.reajuste;
      atual.aditamento += valores.aditamento;
      atual.proposta += valores.loa2027;
      loaBySecretaria.set(item.secretaria, atual);
    }
    const loaByOrgan = [...loaBySecretaria.entries()].map(([organ, valores]) => ({ organ, ...valores }));

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

    const items: ComparativoSecretariaItem[] = [];

    if (hasRealLoa) {
      // Calcular totais por código de órgão no LOA para rateio proporcional de LDO/Reajuste compartilhado (ex: órgão 18)
      const loaTotalsByCode = new Map<string, number>();
      for (const row of loaByOrgan) {
        const rawName = row.organ || "Não Identificado";
        const code = getSecretariatCode(rawName) || rawName;
        loaTotalsByCode.set(code, (loaTotalsByCode.get(code) || 0) + row.proposta);
      }

      for (const row of loaByOrgan) {
        const rawName = row.organ || "Não Identificado";
        const code = getSecretariatCode(rawName) || rawName;
        const valLoaVigente = Number(row.vigente.toFixed(2));
        const valorReajuste = Number(row.reajuste.toFixed(2));
        const valorAditamento = Number(row.aditamento.toFixed(2));
        const valLoaProposta = Number(row.proposta.toFixed(2));

        // Órgãos que dividem o mesmo código (ex.: 18 - Encargos) repartem a LDO do código pelo peso na LOA
        const totalLoaForCode = loaTotalsByCode.get(code) || valLoaProposta;
        const share = totalLoaForCode > 0 ? valLoaProposta / totalLoaForCode : 1;

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
