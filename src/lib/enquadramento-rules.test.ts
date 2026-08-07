import { describe, expect, it } from "vitest";
import { validateClassification } from "./enquadramento-rules";

const base = { sourceCode: "01", applicationCode: "110", value: 100, remaining: 1000, justification: "" };

describe("validateClassification", () => {
  it("bloqueia custeio para contexto de investimento", () => {
    const result = validateClassification({ ...base, actionText: "Ampliação de unidade", product: "Equipamento adquirido", expenseCode: "3.3.90.39" });
    expect(result.some((message) => message.rule === "RN01" && message.severity === "error")).toBe(true);
  });

  it("bloqueia 3.3.90.39 para tecnologia", () => {
    const result = validateClassification({ ...base, actionText: "Sistemas mantidos", product: "Licenças de software", expenseCode: "3.3.90.39" });
    expect(result.some((message) => message.rule === "RN02" && message.severity === "error")).toBe(true);
  });

  it("bloqueia valor acima do saldo", () => {
    const result = validateClassification({ ...base, actionText: "Atividade", product: "Produto", expenseCode: "3.3.90.30", value: 1001 });
    expect(result.some((message) => message.rule === "RN04")).toBe(true);
  });
});
