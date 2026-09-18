import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { normalizeActionLabel } from "@/lib/loa-labels";

type FinancialItem = { valLoa: number; valorReajuste?: number; valorAditamento?: number };

async function getConfig<T>(chave: string, fallback: T): Promise<T> {
  const row = await db.painelConfig.findUnique({ where: { chave } });
  return (row?.valor as T | undefined) ?? fallback;
}

async function getNomenclatureMap() {
  const items = await db.nomenclaturaDespesa.findMany({ select: { codigo: true, codigoFormatado: true, descricao: true } });
  const map: Record<string, string> = {};
  items.forEach((item) => {
    if (item.codigo) map[item.codigo] = item.descricao;
    if (item.codigoFormatado) map[item.codigoFormatado] = item.descricao;
    const parts = item.codigoFormatado.split(".");
    if (parts.length === 5) map[parts.slice(0, 4).join(".")] = item.descricao;
  });
  return map;
}

/**
 * Reproduz o "Valor Previsto LOA" (despesa) da Análise LOA sem filtros:
 * planilha loa_new.xlsx agrupada pela mesma chave, com despesas adicionadas,
 * exclusões, edições de valor, reajustes e aditamentos salvos no banco.
 */
export async function getValorPrevistoLoaDespesa(): Promise<number | null> {
  const filePath = path.join(process.cwd(), "public", "loa_new.xlsx");
  if (!fs.existsSync(filePath)) return null;

  const nomMap = await getNomenclatureMap();
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  const headers = (rows[0] ?? []) as unknown[];
  const findCol = (...aliases: string[]) => {
    for (let idx = headers.length - 1; idx >= 0; idx--) {
      if (aliases.includes(String(headers[idx] ?? "").toLowerCase().trim())) return idx;
    }
    return -1;
  };
  const col = {
    piece: findCol("peça orçamentária", "peca orcamentaria", "peça", "peca"),
    organ: findCol("secretaria", "orgao", "órgão", "secretaria_nome"),
    program: findCol("programa", "cd_programa-ds_programa"),
    action: findCol("acao", "ação", "cd_ação-ds_ação", "cd_acao-ds_acao"),
    nature: findCol("natureza", "natureza de despesa", "natureza da despesa"),
    subelement: findCol("desc_sub", "desc sub", "subelemento", "descrição subelemento", "descricao subelemento"),
    process: findCol("processo", "processo administrativo", "proc.", "proc", "processo_administrativo"),
    value: findCol("valor", "val_loa", "valor loa", "valor_loa"),
    link: findCol("vínculo", "vinculo", "fonte", "fonte de recursos", "fonte/vínculo", "fonte/vinculo"),
    appCode: findCol("codigo_aplicacao", "cod_aplicacao", "codigo de aplicacao", "código de aplicação", "cod. aplicacao", "cod aplicacao", "aplicacao", "aplicação", "cd_aplicacao"),
  };
  const cell = (row: unknown[], index: number) => (index >= 0 ? String(row[index] || "").trim().replace(/^\.+/, "") : "");

  const items = new Map<string, FinancialItem>();
  for (const row of rows.slice(1)) {
    if (!row?.length) continue;
    const piece = String(row[col.piece] || "").trim().toUpperCase();
    if (piece !== "LOA" && piece !== "LDO") continue;

    let organ = cell(row, col.organ).replace(/^(\d+)\s*-\s*/, (_match, code: string) => `${code.padStart(2, "0")} - `);
    if (organ === "01- CMO") organ = "01 - CMO";
    const program = cell(row, col.program);
    const action = normalizeActionLabel(cell(row, col.action));
    if (!organ && !program && !action) continue;

    let nature = cell(row, col.nature).replace(/\.\./g, ".")
      .replace(/^3\.50\.39/, "3.3.50.39").replace(/^3\.90\.35/, "3.3.90.35").replace(/^4\.90\.52/, "4.4.90.52");
    const natCode = nature.split("-")[0].trim();
    const officialDesc = nomMap[natCode] || nomMap[natCode.replace(/\D/g, "")];
    if (officialDesc) nature = `${natCode} - ${officialDesc}`;

    const rawLink = String(row[col.link] || "").trim();
    let fonte = rawLink;
    let appCode: string | undefined = col.appCode >= 0 ? String(row[col.appCode] || "").trim() || undefined : undefined;
    if (rawLink.includes(".") && !appCode) {
      const parts = rawLink.split(".");
      if (parts.length >= 2) { fonte = parts[0]; appCode = parts.slice(1).join("."); }
    }
    const natParts = natCode.split(".");
    const vinculo = fonte || (natParts[3] ? `${natParts[2]}.${natParts[3]}` : "Tesouro / Próprio");

    const key = `${organ}|${action}|${nature}|${vinculo}|${appCode || ""}|${cell(row, col.process)}|${cell(row, col.subelement)}`;
    const item = items.get(key) ?? { valLoa: 0 };
    if (piece === "LOA") item.valLoa += Number(row[col.value]) || 0;
    items.set(key, item);
  }

  const added = await getConfig<Array<FinancialItem & { id: string }>>("painel_loa_added_expenses", []);
  if (Array.isArray(added)) added.forEach((item) => items.set(item.id, { ...item }));

  const removed = await getConfig<string[]>("painel_loa_removed_expenses", []);
  if (Array.isArray(removed)) removed.forEach((id) => items.delete(id));

  const customEdits = await getConfig<Record<string, number | { valorLoa?: number }>>("painel_loa_custom_edits", {});
  Object.entries(customEdits ?? {}).forEach(([id, value]) => {
    const item = items.get(id);
    if (item) {
      const num =
        typeof value === "number"
          ? value
          : typeof value === "object" && value !== null && "valorLoa" in value
          ? Number((value as { valorLoa?: number }).valorLoa)
          : Number(value);
      item.valLoa = isNaN(num) ? item.valLoa : num;
    }
  });

  const financialEdits = await getConfig<Record<string, { valorReajuste?: number; valorAditamento?: number }>>("painel_loa_reajustes_aditamentos", {});
  Object.entries(financialEdits ?? {}).forEach(([id, edit]) => { const item = items.get(id); if (item) Object.assign(item, edit); });

  let total = 0;
  items.forEach((item) => { total += (Number(item.valLoa) || 0) + (Number(item.valorReajuste) || 0) + (Number(item.valorAditamento) || 0); });
  return total;
}
