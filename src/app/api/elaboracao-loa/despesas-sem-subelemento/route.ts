import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

type ExpenseWithoutSubelement = {
  id: string;
  secretaria: string;
  acaoCodigo: string;
  acaoNome: string;
  natureza: string;
  elemento: string;
  vinculo: string;
  processo: string;
  valorLoa: number;
  quantidadeRegistros: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const actionCode = searchParams.get("action")?.trim();
    const secretariat = searchParams.get("secretariat")?.trim().toLowerCase();
    if (!actionCode) return NextResponse.json({ items: [] });

    const workbook = XLSX.read(fs.readFileSync(path.join(process.cwd(), "public", "loa_new.xlsx")), { type: "buffer", cellDates: false });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true, defval: "" });
    const grouped = new Map<string, ExpenseWithoutSubelement>();
    rows.slice(1).forEach((row) => {
      const piece = String(row[18] ?? "").trim().toUpperCase();
      const rawAction = String(row[13] ?? "").trim();
      const rawSecretariat = String(row[8] ?? "").trim();
      const subelement = String(row[15] ?? "").trim();
      if (piece !== "LOA" || subelement || rawAction.split("-")[0].trim() !== actionCode) return;
      if (secretariat && !rawSecretariat.toLowerCase().includes(secretariat)) return;
      const nature = String(row[14] ?? "").trim();
      const natureCode = nature.split("-")[0].trim();
      const element = natureCode.split(".").slice(0, 4).join(".");
      const vinculo = String(row[19] ?? "").trim();
      const processo = String(row[16] ?? "").trim();
      const id = [rawSecretariat, rawAction, nature, vinculo, processo, ""].join("|");
      const existing = grouped.get(id);
      const value = Number(row[17]) || 0;
      if (existing) {
        existing.valorLoa += value;
        existing.quantidadeRegistros += 1;
      } else {
        grouped.set(id, { id, secretaria: rawSecretariat, acaoCodigo: actionCode, acaoNome: rawAction.replace(/^\S+\s*[-–—]\s*/, ""), natureza: nature, elemento: element, vinculo, processo, valorLoa: value, quantidadeRegistros: 1 });
      }
    });
    return NextResponse.json({ items: [...grouped.values()] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível carregar as despesas sem subelemento." }, { status: 500 });
  }
}
