import { describe, expect, it } from "vitest";
import { normalizeSecretariaLabel } from "./loa-labels";
import { SECRETARIAS_ORCAMENTO } from "./banco-projetos-data";

const normalize = (value: string) => normalizeSecretariaLabel(value, SECRETARIAS_ORCAMENTO);

describe("normalizeSecretariaLabel", () => {
  it("padroniza o código com dois dígitos", () => {
    expect(normalize("9 - saúde")).toBe("09 - SECRETARIA DA SAÚDE");
    expect(normalize("09 - SECRETARIA DA SAÚDE")).toBe("09 - SECRETARIA DA SAÚDE");
  });

  it("completa o rótulo oficial quando só o código é informado", () => {
    expect(normalize("9")).toBe("09 - SECRETARIA DA SAÚDE");
    expect(normalize("24")).toBe("24 - SECRETARIA DE PLANEJAMENTO E GESTÃO");
  });

  it("mantém o caso especial da CMO", () => {
    expect(normalize("01- CMO")).toBe("01 - CMO");
    expect(normalize("1 - CMO")).toBe("01 - CMO");
  });

  it("preserva o nome quando o código atende mais de uma secretaria", () => {
    expect(normalize("18 - ENCARGOS/FINANÇAS")).toBe("18 - ENCARGOS/FINANÇAS");
    expect(normalize("18 - ENCARGOS/TECNOLOGIA")).toBe("18 - ENCARGOS/TECNOLOGIA");
  });

  it("aceita secretaria fora do orçamento, apenas padronizando o código", () => {
    expect(normalize("40 - Secretaria Nova")).toBe("40 - Secretaria Nova");
    expect(normalize("7 - Secretaria Reformulada")).toBe("07 - Secretaria Reformulada");
  });

  it("é idempotente", () => {
    for (const entrada of ["9 - saúde", "01- CMO", "40 - Secretaria Nova", "18 - ENCARGOS/FINANÇAS"]) {
      const uma = normalize(entrada);
      expect(normalize(uma)).toBe(uma);
    }
  });

  it("normaliza espaços, pontos iniciais e traços longos", () => {
    expect(normalize("  ..09  —  SECRETARIA   DA SAÚDE ")).toBe("09 - SECRETARIA DA SAÚDE");
  });

  it("não quebra com entrada vazia ou sem código", () => {
    expect(normalize("")).toBe("");
    expect(normalize("Secretaria sem código")).toBe("Secretaria sem código");
  });
});
