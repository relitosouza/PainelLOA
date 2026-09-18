import * as XLSX from "xlsx";

export interface LoaReceitaRowRaw {
  codigoReceita: string;
  naturezaReceita: string;
  descricaoReceita: string;
  fonteRecurso: string;
  descricaoFonte: string;
  orgaoUnidade: string;
  valor: number;
  linhaOrigem: number;
  situacaoValidacao: "VÁLIDO" | "ALERTA" | "DUPLICADO" | "INVALIDO";
  mensagemValidacao?: string;
}

export interface LoaReceitaParseResult {
  records: LoaReceitaRowRaw[];
  colunasEncontradas: {
    codigoReceita: string | null;
    naturezaReceita: string | null;
    descricaoReceita: string | null;
    fonteRecurso: string | null;
    descricaoFonte: string | null;
    orgaoUnidade: string | null;
    valor: string | null;
  };
  totalLinhas: number;
  registrosValidos: number;
  registrosComAlerta: number;
  registrosInvalidos: number;
  registrosDuplicados: number;
  valorTotalLoa: number;
  fontesUnicas: number;
  naturezasUnicas: number;
  hasRequiredFields: boolean;
  missingFields: string[];
}

function normalizeHeader(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

export function parseMonetaryValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  let str = String(val).trim();
  if (!str) return null;

  // Remover R$, espaços e caracteres invisíveis
  str = str.replace(/R\$\s?/gi, "").trim();

  // Tratamento de parênteses para números negativos: (100,00) -> -100.00
  const isNegative = /^\(.*\)$/.test(str) || str.startsWith("-");
  str = str.replace(/[()\-]/g, "").trim();

  // Detectar padrão brasileiro (ex: 1.250.000,50 ou 1250,50) vs americano (1,250,000.50)
  if (str.includes(",") && str.includes(".")) {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Formato brasileiro: pontos são milhares, vírgula decimal
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato americano
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }

  const num = parseFloat(str);
  if (isNaN(num)) return null;
  return isNegative ? -num : num;
}

export function parseLoaReceitaWorkbook(buffer: ArrayBuffer): LoaReceitaParseResult {
  const workbook = XLSX.read(buffer, { type: "array", raw: true, cellText: true });
  let sheetName = workbook.SheetNames[0];

  // Procurar por aba que contenha dados e não instruções
  const dataSheetName = workbook.SheetNames.find(
    (name) => !/instru[çc][õo]es|ajuda|info|help|readme/i.test(name.trim())
  );
  if (dataSheetName) {
    sheetName = dataSheetName;
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      records: [],
      colunasEncontradas: {
        codigoReceita: null,
        naturezaReceita: null,
        descricaoReceita: null,
        fonteRecurso: null,
        descricaoFonte: null,
        orgaoUnidade: null,
        valor: null,
      },
      totalLinhas: 0,
      registrosValidos: 0,
      registrosComAlerta: 0,
      registrosInvalidos: 0,
      registrosDuplicados: 0,
      valorTotalLoa: 0,
      fontesUnicas: 0,
      naturezasUnicas: 0,
      hasRequiredFields: false,
      missingFields: ["NATUREZA_RECEITA", "FONTE_RECURSO", "VALOR"],
    };
  }

  const rowsRaw = XLSX.utils.sheet_to_json(sheet, { raw: true, header: 1 }) as unknown[][];
  const rowsFormatted = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 }) as string[][];

  if (!rowsRaw || rowsRaw.length === 0) {
    return {
      records: [],
      colunasEncontradas: {
        codigoReceita: null,
        naturezaReceita: null,
        descricaoReceita: null,
        fonteRecurso: null,
        descricaoFonte: null,
        orgaoUnidade: null,
        valor: null,
      },
      totalLinhas: 0,
      registrosValidos: 0,
      registrosComAlerta: 0,
      registrosInvalidos: 0,
      registrosDuplicados: 0,
      valorTotalLoa: 0,
      fontesUnicas: 0,
      naturezasUnicas: 0,
      hasRequiredFields: false,
      missingFields: ["NATUREZA_RECEITA", "FONTE_RECURSO", "VALOR"],
    };
  }

  // Localizar linha de cabeçalho nos primeiros 15 registros
  let headerRowIndex = -1;
  let colCodigoReceitaIdx = -1;
  let colNaturezaReceitaIdx = -1;
  let colDescricaoReceitaIdx = -1;
  let colFonteRecursoIdx = -1;
  let colDescricaoFonteIdx = -1;
  let colOrgaoUnidadeIdx = -1;
  let colValorIdx = -1;

  for (let i = 0; i < Math.min(rowsFormatted.length, 15); i++) {
    const row = rowsFormatted[i] || [];
    let matchedKeywords = 0;

    row.forEach((cell, colIdx) => {
      if (!cell) return;
      const normalized = normalizeHeader(String(cell));

      // Código da Receita
      if (
        /^(cdreceita|codreceita|codigoreceita|receitacodigo|codreceitaprevisao)$/.test(normalized) ||
        (/^receita$/.test(normalized) && colCodigoReceitaIdx === -1)
      ) {
        colCodigoReceitaIdx = colIdx;
        matchedKeywords++;
      }

      // Natureza da Receita
      if (
        /^(naturezareceita|natureza|naturrec|codnatureza|cdnatureza|naturezadespesa)$/.test(normalized) ||
        (normalized.includes("natureza") && !normalized.includes("despesa"))
      ) {
        colNaturezaReceitaIdx = colIdx;
        matchedKeywords++;
      }

      // Descrição / Especificação
      if (
        /^(descricaoreceita|descreceita|especificacao|descricao|descdareceita|rubrica|tituloreceita)$/.test(normalized) ||
        (normalized.includes("especificacao") || (normalized.includes("desc") && !normalized.includes("vinculo") && !normalized.includes("fonte")))
      ) {
        colDescricaoReceitaIdx = colIdx;
        matchedKeywords++;
      }

      // Fonte / Vínculo
      if (
        /^(fonterecurso|fonte|vinculo|cdfonte|cdvinculo|codfonte|codvinculo|fontevinculo)$/.test(normalized)
      ) {
        colFonteRecursoIdx = colIdx;
        matchedKeywords++;
      }

      // Descrição da Fonte / Vínculo
      if (
        /^(descricaofonte|descfonte|descricaovinculo|descvinculo|nomefonte|nomevinculo)$/.test(normalized) ||
        (normalized.includes("fonte") && normalized.includes("desc")) ||
        (normalized.includes("vinculo") && normalized.includes("desc"))
      ) {
        colDescricaoFonteIdx = colIdx;
        matchedKeywords++;
      }

      // Órgão / Unidade
      if (
        /^(orgaounidade|orgao|unidade|unidadeorcamentaria|cdorgao|cdunid|secretaria)$/.test(normalized) ||
        normalized.includes("orgao") ||
        normalized.includes("unid")
      ) {
        colOrgaoUnidadeIdx = colIdx;
        matchedKeywords++;
      }

      // Valor
      if (
        /^(valor|valortotal|total|valororcado|valorprevisto|valorloa|previsao|orcado)$/.test(normalized) ||
        normalized.includes("orcado") ||
        normalized.includes("previsto")
      ) {
        colValorIdx = colIdx;
        matchedKeywords++;
      }
    });

    if (matchedKeywords >= 2 && (colValorIdx !== -1 || colNaturezaReceitaIdx !== -1)) {
      headerRowIndex = i;
      break;
    }
  }

  // Fallback se cabeçalho não foi identificado perfeitamente
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    if (colNaturezaReceitaIdx === -1) colNaturezaReceitaIdx = 1;
    if (colDescricaoReceitaIdx === -1) colDescricaoReceitaIdx = 2;
    if (colFonteRecursoIdx === -1) colFonteRecursoIdx = 3;
    if (colValorIdx === -1) colValorIdx = 4;
  }

  const colunasEncontradas = {
    codigoReceita: colCodigoReceitaIdx !== -1 ? String(rowsFormatted[headerRowIndex][colCodigoReceitaIdx]) : null,
    naturezaReceita: colNaturezaReceitaIdx !== -1 ? String(rowsFormatted[headerRowIndex][colNaturezaReceitaIdx]) : null,
    descricaoReceita: colDescricaoReceitaIdx !== -1 ? String(rowsFormatted[headerRowIndex][colDescricaoReceitaIdx]) : null,
    fonteRecurso: colFonteRecursoIdx !== -1 ? String(rowsFormatted[headerRowIndex][colFonteRecursoIdx]) : null,
    descricaoFonte: colDescricaoFonteIdx !== -1 ? String(rowsFormatted[headerRowIndex][colDescricaoFonteIdx]) : null,
    orgaoUnidade: colOrgaoUnidadeIdx !== -1 ? String(rowsFormatted[headerRowIndex][colOrgaoUnidadeIdx]) : null,
    valor: colValorIdx !== -1 ? String(rowsFormatted[headerRowIndex][colValorIdx]) : null,
  };

  const missingFields: string[] = [];
  if (colNaturezaReceitaIdx === -1 && colDescricaoReceitaIdx === -1) missingFields.push("NATUREZA_RECEITA / ESPECIFICAÇÃO");
  if (colFonteRecursoIdx === -1) missingFields.push("FONTE_RECURSO / VÍNCULO");
  if (colValorIdx === -1) missingFields.push("VALOR / PREVISÃO");

  const hasRequiredFields = missingFields.length === 0;

  const records: LoaReceitaRowRaw[] = [];
  const chavesUnicas = new Set<string>();
  const fontesSet = new Set<string>();
  const naturezasSet = new Set<string>();

  let registrosValidos = 0;
  let registrosComAlerta = 0;
  let registrosInvalidos = 0;
  let registrosDuplicados = 0;
  let valorTotalLoa = 0;

  for (let r = headerRowIndex + 1; r < rowsFormatted.length; r++) {
    const rowF = rowsFormatted[r] || [];
    const rowR = rowsRaw[r] || [];

    // Ignorar linhas vazias
    const isEmpty = rowF.every((c) => !c || String(c).trim() === "");
    if (isEmpty) continue;

    const codigoReceita = colCodigoReceitaIdx !== -1 && rowF[colCodigoReceitaIdx] ? String(rowF[colCodigoReceitaIdx]).trim() : "";
    const naturezaReceita = colNaturezaReceitaIdx !== -1 && rowF[colNaturezaReceitaIdx] ? String(rowF[colNaturezaReceitaIdx]).trim() : "";
    const descricaoReceita = colDescricaoReceitaIdx !== -1 && rowF[colDescricaoReceitaIdx] ? String(rowF[colDescricaoReceitaIdx]).trim() : "";
    const fonteRecurso = colFonteRecursoIdx !== -1 && rowF[colFonteRecursoIdx] ? String(rowF[colFonteRecursoIdx]).trim() : "";
    const descricaoFonte = colDescricaoFonteIdx !== -1 && rowF[colDescricaoFonteIdx] ? String(rowF[colDescricaoFonteIdx]).trim() : "";
    const orgaoUnidade = colOrgaoUnidadeIdx !== -1 && rowF[colOrgaoUnidadeIdx] ? String(rowF[colOrgaoUnidadeIdx]).trim() : "";

    // Detecção de linha de totalização ou rodapé
    const linhaTexto = (codigoReceita + " " + naturezaReceita + " " + descricaoReceita).toLowerCase();
    if (/total\s?geral|subtotal|soma|totais/i.test(linhaTexto) && !naturezaReceita.match(/^\d/)) {
      continue;
    }

    // Extração do valor prioritariamente numérico ou formatado
    let rawVal: unknown = colValorIdx !== -1 ? rowR[colValorIdx] : null;
    if (rawVal === undefined || rawVal === null || rawVal === "") {
      rawVal = colValorIdx !== -1 ? rowF[colValorIdx] : null;
    }

    const valorParsed = parseMonetaryValue(rawVal);

    // Validações
    let situacaoValidacao: "VÁLIDO" | "ALERTA" | "DUPLICADO" | "INVALIDO" = "VÁLIDO";
    let mensagemValidacao: string | undefined = undefined;

    if (valorParsed === null || isNaN(valorParsed)) {
      situacaoValidacao = "INVALIDO";
      mensagemValidacao = "Valor ausente ou não numérico";
      registrosInvalidos++;
    } else if (!naturezaReceita && !descricaoReceita) {
      situacaoValidacao = "INVALIDO";
      mensagemValidacao = "Natureza ou Descrição da Receita não informada";
      registrosInvalidos++;
    } else if (!fonteRecurso) {
      situacaoValidacao = "ALERTA";
      mensagemValidacao = "Fonte/Vínculo de recursos não informado";
      registrosComAlerta++;
    } else if (valorParsed <= 0) {
      situacaoValidacao = "ALERTA";
      mensagemValidacao = "Valor previsto é zero ou negativo";
      registrosComAlerta++;
    }

    // Checagem de duplicidade (natureza + fonte)
    const chave = `${naturezaReceita || descricaoReceita}|${fonteRecurso}`.toLowerCase();
    if (situacaoValidacao === "VÁLIDO" && chavesUnicas.has(chave)) {
      situacaoValidacao = "DUPLICADO";
      mensagemValidacao = "Mesma natureza de receita e fonte já registradas em outra linha";
      registrosDuplicados++;
    } else if (situacaoValidacao === "VÁLIDO") {
      registrosValidos++;
      chavesUnicas.add(chave);
    }

    const finalVal = valorParsed !== null && !isNaN(valorParsed) ? valorParsed : 0;
    valorTotalLoa += finalVal;

    if (fonteRecurso) fontesSet.add(fonteRecurso);
    if (naturezaReceita) naturezasSet.add(naturezaReceita);

    records.push({
      codigoReceita,
      naturezaReceita: naturezaReceita || "N/A",
      descricaoReceita: descricaoReceita || "Sem descrição",
      fonteRecurso: fonteRecurso || "N/A",
      descricaoFonte,
      orgaoUnidade,
      valor: finalVal,
      linhaOrigem: r + 1,
      situacaoValidacao,
      mensagemValidacao,
    });
  }

  return {
    records,
    colunasEncontradas,
    totalLinhas: records.length,
    registrosValidos,
    registrosComAlerta,
    registrosInvalidos,
    registrosDuplicados,
    valorTotalLoa,
    fontesUnicas: fontesSet.size,
    naturezasUnicas: naturezasSet.size,
    hasRequiredFields,
    missingFields,
  };
}
