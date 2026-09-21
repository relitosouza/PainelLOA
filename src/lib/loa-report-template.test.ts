import { describe, it, expect } from "vitest";
import { generateLoaReportHtml, shouldExcludeReportVinculo, type LoaReportData } from "./loa-report-template";

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
    expect(html).toContain("Somatório integrado de Contratos, Demais Despesas e Banco de Projetos");
    expect(html).toContain("Valor Solicitado");
    expect(html).toContain("Ajuste SF");
    expect(html).toContain("Corte GP");
    // O card LDO deve permanecer no cabeçalho financeiro
    expect(html).toContain("Valor LDO");
    // Mas não deve haver coluna Valor LDO no thead da tabela
    expect(html).not.toContain("<th class=\"font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right\">Valor LDO</th>");
  });

  it("deve remover a coluna Valor LDO da tabela, manter o card, renomear LOA para Valor Solicitado e calcular total com Ajuste SF e Corte GP", () => {
    const reportData: LoaReportData = {
      tituloSecretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS",
      exercicio: "2027",
      totals: {
        ldo: 100000,
        loa: 50000,
        reajuste: 5000,
        aditamento: 2000,
        ajusteSf: 3000,
        corteGp: -1000,
        total: 59000, // 50000 + 5000 + 2000 + 3000 + (-1000)
      },
      groups: [
        {
          groupTitle: "Ação de Teste",
          valLdo: 100000,
          valLoa: 50000,
          valorReajuste: 5000,
          valorAditamento: 2000,
          valorAjusteSf: 3000,
          valorCorteGp: -1000,
          valorTotal: 59000,
          items: [
            {
              natureza: "3.3.90.39.00",
              vinculo: "01.110.0000",
              valLoa: 50000,
              valorReajuste: 5000,
              valorAditamento: 2000,
              valorAjusteSf: 3000,
              valorCorteGp: -1000,
              valorTotal: 59000,
            },
          ],
        },
      ],
    };

    const html = generateLoaReportHtml(reportData);

    // Card LDO preservado
    expect(html).toContain("Valor LDO");
    expect(html).toMatch(/R\$\s*100\.000,00/);

    // Coluna LOA renomeada para Valor Solicitado
    expect(html).toContain("Valor Solicitado");

    // Colunas Ajuste SF e Corte GP presentes
    expect(html).toContain("Ajuste SF");
    expect(html).toContain("Corte GP");

    // Total correspondente a Valor LOA + Reajuste + Aditamento + Ajuste SF + Corte GP = 59.000,00
    expect(html).toContain("59.000,00");

    // Sem a coluna Valor LDO no thead
    expect(html).not.toMatch(/<th[^>]*>Valor LDO<\/th>/);
  });

  it("deve gerar relatório com 3 seções segregadas incluindo Banco de Projetos Alocados", () => {
    const reportData: LoaReportData = {
      tituloSecretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS",
      exercicio: "2027",
      reportScopeTitle: "Consolidado · Contratos, Demais Despesas e Banco de Projetos",
      totals: {
        ldo: 0,
        loa: 180000,
        reajuste: 0,
        aditamento: 0,
        total: 180000,
      },
      sections: [
        {
          sectionKey: "contratos",
          sectionTitle: "1. Despesas com Contratos e Projetos Iniciados",
          sectionBadge: "Contratos Vigentes",
          sectionIcon: "description",
          totals: { ldo: 0, loa: 50000, reajuste: 0, aditamento: 0, total: 50000 },
          groups: [],
        },
        {
          sectionKey: "demais",
          sectionTitle: "2. Demais Despesas Orçamentárias",
          sectionBadge: "Operacional / Demais",
          sectionIcon: "folder_open",
          totals: { ldo: 0, loa: 70000, reajuste: 0, aditamento: 0, total: 70000 },
          groups: [],
        },
        {
          sectionKey: "banco-projetos",
          sectionTitle: "3. Banco de Projetos Alocados",
          sectionBadge: "Novos Projetos / Alocados",
          sectionIcon: "account_tree",
          totals: { ldo: 0, loa: 60000, reajuste: 0, aditamento: 0, total: 60000 },
          groups: [],
        },
      ],
    };

    const html = generateLoaReportHtml(reportData);
    expect(html).toContain("1. Despesas com Contratos e Projetos Iniciados");
    expect(html).toContain("2. Demais Despesas Orçamentárias");
    expect(html).toContain("3. Banco de Projetos Alocados");
    expect(html).toContain("Novos Projetos / Alocados");
    expect(html).toContain("account_tree");
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

  it("deve excluir vínculos no formato 00.00 (5 caracteres) exceto se for Banco de Projetos", () => {
    // Vínculo no formato 00.00 (5 caracteres) normal -> DEVE excluir
    expect(shouldExcludeReportVinculo("01.00", false)).toBe(true);
    expect(shouldExcludeReportVinculo("99.99", false)).toBe(true);
    expect(shouldExcludeReportVinculo(" 02.10 ", false)).toBe(true);

    // Banco de projetos com formato 00.00 -> NÃO deve excluir
    expect(shouldExcludeReportVinculo("01.00", true)).toBe(false);

    // Vínculos completos com 11 caracteres (ex: 01.110.0000) -> NÃO deve excluir
    expect(shouldExcludeReportVinculo("01.110.0000", false)).toBe(false);
    expect(shouldExcludeReportVinculo("02.500.0000", false)).toBe(false);

    // Outros formatos (ex: apenas 01 ou Tesouro / Próprio) -> NÃO deve excluir
    expect(shouldExcludeReportVinculo("01", false)).toBe(false);
    expect(shouldExcludeReportVinculo("Tesouro / Próprio", false)).toBe(false);
    expect(shouldExcludeReportVinculo(undefined, false)).toBe(false);
  });

  it("deve gerar Capa Executiva (Página 1) completa com Painel da Receita, Despesa e Resultado quando todas as secretarias forem impressas", () => {
    const reportData: LoaReportData = {
      tituloSecretaria: "Consolidado Geral do Município",
      unidadeOrcamentaria: "Todas as Unidades Orçamentárias",
      isAllSecretariats: true,
      secretariasList: [
        "11 - SECRETARIA DE SERVIÇOS E OBRAS",
        "08 - SECRETARIA DE EDUCAÇÃO",
        "09 - SECRETARIA DA SAÚDE",
        "02 - GABINETE DO PREFEITO",
      ],
      exercicio: "2027",
      totals: {
        ldo: 200000,
        loa: 100000,
        reajuste: 5000,
        aditamento: 2000,
        ajusteSf: 1000,
        corteGp: -500,
        total: 107500,
      },
      executiveDashboard: {
        receita: {
          ldoTotal: 5868871609.9,
          loaTotal: 6000000000,
          diff: 131128390.1,
          percentExec: 102.23,
          maiorReceita: { natureza: "1.1.1.8.01.1.1 - IPTU", valor: 1200000000 },
          qtdFontes: 45,
          prefeitura: 5500000000,
          indiretas: 500000000,
        },
        despesa: {
          ldoTotal: 5868871609.9,
          loaTotal: 5900000000,
          diff: 31128390.1,
          percentExec: 100.53,
          reajuste: 50000000,
          aditamento: 20000000,
          ajusteSf: 15000000,
          corteGp: -10000000,
          totalGeral: 5975000000,
          totalNaturezas: 350,
        },
        resultado: {
          ldoResultado: 0,
          loaResultado: 25000000,
          isLdoSuperavit: true,
          isLoaSuperavit: true,
        },
      },
      groups: [],
    };

    const html = generateLoaReportHtml(reportData);
    // Deve conter a Capa Executiva
    expect(html).toContain("executive-cover-page");
    expect(html).toContain("Painel Executivo Orçamentário · Exercício 2027");
    expect(html).toContain("1. Painel da Receita Orçamentária");
    expect(html).toContain("2. Painel da Despesa Orçamentária");
    expect(html).toContain("3. Painel de Resultado · Equilíbrio Orçamentário");
    // Cards removidos a pedido do usuário
    expect(html).not.toContain("Maior Receita LOA");
    expect(html).not.toContain("Total Fontes / Vínculos");
    expect(html).toContain("Superávit LOA");
    expect(html).toContain("Capa Executiva Consolidada");
    // Discriminações em Valor Solicitado e Total Final LOA
    expect(html).toContain("Base:");
    expect(html).toContain("Proposta:");
  });

  it("deve separar visualmente por secretaria com cards individuais e quebra de página (Opção A)", () => {
    const reportData: LoaReportData = {
      tituloSecretaria: "Consolidado Geral do Município",
      isAllSecretariats: true,
      totals: {
        ldo: 0,
        loa: 150000,
        reajuste: 0,
        aditamento: 0,
        total: 150000,
      },
      groups: [
        {
          groupTitle: "Ação Obras 01",
          secretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS",
          valLdo: 0,
          valLoa: 100000,
          valorReajuste: 0,
          valorAditamento: 0,
          valorTotal: 100000,
          items: [
            {
              natureza: "4.4.90.51.00",
              vinculo: "01.110.0000",
              valLoa: 100000,
              valorTotal: 100000,
            },
          ],
        },
        {
          groupTitle: "Ação Educação 01",
          secretaria: "08 - SECRETARIA DE EDUCAÇÃO",
          valLdo: 0,
          valLoa: 50000,
          valorReajuste: 0,
          valorAditamento: 0,
          valorTotal: 50000,
          items: [
            {
              natureza: "3.3.90.30.00",
              vinculo: "01.200.0000",
              valLoa: 50000,
              valorTotal: 50000,
            },
          ],
        },
      ],
    };

    const html = generateLoaReportHtml(reportData);
    // Deve conter blocos segregados por secretaria com cards de indicadores
    expect(html).toContain("secretaria-report-block");
    expect(html).toContain("11 - SECRETARIA DE SERVIÇOS E OBRAS");
    expect(html).toContain("08 - SECRETARIA DE EDUCAÇÃO");
    expect(html).toContain("Total Pasta LOA");
    expect(html).toContain("Valor Solicitado");
    expect(html).toContain("Ação Obras 01");
    expect(html).toContain("Ação Educação 01");
  });
});

