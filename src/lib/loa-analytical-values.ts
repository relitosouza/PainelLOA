import * as XLSX from "xlsx";

export type AnalyticalFinancialInput = {
  valLoa2026?: number;
  valLoa: number;
  valorReajuste?: number;
  valorAditamento?: number;
  valorSugestaoSf?: number;
  valorCorteGp?: number;
};

export type BudgetScenario = "oficial" | "sf";

export function calculateAnalyticalValues(item: AnalyticalFinancialInput, scenario: BudgetScenario = "oficial") {
  const vigente = Number(item.valLoa) || 0;
  const reajuste = Number(item.valorReajuste) || 0;
  const aditamento = Number(item.valorAditamento) || 0;
  const sugestaoSf = Number(item.valorSugestaoSf) || 0;
  const oficialTotal = vigente + reajuste + aditamento;
  const cenarioSfTotal = sugestaoSf > 0 ? sugestaoSf : oficialTotal;

  return {
    loa2026: Number(item.valLoa2026) || 0,
    vigente,
    reajuste,
    vigenteComReajuste: vigente + reajuste,
    aditamento,
    loa2027Oficial: oficialTotal,
    loa2027CenarioSf: cenarioSfTotal,
    loa2027: scenario === "sf" ? cenarioSfTotal : oficialTotal,
    sugestaoSf,
    corteGp: Number(item.valorCorteGp) || 0,
    isSfActive: sugestaoSf > 0,
  };
}

/**
 * Calcula a adoção da Sugestão SF na composição oficial da LOA.
 * Ajusta o valorAditamento para que Vigente + Reajuste + NovoAditamento = Sugestão SF.
 */
export function calculateSugestaoSfAdoption(item: AnalyticalFinancialInput): {
  valorAditamento: number;
  novoTotal: number;
  diferenca: number;
} {
  const sugestaoSf = Number(item.valorSugestaoSf) || 0;
  const vigente = Number(item.valLoa) || 0;
  const reajuste = Number(item.valorReajuste) || 0;
  const atualAditamento = Number(item.valorAditamento) || 0;
  const anteriorTotal = vigente + reajuste + atualAditamento;

  if (sugestaoSf <= 0) {
    return {
      valorAditamento: atualAditamento,
      novoTotal: anteriorTotal,
      diferenca: 0,
    };
  }

  const novoAditamento = sugestaoSf - (vigente + reajuste);
  return {
    valorAditamento: novoAditamento,
    novoTotal: sugestaoSf,
    diferenca: sugestaoSf - anteriorTotal,
  };
}

export function createBancoProjetoValues(valor: number) {
  return {
    valLoa: 0,
    valorAditamento: Number(valor) || 0,
  };
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildProgrammaticKey(unidade: unknown, classificacao: unknown, natureza: unknown) {
  const unitParts = String(unidade ?? "").trim().split(".");
  const functionalParts = String(classificacao ?? "").trim().split(".");
  if (unitParts.length < 3 || functionalParts.length < 5) return "";
  return [
    unitParts[1].padStart(2, "0"),
    unitParts[2].padStart(3, "0"),
    functionalParts[0].padStart(2, "0"),
    functionalParts[1].padStart(3, "0"),
    functionalParts[2].padStart(4, "0"),
    `${functionalParts[3]}.${functionalParts[4]}`,
    String(natureza ?? "").trim(),
  ].join(".");
}

export function parseLoa2026InitialWorkbook(buffer: ArrayBuffer | Uint8Array): Map<string, number> {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  const headers = (rows[0] ?? []).map(normalizeHeader);
  const unitIndex = headers.indexOf("unidade_orcamentaria");
  const exerciseIndex = headers.indexOf("exercicio");
  const functionalIndex = headers.indexOf("classificacao_funcional");
  const natureIndex = headers.indexOf("natureza_despesa");
  const initialIndex = headers.indexOf("inicial");
  if ([unitIndex, exerciseIndex, functionalIndex, natureIndex, initialIndex].some((index) => index < 0)) {
    throw new Error("A planilha LOA 2026 não contém as colunas obrigatórias.");
  }

  const values = new Map<string, number>();
  rows.slice(1).forEach((row) => {
    if (Number(row[exerciseIndex]) !== 2026) return;
    const key = buildProgrammaticKey(row[unitIndex], row[functionalIndex], row[natureIndex]);
    if (!key) return;
    values.set(key, (values.get(key) ?? 0) + (Number(row[initialIndex]) || 0));
  });
  return values;
}

type AllocatableItem = {
  id: string;
  programaticaLoa?: string;
  valLoa: number;
};

export function allocateLoa2026Initial<T extends AllocatableItem>(items: T[], totals: Map<string, number>): Array<T & { valLoa2026: number }> {
  const indexesByKey = new Map<string, number[]>();
  items.forEach((item, index) => {
    const key = String(item.programaticaLoa ?? "").trim();
    if (!key || !totals.has(key)) return;
    indexesByKey.set(key, [...(indexesByKey.get(key) ?? []), index]);
  });

  const allocations = new Array<number>(items.length).fill(0);
  indexesByKey.forEach((indexes, key) => {
    const totalCents = Math.round((totals.get(key) ?? 0) * 100);
    const weights = indexes.map((index) => Math.max(0, Number(items[index].valLoa) || 0));
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    let allocatedCents = 0;
    indexes.forEach((itemIndex, position) => {
      const isLast = position === indexes.length - 1;
      const cents = isLast
        ? totalCents - allocatedCents
        : Math.round(totalCents * (weightTotal > 0 ? weights[position] / weightTotal : 1 / indexes.length));
      allocations[itemIndex] = cents / 100;
      allocatedCents += cents;
    });
  });

  return items.map((item, index) => ({ ...item, valLoa2026: allocations[index] }));
}
