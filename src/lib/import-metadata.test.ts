import { describe, expect, it } from "vitest";
import { cleanImportFileName, fileNameWithExercise, inferImportExercise } from "./import-metadata";

describe("import metadata", () => {
  it("identifica o exercício em arquivos existentes", () => {
    expect(inferImportExercise("ConsolidadoLoa27_ATIVIDADES.xlsx")).toBe(2027);
    expect(inferImportExercise("LOA 2028.xlsx")).toBe(2028);
  });

  it("persiste e limpa o prefixo explícito de exercício", () => {
    const stored = fileNameWithExercise("despesas.xlsx", 2029);
    expect(stored).toBe("[2029] despesas.xlsx");
    expect(cleanImportFileName(stored)).toBe("despesas.xlsx");
    expect(inferImportExercise(stored)).toBe(2029);
  });
});
