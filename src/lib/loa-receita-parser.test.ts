import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseLoaReceitaWorkbook, parseMonetaryValue } from "./loa-receita-parser";

describe("loa-receita-parser", () => {
  it("should parse Brazilian monetary values correctly", () => {
    expect(parseMonetaryValue("1.250.000,50")).toBe(1250000.5);
    expect(parseMonetaryValue("R$ 450.000,00")).toBe(450000);
    expect(parseMonetaryValue("1250.50")).toBe(1250.5);
    expect(parseMonetaryValue(100000)).toBe(100000);
    expect(parseMonetaryValue("(500,00)")).toBe(-500);
    expect(parseMonetaryValue("")).toBeNull();
    expect(parseMonetaryValue("abc")).toBeNull();
  });

  it("should parse a valid LOA Receita workbook with instructions sheet", () => {
    const headers = [
      "CD_RECEITA",
      "NATUREZA_RECEITA",
      "DESCRICAO_RECEITA",
      "FONTE_RECURSO",
      "DESCRICAO_FONTE",
      "ORGAO_UNIDADE",
      "VALOR_ORCADO",
    ];
    const data = [
      ["11120111", "1.1.1.2.01.1.1", "IPTU - IMPOSTO PREDIAL", "01.110.0000", "Recursos Próprios", "02.01 - Finanças", 15000000],
      ["11180231", "1.1.1.8.02.3.1", "ISSQN - SERVIÇOS", "01.110.0000", "Recursos Próprios", "02.01 - Finanças", 8500000],
      ["17180121", "1.7.1.8.01.2.1", "COTA-PARTE DO FPM", "01.110.0000", "Recursos Ordinários", "02.01 - Finanças", 25000000],
      ["17180151", "1.7.1.8.01.5.1", "TRANSFERÊNCIAS DO SUS", "01.310.0000", "Saúde - Transferências", "02.05 - Saúde", "12.300.000,00"],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet([["Instruções do Modelo LOA"]]);
    const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instruções");
    XLSX.utils.book_append_sheet(wb, dataSheet, "Receitas_LOA");

    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const result = parseLoaReceitaWorkbook(buffer);

    expect(result.hasRequiredFields).toBe(true);
    expect(result.totalLinhas).toBe(4);
    expect(result.registrosValidos).toBe(4);
    expect(result.valorTotalLoa).toBe(60800000);
    expect(result.fontesUnicas).toBe(2);
    expect(result.naturezasUnicas).toBe(4);
    expect(result.records[0].naturezaReceita).toBe("1.1.1.2.01.1.1");
    expect(result.records[3].valor).toBe(12300000);
  });

  it("should handle alternative column names (aliases)", () => {
    const headers = ["Receita", "Natureza", "Especificação", "Vínculo", "Nome da Fonte", "Valor"];
    const data = [
      ["REC01", "1.1.1.8.01.1.1", "Impostos sobre o Patrimônio", "01.110.0000", "Geral", 1000000],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const result = parseLoaReceitaWorkbook(buffer);
    expect(result.hasRequiredFields).toBe(true);
    expect(result.records.length).toBe(1);
    expect(result.records[0].descricaoReceita).toBe("Impostos sobre o Patrimônio");
    expect(result.records[0].valor).toBe(1000000);
  });

  it("should flag duplicates and zero values with warnings", () => {
    const headers = ["Natureza", "Especificação", "Fonte", "Valor"];
    const data = [
      ["1.1.1.8.01.1.1", "Receita A", "01.110.0000", 5000],
      ["1.1.1.8.01.1.1", "Receita A", "01.110.0000", 2000], // Duplicada mesma natureza e fonte
      ["1.3.1.0.00.0.0", "Receita B", "01.110.0000", 0], // Alerta valor zero
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const result = parseLoaReceitaWorkbook(buffer);
    expect(result.registrosValidos).toBe(1);
    expect(result.registrosDuplicados).toBe(1);
    expect(result.registrosComAlerta).toBe(1);
  });
});
