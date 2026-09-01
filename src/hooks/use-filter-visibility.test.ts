import { describe, it, expect } from "vitest";

describe("Filtros Visíveis - Lógica de Negócio", () => {
  const ALL_KEYS = [
    "organ",
    "budgetUnit",
    "functionName",
    "subfunction",
    "program",
    "action",
    "expenseNature",
    "subelement",
    "administrativeProcess",
  ];

  it("oculta campo corretamente mantendo os demais", () => {
    const visible = [...ALL_KEYS];
    const updated = visible.filter((k) => k !== "subelement");
    expect(updated).not.toContain("subelement");
    expect(updated.length).toBe(ALL_KEYS.length - 1);
  });

  it("adiciona campo preservando a ordem original das dimensões", () => {
    const current = ["organ", "functionName"];
    const toAdd = "budgetUnit";
    const updated = ALL_KEYS.filter((k) => current.includes(k) || k === toAdd);
    expect(updated).toEqual(["organ", "budgetUnit", "functionName"]);
  });

  it("impede remoção quando restar apenas 1 campo", () => {
    const current = ["organ"];
    const tryHide = (key: string) => {
      if (current.length <= 1) return current;
      return current.filter((k) => k !== key);
    };
    expect(tryHide("organ")).toEqual(["organ"]);
  });
});
