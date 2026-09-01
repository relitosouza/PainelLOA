import { describe, it, expect } from "vitest";
import { generateLoaReportHtml, type LoaReportData } from "./loa-report-template";

describe("LoaReportTemplate", () => {
  it("deve gerar relatório com 2 seções segregadas de Contratos e Demais Despesas", () => {
    const reportData: LoaReportData = {
      tituloSecretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS",
      unidadeOrcamentaria: "01.11.001.00 - Gabinete",
      orgao: "Órgão 01",
      exercicio: "2027",
      hasAdjustments: true,
      reportScopeTitle: "Consolidado · Contratos e Demais Despesas",
      totals: {
        ldo: 100000,
        loa: 120000,
        reajuste: 5000,
        aditamento: 0,
        total: 125000,
      },
      sections: [
        {
          sectionKey: "contratos",
          sectionTitle: "1. Despesas com Contratos e Projetos Iniciados",
          sectionBadge: "Contratos Vigentes",
          sectionIcon: "description",
          totals: {
            ldo: 0,
            loa: 50000,
            reajuste: 5000,
            aditamento: 0,
            total: 55000,
          },
          groups: [
            {
              groupTitle: "Manutenção de Prédios",
              valLdo: 0,
              valLoa: 50000,
              valorReajuste: 5000,
              valorAditamento: 0,
              valorTotal: 55000,
              items: [
                {
                  natureza: "3.3.90.39.00",
                  vinculo: "01.110.0000",
                  processoObs: "Proc: 1234/2026",
                  valLdo: 0,
                  valLoa: 50000,
                  valorReajuste: 5000,
                  valorAditamento: 0,
                  valorTotal: 55000,
                },
              ],
            },
          ],
        },
        {
          sectionKey: "demais",
          sectionTitle: "2. Demais Despesas Orçamentárias",
          sectionBadge: "Operacional / Demais",
          sectionIcon: "folder_open",
          totals: {
            ldo: 100000,
            loa: 70000,
            reajuste: 0,
            aditamento: 0,
            total: 70000,
          },
          groups: [
            {
              groupTitle: "Serviços Gerais",
              valLdo: 100000,
              valLoa: 70000,
              valorReajuste: 0,
              valorAditamento: 0,
              valorTotal: 70000,
              items: [
                {
                  natureza: "3.3.90.30.00",
                  vinculo: "01.110.0000",
                  processoObs: "Consumo",
                  valLdo: 0,
                  valLoa: 70000,
                  valorReajuste: 0,
                  valorAditamento: 0,
                  valorTotal: 70000,
                },
              ],
            },
          ],
        },
      ],
    };

    const html = generateLoaReportHtml(reportData);

    expect(html).toContain("1. Despesas com Contratos e Projetos Iniciados");
    expect(html).toContain("2. Demais Despesas Orçamentárias");
    expect(html).toContain("Contratos Vigentes");
    expect(html).toContain("Operacional / Demais");
    expect(html).toContain("Total Geral Consolidado (Secretaria)");
    expect(html).toContain("0,00"); // coluna LDO na linha zerada
  });

  it("deve gerar relatório de escopo único quando grupos diretos são informados", () => {
    const reportData: LoaReportData = {
      tituloSecretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS",
      exercicio: "2027",
      reportScopeTitle: "Apenas Contratos",
      totals: {
        ldo: 0,
        loa: 50000,
        reajuste: 0,
        aditamento: 0,
        total: 50000,
      },
      groups: [
        {
          groupTitle: "Ação Específica",
          valLdo: 0,
          valLoa: 50000,
          valorReajuste: 0,
          valorAditamento: 0,
          valorTotal: 50000,
          items: [
            {
              natureza: "3.3.90.39.00",
              vinculo: "01",
              valLdo: 0,
              valLoa: 50000,
              valorReajuste: 0,
              valorAditamento: 0,
              valorTotal: 50000,
            },
          ],
        },
      ],
    };

    const html = generateLoaReportHtml(reportData);
    expect(html).toContain("Apenas Contratos");
    expect(html).toContain("Ação Específica");
    expect(html).toContain("Total Geral");
  });
});
