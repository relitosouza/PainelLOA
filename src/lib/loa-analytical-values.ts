import * as XLSX from "xlsx";

export type AnalyticalFinancialInput = {
  valLoa2026?: number;
  valLoa: number;
  valorReajuste?: number;
  valorAditamento?: number;
  valorSugestaoSf?: number;
  valorCorteGp?: number;
};

export function calculateAnalyticalValues(item: AnalyticalFinancialInput) {
  const vigente = Number(item.valLoa) || 0;
  const reajuste = Number(item.valorReajuste) || 0;
  const aditamento = Number(item.valorAditamento) || 0;
  const loa2027 = vigente + reajuste + aditamento;
  const sugestaoSf = Number(item.valorSugestaoSf) || 0;
  const corteGp = Number(item.valorCorteGp) || 0;
  return {
    loa2026: Number(item.valLoa2026) || 0,
    vigente,
    reajuste,
    vigenteComReajuste: vigente + reajuste,
    aditamento,
    loa2027,
    sugestaoSf,
    corteGp,
    total: loa2027 + sugestaoSf + corteGp,
  };
}

/** Código do órgão a partir do rótulo "09 - SECRETARIA DA SAÚDE" → "09". */
export function getSecretariatCode(name: string): string | null {
  const match = name.match(/^(\d+)/);
  return match ? match[1].padStart(2, "0") : null;
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

/**
 * LOA 2026 no formato CSV da SF: PROGRAMÁTICA;VALOR FINAL ARREDONDADO, uma linha por dotação.
 * A programática do CSV termina com o vínculo (ex.: ...3.3.90.30.01.110.0000). A Análise LOA agrupa
 * por programática sem vínculo (ex.: ...3.3.90.30.00), então o vínculo é retirado e os valores somados.
 */
export function parseLoa2026ProgramaticaCsv(texto: string): Map<string, number> {
  const linhas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter((linha) => linha.trim());
  const valores = new Map<string, number>();
  linhas.slice(1).forEach((linha) => {
    const separador = linha.indexOf(",");
    if (separador < 0) return;
    const programatica = linha.slice(0, separador).trim();
    const valorTexto = linha.slice(separador + 1).replace(/"/g, "").trim();
    if (!valorTexto) return; // linhas sem valor (programáticas incompletas na origem)
    const valor = Number(valorTexto.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valor)) return;
    const partes = programatica.split(".");
    if (partes.length < 12) return;
    const chave = `${partes.slice(0, partes.length - 3).join(".")}.00`;
    valores.set(chave, (valores.get(chave) ?? 0) + valor);
  });
  return valores;
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
