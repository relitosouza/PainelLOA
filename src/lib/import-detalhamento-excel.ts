import * as XLSX from "xlsx";
import type { RawBudgetItem } from "@/lib/loa-analise-items";

export interface ItemChangeSummary {
  itemId: string;
  identificador: string;
  acao: string;
  natureza: string;
  subelemento: string;
  campo: string;
  antigo: string | number;
  novo: string | number;
}

export interface ImportDetalhamentoResult {
  success: boolean;
  totalLinhasLidas: number;
  correspondencias: number;
  itensModificados: number;
  alteracoes: ItemChangeSummary[];
  updatedRawItems: RawBudgetItem[];
  financialEdits: Record<string, { valorReajuste?: number; valorAditamento?: number; valorSugestaoSf?: number; valorCorteGp?: number }>;
  customEdits: Record<string, { valorLoa?: number; valorLdo?: number; status?: string }>;
  subelementEdits: Record<string, Partial<RawBudgetItem>>;
  justifications: Record<string, string>;
  validatedRows: Record<string, boolean>;
  warnings: string[];
}

/**
 * Converte valores vindos de planilhas (números ou strings com R$, pontos e vírgulas) em número float
 */
export function parseExcelNumber(value: unknown): number {
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }
  if (!value) return 0;
  const str = String(value)
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(,|$|\.))/g, "") // remove pontos de milhar
    .replace(",", "."); // converte vírgula decimal
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Normaliza textos para comparação e casamento
 */
function normalizeString(val: unknown): string {
  if (!val) return "";
  return String(val).trim().toLowerCase();
}

/**
 * Gera uma chave única funcional-programática para correspondência resiliente
 */
export function generateMatchingKey(item: {
  secretaria?: string;
  programa?: string;
  acao?: string;
  natureza?: string;
  elemento?: string;
  subelemento?: string;
  fonteVinculo?: string;
}): string {
  const sec = normalizeString(item.secretaria).replace(/^\d+\s*-\s*/, "");
  const prog = normalizeString(item.programa).replace(/^\d+\s*-\s*/, "");
  const acao = normalizeString(item.acao).replace(/^[\d.]+\s*-\s*/, "");
  const nat = normalizeString(item.natureza || item.elemento).replace(/^[\d.]+\s*-\s*/, "");
  const sub = normalizeString(item.subelemento);
  return `${sec}|${prog}|${acao}|${nat}|${sub}`;
}

/**
 * Processa a planilha Excel (ArrayBuffer ou buffer) e reconcilia com os itens atuais do sistema
 */
export function processDetalhamentoWorkbook(
  fileBuffer: ArrayBuffer | Uint8Array,
  currentItems: RawBudgetItem[],
  currentValidatedRows: Record<string, boolean> = {},
  currentJustifications: Record<string, string> = {}
): ImportDetalhamentoResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  
  // Buscar a aba: priorizar "Detalhamento_LOA_Completo", depois fallback para "Detalhamento_Geral", depois 1ª aba
  let sheetName = workbook.SheetNames.find((name) =>
    name.toLowerCase().includes("detalhamento_loa_completo")
  );
  if (!sheetName) {
    sheetName = workbook.SheetNames.find((name) =>
      name.toLowerCase().includes("detalhamento")
    );
  }
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }

  if (!sheetName || !workbook.Sheets[sheetName]) {
    return {
      success: false,
      totalLinhasLidas: 0,
      correspondencias: 0,
      itensModificados: 0,
      alteracoes: [],
      updatedRawItems: currentItems,
      financialEdits: {},
      customEdits: {},
      subelementEdits: {},
      justifications: currentJustifications,
      validatedRows: currentValidatedRows,
      warnings: ["Nenhuma planilha válida foi encontrada no arquivo Excel."],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (!rows || rows.length === 0) {
    return {
      success: false,
      totalLinhasLidas: 0,
      correspondencias: 0,
      itensModificados: 0,
      alteracoes: [],
      updatedRawItems: currentItems,
      financialEdits: {},
      customEdits: {},
      subelementEdits: {},
      justifications: currentJustifications,
      validatedRows: currentValidatedRows,
      warnings: ["A aba selecionada não possui registros de dados."],
    };
  }

  // Criar mapas de busca para casamento eficiente
  const byIdMap = new Map<string, RawBudgetItem>();
  const byCompositeKeyMap = new Map<string, RawBudgetItem>();
  const byActionElementMap = new Map<string, RawBudgetItem[]>();

  currentItems.forEach((item) => {
    byIdMap.set(item.id, item);
    const compKey = generateMatchingKey(item);
    if (!byCompositeKeyMap.has(compKey)) {
      byCompositeKeyMap.set(compKey, item);
    }
    const actElemKey = `${normalizeString(item.acao)}|${normalizeString(item.elemento || item.natureza)}|${normalizeString(item.subelemento)}`;
    const group = byActionElementMap.get(actElemKey) || [];
    group.push(item);
    byActionElementMap.set(actElemKey, group);
  });

  const alteracoes: ItemChangeSummary[] = [];
  const updatedItemsMap = new Map<string, RawBudgetItem>(currentItems.map((i) => [i.id, { ...i }]));
  const financialEdits: Record<string, { valorReajuste?: number; valorAditamento?: number; valorSugestaoSf?: number; valorCorteGp?: number }> = {};
  const customEdits: Record<string, { valorLoa?: number; valorLdo?: number; status?: string }> = {};
  const subelementEdits: Record<string, Partial<RawBudgetItem>> = {};
  const newJustifications = { ...currentJustifications };
  const newValidatedRows = { ...currentValidatedRows };
  const warnings: string[] = [];

  let correspondencias = 0;
  const modifiedItemIds = new Set<string>();

  rows.forEach((row, rowIndex) => {
    // 1. Identificar o item do sistema correspondente a esta linha da planilha
    const rowId = String(row["ID"] || row["ID do Registro"] || row["Código do Item"] || "").trim();
    let targetItem: RawBudgetItem | undefined;

    if (rowId && byIdMap.has(rowId)) {
      targetItem = updatedItemsMap.get(rowId);
    }

    if (!targetItem) {
      // Tentar correspondência composta: Secretaria + Programa + Ação + Natureza/Elemento + Subelemento
      const compKey = generateMatchingKey({
        secretaria: String(row["Secretaria"] || row["Cód. Secretaria"] || ""),
        programa: String(row["Programa"] || ""),
        acao: String(row["Ação"] || ""),
        natureza: String(row["Natureza da Despesa"] || row["Elemento de Despesa"] || ""),
        subelemento: String(row["Subelemento"] || ""),
      });
      const match = byCompositeKeyMap.get(compKey);
      if (match) {
        targetItem = updatedItemsMap.get(match.id);
      }
    }

    if (!targetItem) {
      // Fallback: Ação + Elemento + Subelemento
      const actElemKey = `${normalizeString(row["Ação"])}|${normalizeString(row["Elemento de Despesa"] || row["Natureza da Despesa"])}|${normalizeString(row["Subelemento"])}`;
      const candidates = byActionElementMap.get(actElemKey);
      if (candidates && candidates.length > 0) {
        targetItem = updatedItemsMap.get(candidates[0].id);
      }
    }

    if (!targetItem) {
      warnings.push(`Linha ${rowIndex + 2}: Registro não correspondido no sistema (${row["Ação"] || "Ação não informada"} - ${row["Elemento de Despesa"] || row["Natureza da Despesa"] || ""}).`);
      return;
    }

    correspondencias++;
    const currentItemState = { ...targetItem };
    let hasItemChange = false;

    // 2. Extrair e verificar campos de valores
    const excelValLoa = row["Valor LOA Vigente (R$)"] !== undefined && row["Valor LOA Vigente (R$)"] !== ""
      ? parseExcelNumber(row["Valor LOA Vigente (R$)"])
      : undefined;
    const excelReajuste = row["Valor Reajuste (R$)"] !== undefined && row["Valor Reajuste (R$)"] !== ""
      ? parseExcelNumber(row["Valor Reajuste (R$)"])
      : undefined;
    const excelAditamento = row["Valor Aditamento (R$)"] !== undefined && row["Valor Aditamento (R$)"] !== ""
      ? parseExcelNumber(row["Valor Aditamento (R$)"])
      : undefined;
    const excelSugestaoSf = row["Valor Sugestão SF (R$)"] !== undefined && row["Valor Sugestão SF (R$)"] !== ""
      ? parseExcelNumber(row["Valor Sugestão SF (R$)"])
      : undefined;
    const excelCorteGp = row["Valor Corte GP (R$)"] !== undefined && row["Valor Corte GP (R$)"] !== ""
      ? parseExcelNumber(row["Valor Corte GP (R$)"])
      : undefined;

    // Atualização de Valor Vigente
    if (excelValLoa !== undefined && Math.abs(excelValLoa - currentItemState.valLoa) > 0.001) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Valor Vigente",
        antigo: currentItemState.valLoa,
        novo: excelValLoa,
      });
      targetItem.valLoa = excelValLoa;
      customEdits[targetItem.id] = {
        valorLoa: excelValLoa,
        valorLdo: targetItem.valLdo,
        status: "EDITADO_EXCEL",
      };
      hasItemChange = true;
    }

    // Atualização de Reajuste
    if (excelReajuste !== undefined && Math.abs(excelReajuste - (currentItemState.valorReajuste ?? 0)) > 0.001) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Reajuste",
        antigo: currentItemState.valorReajuste ?? 0,
        novo: excelReajuste,
      });
      targetItem.valorReajuste = excelReajuste;
      hasItemChange = true;
    }

    // Atualização de Aditamento
    if (excelAditamento !== undefined && Math.abs(excelAditamento - (currentItemState.valorAditamento ?? 0)) > 0.001) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Aditamento",
        antigo: currentItemState.valorAditamento ?? 0,
        novo: excelAditamento,
      });
      targetItem.valorAditamento = excelAditamento;
      hasItemChange = true;
    }

    // Atualização de Sugestão SF
    if (excelSugestaoSf !== undefined && Math.abs(excelSugestaoSf - (currentItemState.valorSugestaoSf ?? 0)) > 0.001) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Sugestão SF",
        antigo: currentItemState.valorSugestaoSf ?? 0,
        novo: excelSugestaoSf,
      });
      targetItem.valorSugestaoSf = excelSugestaoSf;
      hasItemChange = true;
    }

    // Atualização de Corte GP
    if (excelCorteGp !== undefined && Math.abs(excelCorteGp - (currentItemState.valorCorteGp ?? 0)) > 0.001) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Corte GP",
        antigo: currentItemState.valorCorteGp ?? 0,
        novo: excelCorteGp,
      });
      targetItem.valorCorteGp = excelCorteGp;
      hasItemChange = true;
    }

    if (hasItemChange) {
      financialEdits[targetItem.id] = {
        valorReajuste: targetItem.valorReajuste,
        valorAditamento: targetItem.valorAditamento,
        valorSugestaoSf: targetItem.valorSugestaoSf,
        valorCorteGp: targetItem.valorCorteGp,
      };
    }

    // 3. Atualização de campos cadastrais e operacionais
    const subEdits: Partial<RawBudgetItem> = {};

    // Processo Administrativo
    const excelProcesso = row["Processo Administrativo"] !== undefined ? String(row["Processo Administrativo"]).trim() : "";
    if (excelProcesso && excelProcesso !== "—" && excelProcesso !== (currentItemState.processo || "")) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Processo",
        antigo: currentItemState.processo || "—",
        novo: excelProcesso,
      });
      targetItem.processo = excelProcesso;
      subEdits.processo = excelProcesso;
      hasItemChange = true;
    }

    // Código de Aplicação
    const excelCodigoAplicacao = row["Código de Aplicação"] !== undefined ? String(row["Código de Aplicação"]).trim() : "";
    if (excelCodigoAplicacao && excelCodigoAplicacao !== "—" && excelCodigoAplicacao !== (currentItemState.codigoAplicacao || "")) {
      targetItem.codigoAplicacao = excelCodigoAplicacao;
      subEdits.codigoAplicacao = excelCodigoAplicacao;
      hasItemChange = true;
    }

    // Contrato / Projeto Iniciado
    const excelIniciado = row["Contrato / Projeto Iniciado"] !== undefined ? String(row["Contrato / Projeto Iniciado"]).trim().toUpperCase() : "";
    if (excelIniciado && ["SIM", "NÃO", "NAO"].includes(excelIniciado)) {
      const standardIniciado = excelIniciado === "SIM" ? "SIM" : "NÃO";
      if (standardIniciado !== (currentItemState.projetoIniciado || "NÃO")) {
        targetItem.projetoIniciado = standardIniciado;
        subEdits.projetoIniciado = standardIniciado;
        hasItemChange = true;
      }
    }

    // Justificativa / Observação
    const excelObs = row["Justificativa / Observação"] !== undefined ? String(row["Justificativa / Observação"]).trim() : "";
    if (excelObs && excelObs !== "—" && excelObs !== (currentItemState.observacao || "")) {
      targetItem.observacao = excelObs;
      subEdits.observacao = excelObs;
      newJustifications[targetItem.id] = excelObs;
      hasItemChange = true;
    }

    if (Object.keys(subEdits).length > 0) {
      subelementEdits[targetItem.id] = subEdits;
    }

    // 4. Validação pelo Usuário
    const excelValidado = row["Validado pelo Usuário"] !== undefined ? String(row["Validado pelo Usuário"]).trim().toUpperCase() : "";
    if (excelValidado === "SIM" || excelValidado === "S") {
      newValidatedRows[targetItem.id] = true;
    } else if (excelValidado === "NÃO" || excelValidado === "NAO" || excelValidado === "N") {
      newValidatedRows[targetItem.id] = false;
    }

    if (hasItemChange) {
      modifiedItemIds.add(targetItem.id);
      updatedItemsMap.set(targetItem.id, targetItem);
    }
  });

  return {
    success: true,
    totalLinhasLidas: rows.length,
    correspondencias,
    itensModificados: modifiedItemIds.size,
    alteracoes,
    updatedRawItems: Array.from(updatedItemsMap.values()),
    financialEdits,
    customEdits,
    subelementEdits,
    justifications: newJustifications,
    validatedRows: newValidatedRows,
    warnings,
  };
}
