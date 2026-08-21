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

  it("importa valores do modelo CSV exportado pelo detalhamento analítico", () => {
    const result = parseRows([
      ["UG", "secretaria", "unidade", "funcao", "subfuncao", "programa", "acao", "natureza", "Programática_LOA", "secretaria", "unidade", "funcao", "subfuncao", "programa", "acao", "natureza", "desc_sub", "processo", " valor ", "Peça Orçamentária", "Vínculo", "Tipo de despesa", "INICIADO", "OBS."],
      ["11", "11", "001", "04", "122", "0011", "2.011", "3.3.90.39.00", "11.001.04.122.0011.2.011.3.3.90.39.00", "11 - SECRETARIA DE SERVIÇOS E OBRAS", "001 - GABINETE", "04 - ADMINISTRAÇÃO", "122 - ADMINISTRAÇÃO GERAL", "0011 - GESTÃO", "2.011 - MANUTENÇÃO", "3.3.90.39.00 - SERVIÇOS", "SERVIÇOS TÉCNICOS", "PA 001/2026", "674.799.655,19", "LOA", "01.110.0000", "2. Atividade", "SIM", ""],
    ]);

    expect(result.hasRequiredFields).toBe(true);
    expect(result.missingOrgan).toBe(false);
    expect(result.invalidValues).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].organ).toBe("11 - SECRETARIA DE SERVIÇOS E OBRAS");
    expect(result.records[0].value).toBe(674799655.19);
  });
});
