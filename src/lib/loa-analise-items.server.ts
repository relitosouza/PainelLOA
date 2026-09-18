import { readFile } from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { applyAnaliseLoaSavedData, buildAnaliseLoaItems, type AnaliseLoaSavedData, type RawBudgetItem } from "@/lib/loa-analise-items";
import { buildNomenclaturaMap } from "@/lib/nomenclatura-map";

/**
 * Linhas da Análise LOA exatamente como a tela as monta: planilha base (public/loa_new.xlsx),
 * nomenclaturas oficiais e os dados salvos do painel (inclusões, exclusões, valores, subelementos e reajustes).
 */
export async function loadAnaliseLoaItems(): Promise<RawBudgetItem[]> {
  const file = await readFile(path.join(process.cwd(), "public", "loa_new.xlsx"));
  const workbook = XLSX.read(file, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

  const nomenclaturas = await db.nomenclaturaDespesa.findMany({ select: { codigo: true, codigoFormatado: true, descricao: true } });
  const configs = await db.painelConfig.findMany({
    where: {
      chave: {
        in: [
          "painel_loa_added_expenses",
          "painel_loa_removed_expenses",
          "painel_loa_custom_edits",
          "painel_loa_subelement_edits",
          "painel_loa_reajustes_aditamentos",
        ],
      },
    },
  });
  const valor = (chave: string) => configs.find((config) => config.chave === chave)?.valor;
  const asRecord = <T,>(value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? (value as T) : undefined);

  const saved: AnaliseLoaSavedData = {
    addedExpenses: Array.isArray(valor("painel_loa_added_expenses")) ? (valor("painel_loa_added_expenses") as unknown as RawBudgetItem[]) : [],
    removedIds: Array.isArray(valor("painel_loa_removed_expenses")) ? (valor("painel_loa_removed_expenses") as unknown as string[]) : [],
    customEdits: asRecord<Record<string, number>>(valor("painel_loa_custom_edits")),
    subelementEdits: asRecord<Record<string, Partial<RawBudgetItem>>>(valor("painel_loa_subelement_edits")),
    financialEdits: asRecord<NonNullable<AnaliseLoaSavedData["financialEdits"]>>(valor("painel_loa_reajustes_aditamentos")),
  };

  return applyAnaliseLoaSavedData(buildAnaliseLoaItems(rows, buildNomenclaturaMap(nomenclaturas)), saved);
}
