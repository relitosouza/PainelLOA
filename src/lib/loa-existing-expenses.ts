import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

export type ExistingLoaExpense = {
  secretaria: string;
  acaoCodigo: string;
  valorLoa: number;
};

function normalizeSecretariat(value: string) {
  return value.match(/^\s*(\d+)/)?.[1]?.padStart(2, "0") ?? value.trim();
}

export function getExistingLoaExpenses(): ExistingLoaExpense[] {
  const filePath = path.join(process.cwd(), "public", "loa_new.xlsx");
  if (!fs.existsSync(filePath)) return [];
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  const totals = new Map<string, ExistingLoaExpense>();
  rows.slice(1).forEach((row) => {
    if (String(row[18] ?? "").trim().toUpperCase() !== "LOA" || String(row[15] ?? "").trim()) return;
    const acaoCodigo = String(row[13] ?? "").trim().split("-")[0]?.trim();
    const secretaria = normalizeSecretariat(String(row[8] ?? ""));
    if (!acaoCodigo || !secretaria) return;
    const key = `${secretaria}|${acaoCodigo}`;
    const current = totals.get(key) ?? { secretaria, acaoCodigo, valorLoa: 0 };
    current.valorLoa += Number(row[17]) || 0;
    totals.set(key, current);
  });
  return [...totals.values()];
}

export function getExistingLoaTotal(expenses: ExistingLoaExpense[], secretaria: string, acaoCodigo: string) {
  return expenses.find((item) => item.secretaria === secretaria && item.acaoCodigo === acaoCodigo)?.valorLoa ?? 0;
}
