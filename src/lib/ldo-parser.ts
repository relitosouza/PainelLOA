import * as XLSX from "xlsx";

export interface LdoRowRaw {
  apelidoOriginal: string;
  apelidoNormalizado: string;
  vinculo: string;
  descricaoVinculo: string;
  total: number;
  linhaOrigem: number;
  situacaoValidacao: "VÁLIDO" | "ALERTA" | "DUPLICADO" | "INVALIDO";
  mensagemValidacao?: string;
}

export interface LdoParseResult {
  records: LdoRowRaw[];
  colunasEncontradas: {
    apelido: string | null;
    vinculo: string | null;
    descricaoVinculo: string | null;
    total: string | null;
  };
  totalLinhas: number;
  registrosValidos: number;
  registrosComAlerta: number;
  registrosInvalidos: number;
  registrosDuplicados: number;
  valorTotalLdo: number;
  vintulosUnicos: number;
}

export function parseLdoWorkbook(buffer: ArrayBuffer): LdoParseResult {
  const workbook = XLSX.read(buffer, { type: "array", raw: true, cellText: true });
  let sheetName = workbook.SheetNames[0];

  // Procurar por aba de dados que não seja 'Instruções' ou 'Ajuda'
  const dataSheetName = workbook.SheetNames.find(
    (name) => !/instru[çc][õo]es|ajuda|info|help|readme/i.test(name.trim())
  );
  if (dataSheetName) {
    sheetName = dataSheetName;
  }

  const sheet = workbook.Sheets[sheetName];

  // Extrai as linhas brutas (raw: true) para que a coluna de valor venha como número puro (Float)
  // e extrai as linhas formatadas (raw: false) para preservar strings puras (Apelido com zeros à esquerda)
  const rowsRaw = XLSX.utils.sheet_to_json(sheet, { raw: true, header: 1 }) as unknown as unknown[][];
  const rowsFormatted = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 }) as unknown as string[][];

  if (!rowsRaw || rowsRaw.length === 0) {
    return {
      records: [],
      colunasEncontradas: { apelido: null, vinculo: null, descricaoVinculo: null, total: null },
      totalLinhas: 0,
      registrosValidos: 0,
      registrosComAlerta: 0,
      registrosInvalidos: 0,
      registrosDuplicados: 0,
      valorTotalLdo: 0,
      vintulosUnicos: 0,
    };
  }

  // Localizar linha de cabeçalho
  let headerRowIndex = 0;
  let colApelidoIdx = -1;
  let colVinculoIdx = -1;
  let colDescVinculoIdx = -1;
  let colTotalIdx = -1;

  for (let i = 0; i < Math.min(rowsFormatted.length, 10); i++) {
    const row = rowsFormatted[i] || [];
    row.forEach((cell, colIdx) => {
      if (!cell) return;
      const strCell = String(cell).trim().toLowerCase();
      if (/^apelido$/i.test(strCell) || /c[óo]digo/i.test(strCell) || /sigla/i.test(strCell) || /receita/i.test(strCell)) {
        if (colApelidoIdx === -1) colApelidoIdx = colIdx;
      }
      if (/v[íi]nculo/i.test(strCell) || /fonte/i.test(strCell) || /recurso/i.test(strCell)) {
        if (/desc/i.test(strCell) || /nome/i.test(strCell)) {
          if (colDescVinculoIdx === -1) colDescVinculoIdx = colIdx;
        } else if (colVinculoIdx === -1) {
          colVinculoIdx = colIdx;
        }
      }
      if (/total/i.test(strCell) || /valor/i.test(strCell) || /previsto/i.test(strCell) || /ldo/i.test(strCell)) {
        if (colTotalIdx === -1) colTotalIdx = colIdx;
      }
    });

    if (colApelidoIdx !== -1 || colVinculoIdx !== -1 || colTotalIdx !== -1) {
      headerRowIndex = i;
      break;
    }
  }

  // Fallback para índices padrão se não encontrou todas as colunas
  if (colApelidoIdx === -1) colApelidoIdx = 0;
  if (colVinculoIdx === -1) colVinculoIdx = 1;
  if (colDescVinculoIdx === -1) colDescVinculoIdx = 2;
  if (colTotalIdx === -1) colTotalIdx = 3;

  const colunasEncontradas = {
    apelido: colApelidoIdx !== -1 ? String(rowsFormatted[headerRowIndex][colApelidoIdx]) : null,
    vinculo: colVinculoIdx !== -1 ? String(rowsFormatted[headerRowIndex][colVinculoIdx]) : null,
    descricaoVinculo: colDescVinculoIdx !== -1 ? String(rowsFormatted[headerRowIndex][colDescVinculoIdx]) : null,
    total: colTotalIdx !== -1 ? String(rowsFormatted[headerRowIndex][colTotalIdx]) : null,
  };

  const records: LdoRowRaw[] = [];
  const chavesUnicas = new Set<string>();
  const vinculosSet = new Set<string>();

  let registrosValidos = 0;
  let registrosComAlerta = 0;
  let registrosInvalidos = 0;
  let registrosDuplicados = 0;
  let valorTotalLdo = 0;

  for (let r = headerRowIndex + 1; r < rowsFormatted.length; r++) {
    const rowFormatted = rowsFormatted[r];
    const rowRaw = rowsRaw[r] || [];
    if (!rowFormatted || rowFormatted.every((c) => !c || String(c).trim() === "")) continue;

    // REGRA DO CAMPO APELIDO: Converte para string pura sem transformações numéricas
    const rawApelidoCell = colApelidoIdx !== -1 ? rowFormatted[colApelidoIdx] : "";
    const apelidoOriginal = rawApelidoCell !== undefined && rawApelidoCell !== null ? String(rawApelidoCell).trim() : "";
    const apelidoNormalizado = apelidoOriginal.trim().toUpperCase();

    const rawVinculoCell = colVinculoIdx !== -1 ? rowFormatted[colVinculoIdx] : "";
    const vinculo = rawVinculoCell !== undefined && rawVinculoCell !== null ? String(rawVinculoCell).trim() : "";

    const rawDescVinculoCell = colDescVinculoIdx !== -1 ? rowFormatted[colDescVinculoIdx] : "";
    const descricaoVinculo = rawDescVinculoCell !== undefined && rawDescVinculoCell !== null ? String(rawDescVinculoCell).trim() : "";

    // Para o VALOR TOTAL: usa a célula bruta (raw: true) se for número puro para evitar truncamento por vírgulas de milhar
    const rawTotalCellRaw = colTotalIdx !== -1 ? rowRaw[colTotalIdx] : undefined;
    const rawTotalCellFormatted = colTotalIdx !== -1 ? rowFormatted[colTotalIdx] : "";

    let totalVal = 0;
    if (typeof rawTotalCellRaw === "number" && !isNaN(rawTotalCellRaw)) {
      totalVal = rawTotalCellRaw;
    } else {
      const strVal = String(rawTotalCellFormatted || rawTotalCellRaw || "").replace(/R\$\s?/gi, "").trim();
      if (strVal.includes(",") && strVal.includes(".")) {
        // Formato brasileiro com milhar e decimal: 27.189.794,56
        const cleanStr = strVal.replace(/\./g, "").replace(",", ".");
        totalVal = parseFloat(cleanStr) || 0;
      } else if (strVal.includes(",")) {
        // Formato com vírgula decimal: 27189794,56
        totalVal = parseFloat(strVal.replace(",", ".")) || 0;
      } else {
        totalVal = parseFloat(strVal) || 0;
      }
    }

    let situacaoValidacao: LdoRowRaw["situacaoValidacao"] = "VÁLIDO";
    const msgs: string[] = [];

    if (!apelidoOriginal) {
      situacaoValidacao = "INVALIDO";
      msgs.push("Apelido não informado.");
    }
    if (!vinculo) {
      situacaoValidacao = "INVALIDO";
      msgs.push("Vínculo é obrigatório.");
    }
    if (totalVal <= 0) {
      if (situacaoValidacao !== "INVALIDO") situacaoValidacao = "ALERTA";
      msgs.push("Valor total zerado ou negativo.");
    }

    const chaveAgrupamento = `${apelidoNormalizado}|${vinculo.toLowerCase()}`;
    if (chavesUnicas.has(chaveAgrupamento)) {
      if (situacaoValidacao !== "INVALIDO") situacaoValidacao = "DUPLICADO";
      msgs.push("Registro duplicado (mesmo Apelido + Vínculo).");
      registrosDuplicados++;
    } else {
      chavesUnicas.add(chaveAgrupamento);
    }

    if (vinculo) vinculosSet.add(vinculo);

    if (situacaoValidacao === "VÁLIDO") registrosValidos++;
    else if (situacaoValidacao === "ALERTA" || situacaoValidacao === "DUPLICADO") registrosComAlerta++;
    else if (situacaoValidacao === "INVALIDO") registrosInvalidos++;

    valorTotalLdo += totalVal > 0 ? totalVal : 0;

    records.push({
      apelidoOriginal,
      apelidoNormalizado,
      vinculo,
      descricaoVinculo,
      total: totalVal,
      linhaOrigem: r + 1,
      situacaoValidacao,
      mensagemValidacao: msgs.join(" "),
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
    valorTotalLdo,
    vintulosUnicos: vinculosSet.size,
  };
}
