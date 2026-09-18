import * as XLSX from "xlsx";
import { type RawBudgetItem, getActionTypeLabel } from "@/lib/loa-analise-items";

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
  addedExpenses: RawBudgetItem[];
  financialEdits: Record<string, { valorReajuste?: number; valorAditamento?: number; valorSugestaoSf?: number; valorCorteGp?: number }>;
  customEdits: Record<string, number>;
  subelementEdits: Record<string, Partial<RawBudgetItem>>;
  justifications: Record<string, string>;
  validatedRows: Record<string, boolean>;
  warnings: string[];
}

/**
 * Converte valores vindos de planilhas (números ou strings com R$, pontos, parênteses e vírgulas) em número float
 */
export function parseExcelNumber(value: unknown): number {
  const parsed = parseExcelNumberOrUndefined(value);
  return parsed ?? 0;
}

/**
 * Retorna número float ou undefined se o campo estiver vazio/não preenchido
 */
export function parseExcelNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }
  if (value === undefined || value === null) return undefined;
  
  let str = String(value).trim().replace(/\u00A0/g, " ");
  if (str === "" || str === "—" || str === "-") return undefined;

  let isNegative = false;
  if (str.startsWith("(") && str.endsWith(")")) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.startsWith("-")) {
    isNegative = true;
    str = str.slice(1).trim();
  }

  // Remove caracteres de moeda e espaços
  str = str.replace(/[R$BRL\s]/gi, "");

  // Se tiver vírgula, assume formato brasileiro (pontos = milhares, vírgula = decimal)
  if (str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(".")) {
    // Se não tiver vírgula mas tiver ponto, verifica se é separador de milhar (ex: "1.500") ou decimal (ex: "1500.50")
    if (/\.\d{3}$/.test(str) && !/\.\d{1,2}$/.test(str)) {
      str = str.replace(/\./g, "");
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return undefined;
  return isNegative ? -num : num;
}

/**
 * Normaliza textos para comparação e casamento
 */
function normalizeString(val: unknown): string {
  if (!val) return "";
  return String(val).trim().toLowerCase();
}

/**
 * Normaliza chaves de colunas para busca resiliente (sem acentos, sem pontuação, minúsculas)
 */
function normalizeKey(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Busca o valor de uma coluna em uma linha de forma flexível e resiliente a variações de nomes
 */
export function findRowValue(row: Record<string, unknown>, aliases: string[]): unknown {
  // 1. Busca exata rápida
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
      return row[alias];
    }
  }

  // 2. Busca normalizada resiliente
  const rowNormalizedMap = new Map<string, unknown>();
  for (const [key, val] of Object.entries(row)) {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      rowNormalizedMap.set(normalizeKey(key), val);
    }
  }

  for (const alias of aliases) {
    const normAlias = normalizeKey(alias);
    if (rowNormalizedMap.has(normAlias)) {
      return rowNormalizedMap.get(normAlias);
    }
  }

  return undefined;
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
      addedExpenses: [],
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
      addedExpenses: [],
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
  const addedExpenses: RawBudgetItem[] = [];
  const financialEdits: Record<string, { valorReajuste?: number; valorAditamento?: number; valorSugestaoSf?: number; valorCorteGp?: number }> = {};
  const customEdits: Record<string, number> = {};
  const subelementEdits: Record<string, Partial<RawBudgetItem>> = {};
  const newJustifications = { ...currentJustifications };
  const newValidatedRows = { ...currentValidatedRows };
  const warnings: string[] = [];

  let correspondencias = 0;
  const modifiedItemIds = new Set<string>();

  rows.forEach((row, rowIndex) => {
    // 1. Extrair identificadores e dados descritivos da linha com flexibilidade
    const rowIdRaw = findRowValue(row, ["ID", "ID do Registro", "Código do Item", "Cod. Item", "Id"]);
    const rowId = rowIdRaw !== undefined ? String(rowIdRaw).trim() : "";

    const rowSecRaw = findRowValue(row, ["Secretaria", "Cód. Secretaria", "Cod. Secretaria", "Órgão", "Orgao"]);
    const rowSec = rowSecRaw !== undefined ? String(rowSecRaw).trim() : "";

    const rowProgRaw = findRowValue(row, ["Programa", "Cód. Programa", "Cod. Programa"]);
    const rowProg = rowProgRaw !== undefined ? String(rowProgRaw).trim() : "";

    const rowAcaoRaw = findRowValue(row, ["Ação", "Acao", "Cód. Ação", "Cod. Acao", "Atividade/Projeto"]);
    const rowAcao = rowAcaoRaw !== undefined ? String(rowAcaoRaw).trim() : "";

    const rowNatRaw = findRowValue(row, ["Natureza da Despesa", "Natureza", "Elemento de Despesa", "Elemento", "Cód. Natureza"]);
    const rowNat = rowNatRaw !== undefined ? String(rowNatRaw).trim() : "";

    const rowElemRaw = findRowValue(row, ["Elemento de Despesa", "Elemento"]);
    const rowElem = rowElemRaw !== undefined ? String(rowElemRaw).trim() : "";

    const rowSubRaw = findRowValue(row, ["Subelemento", "Cód. Subelemento", "Sub-elemento"]);
    const rowSub = rowSubRaw !== undefined ? String(rowSubRaw).trim() : "";

    const rowFonteRaw = findRowValue(row, ["Fonte/Vínculo", "Fonte / Vínculo", "Fonte/Vinculo", "Fonte", "Vínculo", "Vinculo", "Fonte de Recurso"]);
    const rowFonte = rowFonteRaw !== undefined ? String(rowFonteRaw).trim() : "";

    const rowCodAppRaw = findRowValue(row, ["Código de Aplicação", "Codigo de Aplicacao", "Código Aplicação", "Cod. Aplicação", "Aplicação"]);
    const rowCodApp = rowCodAppRaw !== undefined ? String(rowCodAppRaw).trim() : "";

    const rowProcessoRaw = findRowValue(row, ["Processo Administrativo", "Processo Adm", "Processo", "Nº Processo"]);
    const rowProcesso = rowProcessoRaw !== undefined ? String(rowProcessoRaw).trim() : "";

    const rowIniciadoRaw = findRowValue(row, ["Contrato / Projeto Iniciado", "Projeto Iniciado", "Contrato", "Iniciado"]);
    const rowIniciado = rowIniciadoRaw !== undefined ? String(rowIniciadoRaw).trim() : "";

    const rowObsRaw = findRowValue(row, ["Justificativa / Observação", "Justificativa / Observacao", "Justificativa", "Observação", "Observacao"]);
    const rowObs = rowObsRaw !== undefined ? String(rowObsRaw).trim() : "";

    const rowValidadoRaw = findRowValue(row, ["Validado pelo Usuário", "Validado pelo Usuario", "Validado"]);
    const rowValidado = rowValidadoRaw !== undefined ? String(rowValidadoRaw).trim() : "";

    // Valores Financeiros com correspondência ampla
    const excelValLoa = parseExcelNumberOrUndefined(
      findRowValue(row, ["Valor LOA Vigente (R$)", "Valor LOA Vigente", "LOA Vigente (R$)", "LOA Vigente", "Valor Vigente (R$)", "Valor Vigente", "Vigente"])
    );
    const excelReajuste = parseExcelNumberOrUndefined(
      findRowValue(row, ["Valor Reajuste (R$)", "Valor Reajuste", "Reajuste (R$)", "Reajuste"])
    );
    const excelAditamento = parseExcelNumberOrUndefined(
      findRowValue(row, ["Valor Aditamento (R$)", "Valor Aditamento", "Aditamento (R$)", "Aditamento"])
    );
    const excelSugestaoSf = parseExcelNumberOrUndefined(
      findRowValue(row, ["Valor Sugestão SF (R$)", "Valor Sugestão SF", "Valor Sugestao SF", "Sugestão SF (R$)", "Sugestão SF", "Sugestao SF"])
    );
    const excelCorteGp = parseExcelNumberOrUndefined(
      findRowValue(row, ["Valor Corte GP (R$)", "Valor Corte GP", "Corte GP (R$)", "Corte GP"])
    );
    const excelValTotal = parseExcelNumberOrUndefined(
      findRowValue(row, [
        "Valor Total LOA 2027 (R$)",
        "Valor Total LOA 2027",
        "Valor Total (R$)",
        "Valor Total",
        "Total LOA 2027 (R$)",
        "Total LOA 2027",
        "Total LOA (R$)",
        "Total LOA",
        "Total (R$)",
        "Total",
        "LOA 2027 (R$)",
        "LOA 2027"
      ])
    );
    const excelValLdo = parseExcelNumberOrUndefined(
      findRowValue(row, ["Valor Original LDO (R$)", "Valor LDO (R$)", "Valor LDO", "LDO (R$)", "LDO"])
    );

    // 2. Identificar item existente
    let targetItem: RawBudgetItem | undefined;

    if (rowId && byIdMap.has(rowId)) {
      targetItem = updatedItemsMap.get(rowId);
    }

    if (!targetItem && (rowSec || rowProg || rowAcao || rowNat || rowSub)) {
      const compKey = generateMatchingKey({
        secretaria: rowSec,
        programa: rowProg,
        acao: rowAcao,
        natureza: rowNat || rowElem,
        subelemento: rowSub,
      });
      const match = byCompositeKeyMap.get(compKey);
      if (match) {
        targetItem = updatedItemsMap.get(match.id);
      }
    }

    if (!targetItem && rowAcao && (rowElem || rowNat)) {
      const actElemKey = `${normalizeString(rowAcao)}|${normalizeString(rowElem || rowNat)}|${normalizeString(rowSub)}`;
      const candidates = byActionElementMap.get(actElemKey);
      if (candidates && candidates.length > 0) {
        targetItem = updatedItemsMap.get(candidates[0].id);
      }
    }

    // 3. Se NÃO foi encontrado item existente: verificar se é uma NOVA LINHA ("adicionei valores")
    if (!targetItem) {
      const hasBudgetIdentifiers = Boolean(rowAcao || rowSec || rowNat);
      const hasFinancialData =
        excelValLoa !== undefined ||
        excelValTotal !== undefined ||
        excelReajuste !== undefined ||
        excelAditamento !== undefined ||
        excelSugestaoSf !== undefined ||
        excelCorteGp !== undefined;

      // Linha completamente vazia na planilha: ignorar silenciosamente
      if (!hasBudgetIdentifiers && !hasFinancialData && !rowSub) {
        return;
      }

      // Se tem dados de ação ou dotação, trata como inclusão de nova dotação/despesa
      if (hasBudgetIdentifiers || hasFinancialData) {
        const newId =
          rowId && !byIdMap.has(rowId)
            ? rowId
            : `manual-import-${Date.now()}-${rowIndex}`;

        const actionStr = rowAcao || "Ação Não Especificada";
        const secStr = rowSec || "02 - ADMINISTRAÇÃO DIRETA";
        const natStr = rowNat || rowElem || "3.3.90.39.00 - Outros Serviços de Terceiros";
        const elemStr = rowElem || natStr.split("-")[0].trim().split(".").slice(0, 4).join(".") || "3.3.90.39";
        const subStr = rowSub || "00 - Geral";

        const rVal = excelReajuste ?? 0;
        const aVal = excelAditamento ?? 0;
        let finalValLoa = 0;
        if (excelValLoa !== undefined) {
          finalValLoa = excelValLoa;
        } else if (excelValTotal !== undefined) {
          finalValLoa = Math.max(0, excelValTotal - rVal - aVal);
        }

        const newItem: RawBudgetItem = {
          id: newId,
          progKey: `${actionStr}|${elemStr}|${subStr}`,
          secretaria: secStr,
          orgao: String(findRowValue(row, ["Órgão", "Orgao"]) || secStr).trim(),
          unidade: String(findRowValue(row, ["Unidade Orçamentária", "Unidade", "Cód. Unidade"]) || secStr).trim(),
          funcao: String(findRowValue(row, ["Função", "Funcao", "Cód. Função"]) || "").trim(),
          subfuncao: String(findRowValue(row, ["Subfunção", "Subfuncao", "Cód. Subfunção"]) || "").trim(),
          programaticaLoa: String(findRowValue(row, ["Programática LOA", "Programatica LOA"]) || "").trim(),
          programa: rowProg || "Geral",
          tipoAcao: getActionTypeLabel(actionStr),
          acao: actionStr,
          natureza: natStr,
          elemento: elemStr,
          subelemento: subStr,
          fonteVinculo: rowFonte || "01",
          codigoAplicacao: rowCodApp || undefined,
          categoriaEconomica: natStr.startsWith("4") ? "4 — DESPESAS DE CAPITAL" : "3 — DESPESAS CORRENTES",
          grupoNatureza: natStr.slice(0, 3),
          processo: rowProcesso || "—",
          projetoIniciado: rowIniciado ? (["SIM", "S"].includes(rowIniciado.toUpperCase()) ? "SIM" : "NÃO") : "NÃO",
          observacao: rowObs || undefined,
          valLdo: excelValLdo ?? 0,
          valLoa: finalValLoa,
          valLoa2026: 0,
          valorReajuste: rVal,
          valorAditamento: aVal,
          valorSugestaoSf: excelSugestaoSf ?? 0,
          valorCorteGp: excelCorteGp ?? 0,
          origem: "Importado Excel",
        };

        addedExpenses.push(newItem);
        updatedItemsMap.set(newItem.id, newItem);
        byIdMap.set(newItem.id, newItem);

        customEdits[newItem.id] = newItem.valLoa;
        financialEdits[newItem.id] = {
          valorReajuste: newItem.valorReajuste,
          valorAditamento: newItem.valorAditamento,
          valorSugestaoSf: newItem.valorSugestaoSf,
          valorCorteGp: newItem.valorCorteGp,
        };

        if (newItem.observacao) {
          newJustifications[newItem.id] = newItem.observacao;
        }

        if (rowValidado) {
          const vUpper = rowValidado.toUpperCase();
          newValidatedRows[newItem.id] = ["SIM", "S"].includes(vUpper);
        }

        const totalLinhaNova = newItem.valLoa + (newItem.valorReajuste || 0) + (newItem.valorAditamento || 0);
        alteracoes.push({
          itemId: newItem.id,
          identificador: newItem.progKey,
          acao: newItem.acao,
          natureza: newItem.natureza,
          subelemento: newItem.subelemento,
          campo: "Novo Registro Adicionado",
          antigo: 0,
          novo: totalLinhaNova,
        });

        correspondencias++;
        modifiedItemIds.add(newItem.id);
        return;
      }

      warnings.push(`Linha ${rowIndex + 2}: Registro não correspondido no sistema (${rowAcao || "Ação não informada"} - ${rowNat || rowElem || ""}).`);
      return;
    }

    // 4. Registro existente encontrado: reconciliar e detectar alterações
    correspondencias++;
    const currentItemState = { ...targetItem };
    let hasItemChange = false;

    // Atualização de Valor LOA Vigente
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
      customEdits[targetItem.id] = excelValLoa; // IMPORTANTE: número puro!
      hasItemChange = true;
    } else if (excelValLoa === undefined && excelValTotal !== undefined) {
      // Caso o usuário tenha editado diretamente a coluna de Valor Total LOA 2027
      const currentTotal =
        currentItemState.valLoa +
        (currentItemState.valorReajuste ?? 0) +
        (currentItemState.valorAditamento ?? 0);

      if (Math.abs(excelValTotal - currentTotal) > 0.001) {
        const rVal = excelReajuste !== undefined ? excelReajuste : (currentItemState.valorReajuste ?? 0);
        const aVal = excelAditamento !== undefined ? excelAditamento : (currentItemState.valorAditamento ?? 0);
        const derivedValLoa = Math.max(0, Math.round((excelValTotal - rVal - aVal) * 100) / 100);

        alteracoes.push({
          itemId: targetItem.id,
          identificador: targetItem.progKey || targetItem.id,
          acao: targetItem.acao,
          natureza: targetItem.natureza || targetItem.elemento,
          subelemento: targetItem.subelemento,
          campo: "Valor Total LOA 2027",
          antigo: currentTotal,
          novo: excelValTotal,
        });

        targetItem.valLoa = derivedValLoa;
        customEdits[targetItem.id] = derivedValLoa;
        hasItemChange = true;
      }
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

    // 5. Atualização de campos cadastrais e operacionais
    const subEdits: Partial<RawBudgetItem> = {};

    // Processo Administrativo
    if (rowProcesso && rowProcesso !== "—" && rowProcesso !== (currentItemState.processo || "")) {
      alteracoes.push({
        itemId: targetItem.id,
        identificador: targetItem.progKey || targetItem.id,
        acao: targetItem.acao,
        natureza: targetItem.natureza || targetItem.elemento,
        subelemento: targetItem.subelemento,
        campo: "Processo",
        antigo: currentItemState.processo || "—",
        novo: rowProcesso,
      });
      targetItem.processo = rowProcesso;
      subEdits.processo = rowProcesso;
      hasItemChange = true;
    }

    // Código de Aplicação
    if (rowCodApp && rowCodApp !== "—" && rowCodApp !== (currentItemState.codigoAplicacao || "")) {
      targetItem.codigoAplicacao = rowCodApp;
      subEdits.codigoAplicacao = rowCodApp;
      hasItemChange = true;
    }

    // Contrato / Projeto Iniciado
    if (rowIniciado && ["SIM", "NÃO", "NAO", "S", "N"].includes(rowIniciado.toUpperCase())) {
      const standardIniciado = ["SIM", "S"].includes(rowIniciado.toUpperCase()) ? "SIM" : "NÃO";
      if (standardIniciado !== (currentItemState.projetoIniciado || "NÃO")) {
        targetItem.projetoIniciado = standardIniciado;
        subEdits.projetoIniciado = standardIniciado;
        hasItemChange = true;
      }
    }

    // Justificativa / Observação
    if (rowObs && rowObs !== "—" && rowObs !== (currentItemState.observacao || "")) {
      targetItem.observacao = rowObs;
      subEdits.observacao = rowObs;
      newJustifications[targetItem.id] = rowObs;
      hasItemChange = true;
    }

    if (Object.keys(subEdits).length > 0) {
      subelementEdits[targetItem.id] = subEdits;
    }

    // 6. Validação pelo Usuário
    if (rowValidado) {
      const vUpper = rowValidado.toUpperCase();
      if (["SIM", "S"].includes(vUpper)) {
        newValidatedRows[targetItem.id] = true;
      } else if (["NÃO", "NAO", "N"].includes(vUpper)) {
        newValidatedRows[targetItem.id] = false;
      }
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
    addedExpenses,
    financialEdits,
    customEdits,
    subelementEdits,
    justifications: newJustifications,
    validatedRows: newValidatedRows,
    warnings,
  };
}
