import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

let cachedNames: Map<string, string> | null = null;

function normalizeCode(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? digits.padStart(2, "0") : "";
}

export function getLoaSecretariatNames() {
  if (cachedNames) return cachedNames;
  const names = new Map<string, string>();
  try {
    const filePath = path.join(process.cwd(), "public", "loa_new.xlsx");
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer", cellDates: false });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true, defval: "" });
    rows.slice(1).forEach((row) => {
      const code = normalizeCode(row[0]);
      const rawName = String(row[8] ?? "").replace(/\s+/g, " ").trim();
      if (!code || !rawName) return;
      const name = rawName.replace(/^\d+\s*[-–—]\s*/, "").trim();
      if (name) names.set(code, name);
    });
  } catch (error) {
    console.warn("Não foi possível carregar os nomes das secretarias da LOA:", error);
  }
  cachedNames = names;
  return names;
}
