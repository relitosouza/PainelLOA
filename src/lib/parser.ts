import * as XLSX from "xlsx";
import type { BudgetRow, FieldKey } from "@/types/loa";

const HEADER_ALIASES: Record<string, FieldKey | "value" | "budgetPiece"> = {
  "CD ORGAO DS ORGAO": "organ",
  "ORGAO": "organ",
  "SECRETARIA": "organ",
  "CD UNID DS UNID": "budgetUnit",
  "UNIDADE ORCAMENTARIA": "budgetUnit",
  "UNIDADE": "budgetUnit",
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
  "NATUREZA": "expenseNature",
  "DESC SUB": "subelement",
  "SUBELEMENTO": "subelement",
  "PROCESSO ADMINISTRATIVO": "administrativeProcess",
  "VALOR": "value",
  "PECA ORCAMENTARIA": "budgetPiece",
  "APELIDO": "apelido" as any,
  "APELIDOS": "apelido" as any,
  "APELIDO DESPESA": "apelido" as any,
  "APELIDO DA DESPESA": "apelido" as any,
  "CONTRATO": "contrato" as any,
  "CONTRATOS": "contrato" as any,
  "N CONTRATO": "contrato" as any,
  "NUMERO CONTRATO": "contrato" as any,
  "FR": "fonteRecurso" as any,
  "TIPO DE ACAO": "tipoAcao" as any,
};

const REQUIRED: Array<FieldKey | "value"> = ["budgetUnit", "functionName", "subfunction", "program", "action", "expenseNature", "subelement", "value"];

const ALL_FIELDS_EXCEPT_ORGAN: FieldKey[] = ["budgetUnit", "functionName", "subfunction", "program", "action", "expenseNature", "subelement", "administrativeProcess"];

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
  const map = new Map<FieldKey | "value" | "budgetPiece", number>();
  row.forEach((cell, index) => {
    const field = HEADER_ALIASES[normalizeHeader(cell)];
    if (field) map.set(field, index);
  });
  return map;
}

function isValidHeader(map: Map<FieldKey | "value" | "budgetPiece", number>) {
  return REQUIRED.every((field) => map.has(field));
}

export function parseWorkbook(buffer: ArrayBuffer | Buffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames.find((name) => normalizeHeader(name) === "CONSOLIDADOLOA27 ATIVIDADES") ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  const parsed = parseRows(rows);
  const contracts = workbook.SheetNames.includes("Contratos") ? parseContracts(workbook.Sheets.Contratos) : [];
  return { ...parsed, contracts };
}

const contractHeaders = ["secretaria", "fornecedor", "apelidoDespesa", "contratoPasta", "processoAdministrativo", "valorContratual", "inicioContrato", "vencimentoContrato", "fonteClassificacao", "classificacao", "qtdProgramaticas", "reajuste", "conferido", "mesesContrato", "mesesRestantes", "valor12Meses", "loaProposta", "vinculo", "quantidadePA", "diferenca"] as const;
function excelDate(value: unknown) { const n = Number(value); return Number.isFinite(n) && n > 20000 ? new Date(Date.UTC(1899, 11, 30 + n)).toISOString() : null; }
function parseContracts(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "", range: 2 });
  return rows.filter((row) => row.some((value) => String(value ?? "").trim())).map((row) => Object.fromEntries(contractHeaders.map((key, i) => [key, ["inicioContrato", "vencimentoContrato"].includes(key) ? excelDate(row[i]) : row[i] ?? ""])));
}

export function parseRows(rows: unknown[][]) {
  const records: BudgetRow[] = [];
  const invalidValues: number[] = [];
  let currentOrgan = "";
  let headerMap = new Map<FieldKey | "value" | "budgetPiece", number>();

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

    const budgetPieceIdx = headerMap.get("budgetPiece" as any);
    if (budgetPieceIdx !== undefined) {
      const pieceVal = clean(row[budgetPieceIdx]).toUpperCase();
      if (pieceVal && pieceVal !== "LOA") return;
    }

    const value = parseBrazilianMoney(row[valueIndex]);
    const hasDetail = REQUIRED.slice(0, -1).some((field) => clean(row[headerMap.get(field)!]));
    if (!hasDetail) return;
    if (!Number.isFinite(value)) {
      invalidValues.push(rowIndex + 1);
      return;
    }

    const record = {} as BudgetRow;
    for (const field of ALL_FIELDS_EXCEPT_ORGAN) {
      const idx = headerMap.get(field);
      record[field] = idx !== undefined ? clean(row[idx]) : "";
    }
    record.organ = rowOrgan || currentOrgan;
    record.value = value;
    const apelidoIdx = headerMap.get("apelido" as any);
    const apelidoVal = apelidoIdx !== undefined ? clean(row[apelidoIdx]) : (row.length > 24 ? clean(row[24]) : "");
    (record as BudgetRow & Record<string, string>).apelido = apelidoVal;
    (record as BudgetRow & Record<string, string>).contrato = clean(row[headerMap.get("contrato" as any)!]);
    (record as BudgetRow & Record<string, string>).fonteRecurso = clean(row[headerMap.get("fonteRecurso" as any)!]);
    (record as BudgetRow & Record<string, string>).tipoAcao = clean(row[headerMap.get("tipoAcao" as any)!]);
    records.push(record);
  });

  const missingOrgan = records.some((record) => !record.organ);
  return { records, invalidValues, missingOrgan, hasRequiredFields: isValidHeader(headerMap) };
}
