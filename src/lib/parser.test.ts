import { describe, expect, it } from "vitest";
import { parseBrazilianMoney, parseRows } from "./parser";

describe("parseBrazilianMoney", () => {
  it.each([[1250000, 1250000], ["1.250.000,00", 1250000], ["R$ 1.250.000,00", 1250000], ["1250000,00", 1250000]])("converte %s", (input, expected) => expect(parseBrazilianMoney(input)).toBe(expected));
});

describe("parseRows", () => {
  it("herda o órgão de um bloco", () => {
    const result = parseRows([
      ["CD_ÓRGÃO-DS_ÓRGÃO", "19 - SECRETARIA DE TRANSPORTE"],
      ["CD_UNID.-DS_UNID.", "CD_FUNÇÃO-DS_FUNÇÃO", "CD SUBFUNÇÃO-DS_SUBFUNÇÃO", "CD_PROGRAMA-DS_PROGRAMA", "CD_AÇÃO-DS_AÇÃO", "NATUREZA DE DESPESA", "Desc Sub", "PROCESSO ADMINISTRATIVO", "VALOR"],
      ["001 - GABINETE", "04 - ADMINISTRAÇÃO", "122 - ADMINISTRAÇÃO GERAL", "0013 - MOBILIDADE", "2.034 - MANUTENÇÃO", "3.3.90.39.00 - SERVIÇOS", "SERVIÇOS TÉCNICOS", "PA 001", "1.250.000,00"],
    ]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].organ).toContain("19 -");
    expect(result.records[0].value).toBe(1250000);
  });

  it("suporta a omissão do processo administrativo (opcional)", () => {
    const result = parseRows([
      ["CD_ÓRGÃO-DS_ÓRGÃO", "19 - SECRETARIA DE TRANSPORTE"],
      ["CD_UNID.-DS_UNID.", "CD_FUNÇÃO-DS_FUNÇÃO", "CD SUBFUNÇÃO-DS_SUBFUNÇÃO", "CD_PROGRAMA-DS_PROGRAMA", "CD_AÇÃO-DS_AÇÃO", "NATUREZA DE DESPESA", "Desc Sub", "VALOR"],
      ["001 - GABINETE", "04 - ADMINISTRAÇÃO", "122 - ADMINISTRAÇÃO GERAL", "0013 - MOBILIDADE", "2.034 - MANUTENÇÃO", "3.3.90.39.00 - SERVIÇOS", "SERVIÇOS TÉCNICOS", "1.250.000,00"],
    ]);
    expect(result.hasRequiredFields).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].administrativeProcess).toBe("");
  });
});
