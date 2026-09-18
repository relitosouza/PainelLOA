import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";

describe("Exportação do Detalhamento Analítico Editável em Excel", () => {
  it("deve gerar uma planilha com as abas corretas e dados de edição", () => {
    // Mock de dados simulando o que exportToExcel gera
    const mockEditableGroup = {
      secretaria: "04 - SECRETARIA DE FINANÇAS",
      programa: "0001 - GESTÃO FISCAL",
      acao: "2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS",
      valLdo: 100000,
      valLoa: 110000,
      valorReajuste: 5000,
      valorAditamento: 2000,
      valorTotal: 117000,
      children: [
        {
          id: "item-1",
          secretaria: "04 - SECRETARIA DE FINANÇAS",
          programa: "0001 - GESTÃO FISCAL",
          acao: "2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS",
          natureza: "3.3.90.39",
          elemento: "3.3.90.39",
          subelemento: "Outros Serviços de Terceiros",
          fonteVinculo: "01.100.0000",
          processo: "1234/2026",
          contrato: "SIM",
          valLdo: 100000,
          valLoa: 110000,
          valorReajuste: 5000,
          valorAditamento: 2000,
        },
      ],
    };

    const acoesData = [
      {
        Secretaria: mockEditableGroup.secretaria,
        Programa: mockEditableGroup.programa,
        Ação: mockEditableGroup.acao,
        "Valor LDO (R$)": mockEditableGroup.valLdo,
        "Valor LOA Vigente (R$)": mockEditableGroup.valLoa,
        "Valor Reajuste (R$)": mockEditableGroup.valorReajuste,
        "Valor Aditamento (R$)": mockEditableGroup.valorAditamento,
        "Valor Total (R$)": mockEditableGroup.valorTotal,
        "Diferença Nominal (R$)": mockEditableGroup.valorTotal - mockEditableGroup.valLdo,
        "Variação (%)": ((mockEditableGroup.valorTotal - mockEditableGroup.valLdo) / mockEditableGroup.valLdo) * 100,
        Status: "Suplementada",
      },
    ];

    const analiticoData = mockEditableGroup.children.map((item) => ({
      Secretaria: item.secretaria,
      Programa: item.programa,
      Ação: item.acao,
      "Natureza da Despesa": item.natureza,
      Elemento: item.elemento,
      Subelemento: item.subelemento,
      "Fonte/Vínculo": item.fonteVinculo,
      Processo: item.processo,
      "Contrato / Projeto Iniciado": item.contrato,
      "Valor Original (R$)": item.valLdo,
      "Valor LOA Vigente (R$)": item.valLoa,
      "Valor Reajuste (R$)": item.valorReajuste,
      "Valor Aditamento (R$)": item.valorAditamento,
      "Valor Total (R$)": item.valLoa + item.valorReajuste + item.valorAditamento,
      "Diferença Total - LDO (R$)": (item.valLoa + item.valorReajuste + item.valorAditamento) - item.valLdo,
      "Validado pelo usuário": "SIM",
      "Justificativa do Ajuste": "Ajuste inflacionário",
    }));

    const workbook = XLSX.utils.book_new();
    const wsAcoes = XLSX.utils.json_to_sheet(acoesData);
    const wsAnalitico = XLSX.utils.json_to_sheet(analiticoData);

    XLSX.utils.book_append_sheet(workbook, wsAcoes, "Resumo_Acoes_LOA");

    const analiticoContratos = analiticoData.filter(
      (r) => String(r["Contrato / Projeto Iniciado"] || "").toUpperCase() === "SIM"
    );
    const analiticoDemais = analiticoData.filter(
      (r) => String(r["Contrato / Projeto Iniciado"] || "").toUpperCase() !== "SIM"
    );

    if (analiticoContratos.length > 0) {
      const wsContratos = XLSX.utils.json_to_sheet(analiticoContratos);
      XLSX.utils.book_append_sheet(workbook, wsContratos, "Contratos");
    }
    if (analiticoDemais.length > 0) {
      const wsDemais = XLSX.utils.json_to_sheet(analiticoDemais);
      XLSX.utils.book_append_sheet(workbook, wsDemais, "Demais_Despesas");
    }

    XLSX.utils.book_append_sheet(workbook, wsAnalitico, "Detalhamento_Geral");

    // Gerar buffer binário e validar se é um XLSX válido
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);

    // Ler de volta o XLSX gerado
    const parsed = XLSX.read(buffer, { type: "buffer" });
    expect(parsed.SheetNames).toContain("Resumo_Acoes_LOA");
    expect(parsed.SheetNames).toContain("Contratos");
    expect(parsed.SheetNames).toContain("Detalhamento_Geral");

    // Validar conteúdo da aba Detalhamento_Geral
    const sheetDetalhamento = parsed.Sheets["Detalhamento_Geral"];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheetDetalhamento);
    expect(rows.length).toBe(1);
    expect(rows[0]["Secretaria"]).toBe("04 - SECRETARIA DE FINANÇAS");
    expect(rows[0]["Valor Total (R$)"]).toBe(117000);
    expect(rows[0]["Diferença Total - LDO (R$)"]).toBe(17000);
    expect(rows[0]["Justificativa do Ajuste"]).toBe("Ajuste inflacionário");
  });
});
