import * as XLSX from "xlsx";

export type AuxiliaryCodeRow = {
  tipo: string;
  abaOrigem: string;
  codigo: string;
  nome: string;
  especificacao: string;
  observacao: string;
  metadados: Record<string, string>;
};

export type AuxiliaryTablesParseResult = {
  records: AuxiliaryCodeRow[];
  sheets: Array<{ name: string; count: number }>;
};

const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase()
  .replace(/\s+/g, " ")
  .trim();

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const code = (value: unknown) => clean(value).replace(/\.0$/, "");

const TYPE_BY_SHEET: Record<string, string> = {
  "Fonte de Recurso": "FONTE_RECURSO",
  "Código de Aplicação": "CODIGO_APLICACAO",
  "Tabela - DE (AUDESP) PARA STN": "DE_PARA_AUDESP_STN",
  "Tipo Conta Bancária": "TIPO_CONTA_BANCARIA",
  "Tipo Identificação-credor": "TIPO_IDENTIFICACAO_CREDOR",
  "Origem da Receita": "ORIGEM_RECEITA",
  "Classificação da Receita - 2026": "CLASSIFICACAO_RECEITA",
  "Função de Governo": "FUNCAO_GOVERNO",
  "Subfunção de Governo": "SUBFUNCAO_GOVERNO",
  "Categoria Despesa": "CATEGORIA_DESPESA",
  "Grupo Despesa": "GRUPO_DESPESA",
  "Modalidade de Aplicação": "MODALIDADE_APLICACAO",
  "Classif.Despesa Elemento": "ELEMENTO_DESPESA",
  "Class.Desp Subelemento": "SUBELEMENTO_DESPESA",
  "Tipo Empenho": "TIPO_EMPENHO",
  "Regime Exec.Despesa": "REGIME_EXECUCAO_DESPESA",
  "Modalidade Licitação": "MODALIDADE_LICITACAO",
  "Tipo Convênio": "TIPO_CONVENIO",
  "Tipo Legislação": "TIPO_LEGISLACAO",
  "Tipo Contratação": "TIPO_CONTRATACAO",
  "Código Contribuição": "CODIGO_CONTRIBUICAO",
  "Exercício Competência": "EXERCICIO_COMPETENCIA",
};

function findHeader(rows: unknown[][]) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 15); rowIndex += 1) {
    const cells = rows[rowIndex].map(normalize);
    const codeIndex = cells.findIndex((cell) => ["CÓDIGO", "CODIGO", "CODIFICAÇÃO", "CODIFICACAO", "NR"].includes(cell));
    const nameIndex = cells.findIndex((cell) => ["NOME", "NOME DO CÓDIGO", "NOME DO CODIGO", "ESPECIFICAÇÃO", "ESPECIFICACAO"].includes(cell));
    if (codeIndex >= 0 && nameIndex >= 0) return { rowIndex, cells, codeIndex, nameIndex };
  }
  return null;
}

export function parseAuxiliaryTablesWorkbook(buffer: ArrayBuffer | Buffer): AuxiliaryTablesParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const records: AuxiliaryCodeRow[] = [];
  const sheets: Array<{ name: string; count: number }> = [];

  workbook.SheetNames.forEach((sheetName) => {
    const tipo = TYPE_BY_SHEET[sheetName];
    if (!tipo) return;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: false, defval: "" });
    if (sheetName === "Tabela - DE (AUDESP) PARA STN") {
      let count = 0;
      const seen = new Set<string>();
      rows.slice(7).forEach((row) => {
        const audespSource = clean(row[0]);
        const fixedApplication = clean(row[1]);
        const variableApplication = clean(row[2]);
        [[6, 7, 8, "FONTE_STN"], [9, 10, 11, "ACOMPANHAMENTO_STN"]].forEach(([codeIndex, nameIndex, specificationIndex, subtype]) => {
          const rowCode = code(row[Number(codeIndex)]);
          const name = clean(row[Number(nameIndex)]);
          const uniqueKey = `${subtype}|${rowCode}`;
          if (!rowCode || !name || seen.has(uniqueKey)) return;
          seen.add(uniqueKey);
          records.push({
            tipo: String(subtype),
            abaOrigem: sheetName,
            codigo: rowCode,
            nome: name,
            especificacao: clean(row[Number(specificationIndex)]),
            observacao: clean(row[12]),
            metadados: { fonteAudesp: audespSource, aplicacaoFixa: fixedApplication, aplicacaoVariavel: variableApplication },
          });
          count += 1;
        });
      });
      sheets.push({ name: sheetName, count });
      return;
    }
    const header = findHeader(rows);
    if (!header) {
      sheets.push({ name: sheetName, count: 0 });
      return;
    }

    const specificationIndex = header.cells.findIndex((cell, index) => index !== header.nameIndex && ["ESPECIFICAÇÃO", "ESPECIFICACAO", "FUNÇÃO", "FUNCAO", "DESCRIÇÃO", "DESCRICAO"].includes(cell));
    const observationIndex = header.cells.findIndex((cell) => cell.includes("OBSERV"));
    let count = 0;
    rows.slice(header.rowIndex + 1).forEach((row) => {
      const rowCode = code(row[header.codeIndex]);
      const name = clean(row[header.nameIndex]);
      if (!rowCode || !name || !/[0-9]/.test(rowCode)) return;
      const metadados: Record<string, string> = {};
      header.cells.forEach((label, index) => {
        const value = clean(row[index]);
        if (label && value && index !== header.codeIndex && index !== header.nameIndex) metadados[label] = value;
      });
      records.push({
        tipo,
        abaOrigem: sheetName,
        codigo: rowCode,
        nome: name,
        especificacao: specificationIndex >= 0 ? clean(row[specificationIndex]) : "",
        observacao: observationIndex >= 0 ? clean(row[observationIndex]) : "",
        metadados,
      });
      count += 1;
    });
    sheets.push({ name: sheetName, count });
  });

  return { records, sheets };
}
