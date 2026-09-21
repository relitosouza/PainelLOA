// Montagem das linhas da Análise LOA (subelemento) a partir da planilha base e dos dados salvos no painel.
// Compartilhada entre a tela (analise-loa-view) e as APIs que precisam dos mesmos totais, para que
// os números não divirjam entre as telas.
import { normalizeUnidadeOrcamentaria } from "@/lib/unidades-orcamentarias-catalogo";
import { normalizeActionLabel, normalizeProgramLabel } from "@/lib/loa-labels";

export interface RawBudgetItem {
  id: string;
  progKey: string;
  secretaria: string;
  orgao: string;
  unidade: string;
  programa: string;
  tipoAcao: string;
  acao: string;
  natureza: string;
  fonteVinculo: string;
  categoriaEconomica: string;
  grupoNatureza: string;
  elemento: string;
  subelemento: string;
  processo: string;
  funcao?: string;
  subfuncao?: string;
  programaticaLoa?: string;
  codigoAplicacao?: string;
  projetoIniciado?: string;
  contrato?: string;
  observacao?: string;
  valLdo: number;
  valLoa: number;
  valLoa2026?: number;
  valorReajuste?: number;
  valorAditamento?: number;
  valorSugestaoSf?: number;
  valorCorteGp?: number;
  origem?: "Banco de Projetos";
  bancoProjetoKey?: string;
  vinculoParentId?: string;
}

export const normalizeBancoProjetoAllocation = (item: RawBudgetItem): RawBudgetItem => {
  const isBancoProjeto = item.origem === "Banco de Projetos" || item.id.startsWith("banco-projeto-") || Boolean(item.bancoProjetoKey);
  if (!isBancoProjeto || item.valLoa === 0) return item;
  const persistedAditamento = Number(item.valorAditamento) || 0;
  return {
    ...item,
    valLoa: 0,
    // Projetos são alocados integralmente como aditamento. Depois de uma
    // importação, o mesmo valor pode existir tanto no cadastro original
    // (valLoa) quanto na edição financeira persistida; nesse caso, somá-los
    // novamente faria o orçamento crescer a cada recarga.
    valorAditamento: persistedAditamento === 0 ? item.valLoa : persistedAditamento,
    valLoa2026: 0,
  };
};

export function getActionTypeLabel(action: string): string {
  if (!action) return "Outros";
  const clean = action.trim();
  const firstChar = clean.charAt(0);
  if (firstChar === "0") return "0. Operação Especial";
  if (firstChar === "1") return "1. Projeto";
  if (firstChar === "2") return "2. Atividade";
  return "Outros";
}

/** Converte as linhas da planilha (sheet_to_json com header: 1) nos itens da análise, agregando LOA e LDO por dotação. */
export function buildAnaliseLoaItems(rows: unknown[][], nomMap: Record<string, string>): RawBudgetItem[] {
  const loaMap = new Map<string, RawBudgetItem>();
  const headers = (rows[0] ?? []) as unknown[];
  const findCol = (...aliases: string[]) => {
    const targets = aliases.map((a) => a.toLowerCase().trim());
    for (let idx = headers.length - 1; idx >= 0; idx--) {
      const h = String(headers[idx] ?? "").toLowerCase().trim();
      if (targets.includes(h)) return idx;
    }
    return -1;
  };

  const columns = {
    piece: findCol("peça orçamentária", "peca orcamentaria", "peça", "peca"),
    programKey: findCol("programática_loa", "programatica_loa", "programatica"),
    organ: findCol("secretaria", "orgao", "órgão", "secretaria_nome"),
    unit: findCol("unidade", "unid", "cd_unid.-ds_unid."),
    functionName: findCol("funcao", "função", "cd_função-ds_função", "cd_funcao-ds_funcao"),
    subfunction: findCol("subfuncao", "subfunção", "cd subfunção-ds_subfunção", "cd subfuncao-ds_subfuncao"),
    program: findCol("programa", "cd_programa-ds_programa"),
    action: findCol("acao", "ação", "cd_ação-ds_ação", "cd_acao-ds_acao"),
    nature: findCol("natureza", "natureza de despesa", "natureza da despesa"),
    subelement: findCol("desc_sub", "desc sub", "subelemento", "descrição subelemento", "descricao subelemento"),
    process: findCol("processo", "processo administrativo", "proc.", "proc", "processo_administrativo"),
    value: findCol("valor", "val_loa", "valor loa", "valor_loa"),
    link: findCol("vínculo", "vinculo", "fonte", "fonte de recursos", "fonte/vínculo", "fonte/vinculo"),
    appCode: findCol("codigo_aplicacao", "cod_aplicacao", "codigo de aplicacao", "código de aplicação", "cod. aplicacao", "cod aplicacao", "aplicacao", "aplicação", "cd_aplicacao"),
    obs: findCol("obs.", "obs", "observacao", "observação", "observacoes", "observações", "justificativa"),
    iniciado: findCol("contrato", "contratos", "iniciado", "projeto iniciado", "projeto_iniciado", "contrato_iniciado"),
  };

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const peca = String(r[columns.piece] || "").trim().toUpperCase();
    // Ignora linhas de totalização ou vazias sem identificador de peça
    if (peca !== "LOA" && peca !== "LDO") continue;

    const progKey = String(r[columns.programKey] || "").trim().replace(/^\.+/, "");
    let organStr = String(r[columns.organ] || "").trim().replace(/^\.+/, "");
    organStr = organStr.replace(/^(\d+)\s*-\s*/, (match, code) => `${code.padStart(2, "0")} - `);
    if (organStr === "01 - CMO" || organStr === "01- CMO") organStr = "01 - CMO";
    const rawUnitStr = String(r[columns.unit] || "").trim().replace(/^\.+/, "");
    const unitStr = normalizeUnidadeOrcamentaria(organStr, rawUnitStr, progKey);
    const functionStr = columns.functionName >= 0 ? String(r[columns.functionName] || "").trim().replace(/^\.+/, "") : "";
    const subfunctionStr = columns.subfunction >= 0 ? String(r[columns.subfunction] || "").trim().replace(/^\.+/, "") : "";
    const programStr = normalizeProgramLabel(String(r[columns.program] || "").trim().replace(/^\.+/, ""));
    const actionStr = normalizeActionLabel(String(r[columns.action] || "").trim().replace(/^\.+/, ""));
    if (!organStr && !programStr && !actionStr) continue;
    let natureStr = String(r[columns.nature] || "").trim().replace(/^\.+/, "").replace(/\.\./g, ".");
    natureStr = natureStr
      .replace(/^3\.50\.39/, "3.3.50.39")
      .replace(/^3\.90\.35/, "3.3.90.35")
      .replace(/^4\.90\.52/, "4.4.90.52");
    const subelemStr = String(r[columns.subelement] || "").trim().replace(/^\.+/, "");
    const processStr = String(r[columns.process] || "").trim().replace(/^\.+/, "");
    const obsStr = columns.obs >= 0 ? String(r[columns.obs] || "").trim() : "";
    const iniciadoRaw = columns.iniciado >= 0 ? String(r[columns.iniciado] || "").trim().toUpperCase() : "";
    const projetoIniciado = iniciadoRaw === "SIM" || iniciadoRaw === "NÃO" || iniciadoRaw === "NAO"
      ? (iniciadoRaw === "NAO" ? "NÃO" : iniciadoRaw)
      : undefined;
    const valor = Number(r[columns.value]) || 0;
    const realVinculoStr = String(r[columns.link] || "").trim();
    let extractedFonte = realVinculoStr;
    let extractedCodigoAplicacao: string | undefined = columns.appCode >= 0 ? String(r[columns.appCode] || "").trim() || undefined : undefined;

    // Se o vínculo vier no formato composto por pontos (ex.: 01.110.0000)
    if (realVinculoStr.includes(".") && !extractedCodigoAplicacao) {
      const vParts = realVinculoStr.split(".");
      if (vParts.length >= 2) {
        extractedFonte = vParts[0];
        extractedCodigoAplicacao = vParts.slice(1).join(".");
      }
    }

    const natCodeClean = natureStr.split("-")[0].trim();
    const natCodeRaw = natCodeClean.replace(/\D/g, "");
    const officialDesc = nomMap[natCodeClean] || nomMap[natCodeRaw];
    if (officialDesc) {
      natureStr = `${natCodeClean} - ${officialDesc}`;
    }

    const parts = natCodeClean.split(".");
    const catDespesaMap: Record<string, string> = {
      "3": "3 — DESPESAS CORRENTES",
      "4": "4 — DESPESAS DE CAPITAL",
      "9": "9 — RESERVA DE CONTINGÊNCIA",
    };
    const catEcon = parts[0] ? (catDespesaMap[parts[0]] || `${parts[0]} — Despesa`) : "Outras";
    const grupoDespesaMap: Record<string, string> = {
      "0": "RESTOS A PAGAR",
      "1": "PESSOAL E ENCARGOS SOCIAIS",
      "2": "JUROS E ENCARGOS DA DÍVIDA",
      "3": "OUTRAS DESPESAS CORRENTES",
      "4": "INVESTIMENTOS",
      "5": "INVERSÕES FINANCEIRAS",
      "6": "AMORTIZAÇÃO DA DÍVIDA",
      "8": "EXTRAORÇAMENTÁRIA",
      "9": "RESERVA DE CONTINGÊNCIA",
    };
    const grupoNome = parts[1] ? grupoDespesaMap[parts[1]] : undefined;
    const grpNat = parts[1]
      ? (grupoNome ? `${parts[0]}.${parts[1]} — ${grupoNome}` : `${parts[0]}.${parts[1]} — Grupo`)
      : "Outros";
    const elem = parts.length >= 4 ? parts.slice(0, 4).join(".") : parts[2] ? `${parts[0]}.${parts[1]}.${parts[2]}` : "Outros";
    const vinculo = extractedFonte || (parts[3] ? `${parts[2]}.${parts[3]}` : "Tesouro / Próprio");
    const codApp = extractedCodigoAplicacao;

    const groupKey = `${organStr}|${actionStr}|${natureStr}|${vinculo}|${codApp || ""}|${processStr}|${subelemStr}`;

    if (!loaMap.has(groupKey)) {
      loaMap.set(groupKey, {
        id: groupKey,
        progKey: progKey || groupKey,
        secretaria: organStr,
        orgao: organStr,
        unidade: unitStr,
        funcao: functionStr,
        subfuncao: subfunctionStr,
        programaticaLoa: progKey,
        programa: programStr,
        tipoAcao: getActionTypeLabel(actionStr),
        acao: actionStr,
        natureza: natureStr,
        fonteVinculo: vinculo,
        codigoAplicacao: codApp,
        categoriaEconomica: catEcon,
        grupoNatureza: grpNat,
        elemento: elem,
        subelemento: subelemStr,
        processo: processStr || "—",
        projetoIniciado: projetoIniciado,
        contrato: projetoIniciado || undefined,
        observacao: obsStr || undefined,
        valLdo: 0,
        valLoa: 0,
      });
    }

    const item = loaMap.get(groupKey)!;
    if (peca === "LDO") {
      item.valLdo = Math.round((item.valLdo + Math.round(valor * 100) / 100) * 100) / 100;
    } else {
      item.valLoa += valor;
    }
  }
  return [...loaMap.values()];
}

export type AnaliseLoaSavedData = {
  addedExpenses?: RawBudgetItem[];
  removedIds?: string[];
  customEdits?: Record<string, number>;
  subelementEdits?: Record<string, Partial<RawBudgetItem>>;
  financialEdits?: Record<string, { valorReajuste?: number; valorAditamento?: number; valorSugestaoSf?: number; valorCorteGp?: number }>;
};

export const withAddedExpenses = (items: RawBudgetItem[], added: RawBudgetItem[]) =>
  added.length
    ? [...items, ...added.map((item) => ({ ...item, valLoa2026: item.valLoa2026 ?? 0, tipoAcao: item.tipoAcao || getActionTypeLabel(item.acao) }))]
    : items;

export const resolveAddedExpenses = (
  serverItems: RawBudgetItem[],
  localItems: RawBudgetItem[],
  serverLoaded: boolean,
) => serverLoaded ? serverItems : localItems;

export const withoutRemoved = (items: RawBudgetItem[], removedIds: string[]) => {
  if (!removedIds.length) return items;
  const removedSet = new Set(removedIds);
  return items.filter((item) => !removedSet.has(item.id));
};

export const withCustomEdits = (
  items: RawBudgetItem[],
  customMap: Record<string, number | { valorLoa?: number }>
) =>
  items.map((item) => {
    if (customMap[item.id] !== undefined) {
      const rawVal = customMap[item.id];
      const numericVal =
        typeof rawVal === "number"
          ? rawVal
          : typeof rawVal === "object" && rawVal !== null && "valorLoa" in rawVal
          ? Number(rawVal.valorLoa)
          : Number(rawVal);
      return { ...item, valLoa: isNaN(numericVal) ? item.valLoa : numericVal };
    }
    return item;
  });

export const withSubelementEdits = (items: RawBudgetItem[], edits: Record<string, Partial<RawBudgetItem>>) =>
  items.map((item) => (edits[item.id] ? { ...item, ...edits[item.id] } : item));

export const withFinancialEdits = (items: RawBudgetItem[], edits: NonNullable<AnaliseLoaSavedData["financialEdits"]>) =>
  items.map((item) => ({ ...item, ...(edits[item.id] || {}) }));

/** Aplica os dados salvos na mesma ordem da tela: inclusões, exclusões, valores, subelementos, reajustes e Banco de Projetos. */
export function applyAnaliseLoaSavedData(items: RawBudgetItem[], saved: AnaliseLoaSavedData): RawBudgetItem[] {
  let result = withAddedExpenses(items, saved.addedExpenses ?? []);
  result = withoutRemoved(result, saved.removedIds ?? []);
  result = withCustomEdits(result, saved.customEdits ?? {});
  result = withSubelementEdits(result, saved.subelementEdits ?? {});
  result = withFinancialEdits(result, saved.financialEdits ?? {});
  return result.map(normalizeBancoProjetoAllocation);
}
