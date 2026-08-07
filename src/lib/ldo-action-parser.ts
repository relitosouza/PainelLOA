import * as XLSX from "xlsx";
import { parseBrazilianMoney } from "./parser";

export type LdoActionRow = {
  secretaria: string;
  programaCodigo: string;
  programaNome: string;
  funcaoCodigo: string;
  funcaoNome: string;
  subfuncaoCodigo: string;
  subfuncaoNome: string;
  acaoCodigo: string;
  acaoNome: string;
  produto: string;
  metaFisica: number | null;
  custoFinanceiro: number;
  linhaOrigem: number;
};

export type LdoActionParseResult = {
  records: LdoActionRow[];
  invalidRows: number[];
  totalValue: number;
  secretariats: number;
};

const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

function splitCodeAndName(value: string) {
  const match = value.match(/^([\d.]+)\s*[-–—]\s*(.+)$/);
  return match ? { code: match[1], name: match[2].trim() } : { code: "", name: value };
}

export function parseLdoActionWorkbook(buffer: ArrayBuffer | Buffer): LdoActionParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const candidates = workbook.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: true, defval: "" });
    const headerIndex = rows.findIndex((row) => {
      const cells = row.map(normalize);
      return cells.some((cell) => cell === "secretaria") && cells.some((cell) => cell === "acao") && cells.some((cell) => cell.includes("custo financeiro"));
    });
    const headerWidth = headerIndex >= 0 ? rows[headerIndex].filter((cell) => clean(cell)).length : 0;
    return { name, rows, headerIndex, headerWidth };
  }).filter((candidate) => candidate.headerIndex >= 0).sort((left, right) => right.headerWidth - left.headerWidth || right.rows.length - left.rows.length);
  const selected = candidates[0];
  if (!selected) return { records: [], invalidRows: [], totalValue: 0, secretariats: 0 };
  const { rows, headerIndex } = selected;
  if (headerIndex < 0) return { records: [], invalidRows: [], totalValue: 0, secretariats: 0 };

  const headers = rows[headerIndex].map(normalize);
  const indexOf = (...patterns: string[]) => headers.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
  const exactIndex = (pattern: string) => headers.findIndex((header) => header === pattern);
  const indexes = {
    secretaria: indexOf("secretaria"),
    programa: indexOf("desc programa"),
    programaCodigo: exactIndex("programa"),
    funcaoSubfuncao: exactIndex("funcao subfuncao"),
    funcaoNome: indexOf("desc func sub"),
    acao: exactIndex("acao"),
    acaoNome: indexOf("desc acao"),
    produto: indexOf("produto"),
    meta: exactIndex("custo fisico ano2") >= 0 ? exactIndex("custo fisico ano2") : indexOf("custo fisico", "meta fisica"),
    valor: exactIndex("custo financeiro ano2") >= 0 ? exactIndex("custo financeiro ano2") : indexOf("custo financeiro", "valor financeiro"),
  };

  const records: LdoActionRow[] = [];
  const invalidRows: number[] = [];
  let currentSecretariat = "";
  let currentProgram = "";

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const line = headerIndex + offset + 2;
    const secretariat = clean(row[indexes.secretaria]);
    const program = clean(row[indexes.programa]);
    if (secretariat) currentSecretariat = secretariat;
    if (program) currentProgram = program;

    const actionText = clean(row[indexes.acao]);
    const product = clean(row[indexes.produto]);
    if (!actionText) return;
    const value = parseBrazilianMoney(row[indexes.valor]);
    const physical = parseBrazilianMoney(row[indexes.meta]);
    if (!currentSecretariat || !currentProgram || !actionText || !Number.isFinite(value) || value < 0) {
      invalidRows.push(line);
      return;
    }

    const programParts = splitCodeAndName(currentProgram);
    const actionParts = splitCodeAndName(actionText);
    const explicitProgramCode = indexes.programaCodigo >= 0 ? clean(row[indexes.programaCodigo]) : "";
    const explicitActionName = indexes.acaoNome >= 0 ? clean(row[indexes.acaoNome]) : "";
    const functionCode = indexes.funcaoSubfuncao >= 0 ? clean(row[indexes.funcaoSubfuncao]) : "";
    const functionParts = functionCode.split(/[./]/).filter(Boolean);
    const functionDescription = indexes.funcaoNome >= 0 ? clean(row[indexes.funcaoNome]) : "";
    records.push({
      secretaria: currentSecretariat.replace(/\.$/, ""),
      programaCodigo: explicitProgramCode || programParts.code,
      programaNome: programParts.name,
      funcaoCodigo: functionParts[0] || "",
      funcaoNome: "",
      subfuncaoCodigo: functionParts.length > 1 ? `${functionParts[0]}.${functionParts[1]}` : "",
      subfuncaoNome: functionDescription,
      acaoCodigo: actionParts.code || actionText,
      acaoNome: explicitActionName || (actionParts.name === actionText ? "" : actionParts.name),
      produto: product,
      metaFisica: Number.isFinite(physical) ? physical : null,
      custoFinanceiro: value,
      linhaOrigem: line,
    });
  });

  return {
    records,
    invalidRows,
    totalValue: records.reduce((sum, record) => sum + record.custoFinanceiro, 0),
    secretariats: new Set(records.map((record) => record.secretaria)).size,
  };
}
