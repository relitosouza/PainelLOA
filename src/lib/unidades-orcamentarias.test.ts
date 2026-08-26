import { describe, it, expect } from "vitest";
import { normalizeUnidadeOrcamentaria, UNIDADES_ORCAMENTARIAS_LDO } from "./unidades-orcamentarias-catalogo";

describe("normalizeUnidadeOrcamentaria", () => {
  it("unifies generic chefia de gabinete to the correct secretariat cabinet", () => {
    expect(normalizeUnidadeOrcamentaria("11 - SECRETARIA DE SERVIÇOS E OBRAS", "001-CHEFIA DE GABINETE"))
      .toBe("001 - GABINETE DA SECRETARIA DE SERVIÇOS E OBRAS");

    expect(normalizeUnidadeOrcamentaria("04 - SECRETARIA DE FINANÇAS", "001-CHEFIA DE GABINETE"))
      .toBe("001 - GABINETE DA SECRETARIA DE FINANÇAS");

    expect(normalizeUnidadeOrcamentaria("08 - SECRETARIA DA EDUCAÇÃO", "001- GABINETE DA SECRETARIA DA EDUCAÇÃO"))
      .toBe("001 - GABINETE DA SECRETARIA DA EDUCAÇÃO");

    expect(normalizeUnidadeOrcamentaria("09 - SECRETARIA DA SAÚDE", "001-CHEFIA DE GABINETE"))
      .toBe("001 - GABINETE DA SECRETARIA DA SAÚDE");
  });

  it("preserves Mayor and Chamber chefia de gabinete", () => {
    expect(normalizeUnidadeOrcamentaria("01 - CMO", "001-CHEFIA DE GABINETE"))
      .toBe("001 - CHEFIA DE GABINETE");

    expect(normalizeUnidadeOrcamentaria("02 - GABINETE DO PREFEITO", "001-CHEFIA DE GABINETE"))
      .toBe("001 - CHEFIA DE GABINETE");
  });

  it("correctly identifies funds and specific directorates", () => {
    expect(normalizeUnidadeOrcamentaria("11 - SECRETARIA DE SERVIÇOS E OBRAS", "014-FUNDO MUNICIPAL DE MANUTENÇÃO DE VELÓRIOS"))
      .toBe("014 - FUNDO MUNICIPAL DE MANUTENÇÃO DE VELÓRIOS");

    expect(normalizeUnidadeOrcamentaria("09 - SECRETARIA DA SAÚDE", "008-DIRETORIA GERAL DE ATENÇÃO PRIMÁRIA EM SAÚDE"))
      .toBe("008 - DIRETORIA GERAL DE ATENÇÃO PRIMÁRIA EM SAÚDE");

    expect(normalizeUnidadeOrcamentaria("09 - SECRETARIA DA SAÚDE", "010-DIRETORIA GERAL DE URGÊNCIA E EMERGÊNCIA"))
      .toBe("010 - DIRETORIA GERAL DE URGÊNCIA E EMERGÊNCIA");
  });

  it("extracts from programatica if unit is missing or malformed", () => {
    expect(normalizeUnidadeOrcamentaria("11", "", "11.001.04.122.0011.2.011.3.3.90.40.00"))
      .toBe("001 - GABINETE DA SECRETARIA DE SERVIÇOS E OBRAS");
  });
});
