import { describe, expect, it } from "vitest";
import { calcularEmendasImpositivas, calcularIndicesConstitucionais, EMENDAS_IMPOSITIVAS_2027 } from "./indicadores-constitucionais";

describe("calcularIndicesConstitucionais", () => {
  const receitas = [
    { naturezaReceita: "ICMS", fonteRecurso: "01.110.0000", valor: 600 },
    { naturezaReceita: "ICMS", fonteRecurso: "01.200.0000", valor: 250 },
    { naturezaReceita: "ICMS", fonteRecurso: "01.310.0000", valor: 150 },
    { naturezaReceita: "Fundeb - ICMS", fonteRecurso: "01.200.0000", valor: -200 },
    { naturezaReceita: "IPTU", fonteRecurso: "01.110.0000", valor: 1_000 },
    { naturezaReceita: "Taxas", fonteRecurso: "01.110.0000", valor: 5_000 },
  ];

  it("usa só impostos e transferências como base, pelo valor bruto", () => {
    const result = calcularIndicesConstitucionais(receitas);
    expect(result.base).toBe(2_000);
    expect(result.saude).toMatchObject({ minimo: 300, vinculadoReceita: 150, aplicado: null });
    expect(result.educacao).toMatchObject({ minimo: 500, vinculadoReceita: 250, retencaoFundeb: 200, aplicado: null });
  });
});

describe("calcularEmendasImpositivas", () => {
  it("calcula as cotas da LOA 2027 (RCL × 1,2% ÷ 21, metade para a Saúde)", () => {
    expect(calcularEmendasImpositivas(EMENDAS_IMPOSITIVAS_2027)).toEqual({
      vereadores: 21,
      totalMinimo: 58_919_024.78,
      cotaPorVereador: 2_805_667.85,
      saudeMinimoTotal: 29_459_512.39,
      saudeMinimoPorVereador: 1_402_833.92,
    });
  });
});
