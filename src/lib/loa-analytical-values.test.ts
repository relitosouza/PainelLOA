import { describe, expect, it } from "vitest";
import {
  allocateLoa2026Initial,
  calculateAnalyticalValues,
  calculateSugestaoSfAdoption,
  createBancoProjetoValues,
  parseLoa2026InitialWorkbook,
} from "./loa-analytical-values";
import * as XLSX from "xlsx";

describe("calculateAnalyticalValues", () => {
  it("calcula vigente mais reajuste e a LOA 2027 sem descontar os cortes informativos", () => {
    expect(calculateAnalyticalValues({
      valLoa2026: 900,
      valLoa: 1_000,
      valorReajuste: 100,
      valorAditamento: 250,
      valorSugestaoSf: 80,
      valorCorteGp: 50,
    })).toEqual({
      loa2026: 900,
      vigente: 1_000,
      reajuste: 100,
      vigenteComReajuste: 1_100,
      aditamento: 250,
      loa2027Oficial: 1_350,
      loa2027CenarioSf: 80,
      loa2027: 1_350,
      sugestaoSf: 80,
      corteGp: 50,
      isSfActive: true,
    });
  });

  it("calcula valores no cenário SF quando solicitado", () => {
    const itemComSf = {
      valLoa: 1_000,
      valorReajuste: 100,
      valorAditamento: 250,
      valorSugestaoSf: 1_150,
    };
    const valuesSf = calculateAnalyticalValues(itemComSf, "sf");
    expect(valuesSf.loa2027).toBe(1_150);
    expect(valuesSf.loa2027Oficial).toBe(1_350);

    const itemSemSf = {
      valLoa: 1_000,
      valorReajuste: 100,
      valorAditamento: 250,
      valorSugestaoSf: 0,
    };
    const valuesSemSf = calculateAnalyticalValues(itemSemSf, "sf");
    expect(valuesSemSf.loa2027).toBe(1_350);
    expect(valuesSemSf.isSfActive).toBe(false);
  });

  it("calcula adoção da sugestão SF ajustando o valor de aditamento", () => {
    const item = {
      valLoa: 1_000,
      valorReajuste: 100,
      valorAditamento: 250,
      valorSugestaoSf: 900,
    };
    const adoption = calculateSugestaoSfAdoption(item);
    expect(adoption.novoTotal).toBe(900);
    expect(adoption.valorAditamento).toBe(-200); // 900 - (1000 + 100) = -200
    expect(adoption.diferenca).toBe(-450); // 900 - 1350 = -450
  });

  it("aloca um novo projeto integralmente em Aditamento", () => {
    expect(createBancoProjetoValues(750_000)).toEqual({
      valLoa: 0,
      valorAditamento: 750_000,
    });
  });
});

describe("LOA 2026", () => {
  it("lê e soma a dotação Inicial por programática", () => {
    const rows = [
      ["Unidade_Orçamentária", "Exercício", "Classificação_Funcional", "Dotação", "Natureza_despesa", "Vínculo", "Inicial", "Atualizada"],
      ["01.02.001.00", 2026, "04.122.0001.2.011", 1, "3.3.90.39.00", "01.110.0000", 100, 120],
      ["01.02.001.00", 2026, "04.122.0001.2.011", 2, "3.3.90.39.00", "02.100.0000", 50, 80],
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "LOA 2026");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    expect(parseLoa2026InitialWorkbook(buffer).get("02.001.04.122.0001.2.011.3.3.90.39.00")).toBe(150);
  });

  it("rateia por subelemento sem duplicar o total oficial", () => {
    const allocated = allocateLoa2026Initial([
      { id: "a", programaticaLoa: "02.001.04.122.0001.2.011.3.3.90.39.00", valLoa: 300 },
      { id: "b", programaticaLoa: "02.001.04.122.0001.2.011.3.3.90.39.00", valLoa: 100 },
      { id: "novo", programaticaLoa: "", valLoa: 500 },
    ], new Map([["02.001.04.122.0001.2.011.3.3.90.39.00", 1_000]]));

    expect(allocated.map((item) => item.valLoa2026)).toEqual([750, 250, 0]);
  });
});
