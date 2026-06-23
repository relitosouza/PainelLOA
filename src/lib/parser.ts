import * as XLSX from "xlsx";
import type { BudgetRow, FieldKey } from "@/types/loa";

const HEADER_ALIASES: Record<string, FieldKey | "value"> = {
  "CD ORGAO DS ORGAO": "organ",
  "ORGAO": "organ",
  "CD UNID DS UNID": "budgetUnit",
  "UNIDADE ORCAMENTARIA": "budgetUnit",
  "CD FUNCAO DS FUNCAO": "functionName",
  "FUNCAO": "functionName",
  "CD SUBFUNCAO DS SUBFUNCAO": "subfunction",
  "SUBFUNCAO": "subfunction",
  "CD PROGRAMA DS PROGRAMA": "program",
  "PROGRAMA": "program",
  "CD ACAO DS ACAO": "action",
  "ACAO": "action",
  "NATUREZA DE DESPESA": "expenseNature",
  "NATUREZA DA DESPESA": "expenseNature",
  "DESC SUB": "subelement",
  "SUBELEMENTO": "subelement",
  "PROCESSO ADMINISTRATIVO": "administrativeProcess",
  "VALOR": "value",
};

const REQUIRED: Array<FieldKey | "value"> = ["budgetUnit", "functionName", "subfunction", "program", "action", "expenseNature", "subelement", "administrativeProcess", "value"];

export function normalizeHeader(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[._\-/]+/g, " ").replace(/\s+/g, " ").trim();
}

export function parseBrazilianMoney(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  let text = String(value ?? "").replace(/R\$/gi, "").replace(/\s/g, "");
  if (!text) return NaN;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma > lastDot) text = text.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma && /,/.test(text)) text = text.replace(/,/g, "");
  else if ((text.match(/\./g) ?? []).length > 1) text = text.replace(/\./g, "");
  else if (lastComma >= 0) text = text.replace(/\./g, "").replace(",", ".");
  const parsed = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function getHeaderMap(row: unknown[]) {
  const map = new Map<FieldKey | "value", number>();
  row.forEach((cell, index) => {
    const field = HEADER_ALIASES[normalizeHeader(cell)];
    if (field) map.set(field, index);
  });
  return map;
}

function isValidHeader(map: Map<FieldKey | "value", number>) {
  return REQUIRED.every((field) => map.has(field));
}

export function parseWorkbook(buffer: ArrayBuffer | Buffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  return parseRows(rows);
}

export function parseRows(rows: unknown[][]) {
  const records: BudgetRow[] = [];
  const invalidValues: number[] = [];
  let currentOrgan = "";
  let headerMap = new Map<FieldKey | "value", number>();

  rows.forEach((row, rowIndex) => {
    if (!row.some((cell) => clean(cell))) return;
    const candidate = getHeaderMap(row);
    if (isValidHeader(candidate)) {
      headerMap = candidate;
      return;
    }

    const firstHeader = HEADER_ALIASES[normalizeHeader(row[0])];
    if (firstHeader === "organ" && clean(row[1])) {
      currentOrgan = clean(row[1]);
      return;
    }
    if (!isValidHeader(headerMap)) return;

    const organIndex = headerMap.get("organ");
    const rowOrgan = organIndex === undefined ? "" : clean(row[organIndex]);
    const valueIndex = headerMap.get("value")!;
    if (rowOrgan && !clean(row[valueIndex])) {
      currentOrgan = rowOrgan;
      return;
    }

    const value = parseBrazilianMoney(row[valueIndex]);
    const hasDetail = REQUIRED.slice(0, -1).some((field) => clean(row[headerMap.get(field)!]));
    if (!hasDetail) return;
    if (!Number.isFinite(value)) {
      invalidValues.push(rowIndex + 1);
      return;
    }

    const record = {} as BudgetRow;
    for (const field of REQUIRED.slice(0, -1) as FieldKey[]) record[field] = clean(row[headerMap.get(field)!]);
    record.organ = rowOrgan || currentOrgan;
    record.value = value;
    records.push(record);
  });

  const missingOrgan = records.some((record) => !record.organ);
  return { records, invalidValues, missingOrgan, hasRequiredFields: isValidHeader(headerMap) };
}

