import { describe, it, expect } from "vitest";
import {
  calculateBudgetMetrics,
  calculateDifferenceStatus,
} from "./budget-calculation-service";

describe("Budget Calculation Service", () => {
  it("deve calcular corretamente totais de LDO, LOA e diferença", () => {
    const mockItems = [
      { valLdo: 1000, valLoa: 1200, natureza: "3.3.90.30" },
      { valLdo: 2000, valLoa: 1800, natureza: "3.3.90.39" },
    ];

    const result = calculateBudgetMetrics(mockItems);

    expect(result.valLdoTotal).toBe(3000);
    expect(result.valLoaTotal).toBe(3000);
    expect(result.diff).toBe(0);
    expect(result.percentExec).toBe(100);
    expect(result.totalNaturezas).toBe(2);
  });

  it("deve somar valores customizados de subelementos quando presentes", () => {
    const mockItems = [
      {
        valLdo: 5000,
        valLoa: 0,
        natureza: "3.3.90.30",
        subelementos: [{ valor: 2500 }, { valor: 3000 }],
      },
    ];

    const result = calculateBudgetMetrics(mockItems);

    expect(result.valLdoTotal).toBe(5000);
    expect(result.valLoaTotal).toBe(5500);
    expect(result.diff).toBe(500);
    expect(result.percentExec).toBe(110);
  });

  it("deve classificar status de diferença corretamente", () => {
    const pos = calculateDifferenceStatus(1500, 1000);
    expect(pos.isPositive).toBe(true);
    expect(pos.diff).toBe(500);
    expect(pos.statusLabel).toContain("Excesso");

    const neg = calculateDifferenceStatus(800, 1000);
    expect(neg.isNegative).toBe(true);
    expect(neg.diff).toBe(-200);
    expect(neg.statusLabel).toContain("Redução");

    const eq = calculateDifferenceStatus(1000, 1000);
    expect(eq.isEqual).toBe(true);
    expect(eq.diff).toBe(0);
  });
});
