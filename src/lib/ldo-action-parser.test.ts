import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseLdoActionWorkbook } from "./ldo-action-parser";

describe("parseLdoActionWorkbook", () => {
  it("preserva o contexto de secretaria e programa nas linhas seguintes", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["nome_ug", "Município"],
      [],
      ["Secretaria", "desc_programa", "acao", "produto", "Custo_fisico_ano2", "Custo_financeiro_ano2"],
      ["06.", "006 - Governo Inteligente", "2.007", "Sistemas mantidos", 1, 1500000],
      ["", "", "2.011", "Equipamentos mantidos", 2, 350000],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Planilha1");
    const result = parseLdoActionWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
    expect(result.records).toHaveLength(2);
    expect(result.records[1]).toMatchObject({ secretaria: "06", programaCodigo: "006", acaoCodigo: "2.011", custoFinanceiro: 350000 });
    expect(result.totalValue).toBe(1850000);
  });
});
