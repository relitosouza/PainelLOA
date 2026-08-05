import { describe, expect, it } from "vitest";
import { extractExpenseCode, resolveExpenseSubelementCode, validateExpenseNature, validateExpenseSubelement } from "./expense-classification";

describe("expense classification catalog", () => {
  it("reconhece código-pai a partir dos subelementos oficiais", () => {
    expect(validateExpenseNature("3.3.90.30.00-MATERIAL DE CONSUMO")).toEqual({
      code: "3.3.90.30.00",
      valid: true,
      reason: "valid",
    });
  });

  it("sinaliza natureza vazia ou código não cadastrado", () => {
    expect(validateExpenseNature("").reason).toBe("missing");
    expect(validateExpenseNature("3.3.90.99.00-DESPESA NÃO CADASTRADA").reason).toBe("invalid-code");
  });

  it("confere o subelemento dentro da natureza correspondente", () => {
    expect(validateExpenseSubelement("3.3.90.30.00-MATERIAL DE CONSUMO", "MATERIAL FARMACOLÓGICO").valid).toBe(true);
    expect(resolveExpenseSubelementCode("3.3.90.30.00-MATERIAL DE CONSUMO", "MATERIAL FARMACOLÓGICO")).toBe("3.3.90.30.09");
    expect(validateExpenseSubelement("3.3.90.30.00-MATERIAL DE CONSUMO", "SUBELEMENTO INEXISTENTE").valid).toBe(false);
  });

  it("extrai a nomenclatura completa de um texto importado", () => {
    expect(extractExpenseCode("Natureza 4.4.90.52.00 - EQUIPAMENTOS")).toBe("4.4.90.52.00");
  });
});
