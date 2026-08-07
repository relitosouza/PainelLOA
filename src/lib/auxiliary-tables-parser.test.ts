import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseAuxiliaryTablesWorkbook } from "./auxiliary-tables-parser";

describe("parseAuxiliaryTablesWorkbook", () => {
  it("identifica códigos nas abas de fonte e subelemento", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["TABELA AUXILIAR:", "Fonte"], [], [], [],
      ["CÓDIGO", "NOME", "ESPECIFICAÇÃO"],
      ["01", "Tesouro", "Recursos próprios"],
    ]), "Fonte de Recurso");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      [], ["", "CODIFICAÇÃO", "NOME DO CÓDIGO", "FUNÇÃO"],
      ["", "33904001", "Serviços de tecnologia", "Serviços de TI"],
    ]), "Class.Desp Subelemento");
    const result = parseAuxiliaryTablesWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
    expect(result.records).toEqual(expect.arrayContaining([
      expect.objectContaining({ tipo: "FONTE_RECURSO", codigo: "01", nome: "Tesouro" }),
      expect.objectContaining({ tipo: "SUBELEMENTO_DESPESA", codigo: "33904001", nome: "Serviços de tecnologia" }),
    ]));
  });
});
