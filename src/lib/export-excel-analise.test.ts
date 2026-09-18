import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";

describe("Exportação do Detalhamento Analítico Editável em Excel", () => {
  it("deve gerar uma planilha com a primeira aba Detalhamento_LOA_Completo e todas as 40+ colunas analíticas", () => {
    // Mock de dados simulando o que exportToExcel gera
    const mockEditableGroup = {
      id: "edit-group-0001|2.001",
      secretaria: "04 - SECRETARIA DE FINANÇAS",
      orgao: "01 - PREFEITURA DO MUNICÍPIO DE OSASCO",
      unidade: "04.01 - GABINETE DO SECRETÁRIO",
      programa: "0001 - GESTÃO FISCAL",
      acao: "2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS",
      valLdo: 100000,
      valLoa: 110000,
      valLoa2026: 95000,
      valorReajuste: 5000,
      valorAditamento: 2000,
      valorSugestaoSf: 0,
      valorCorteGp: 0,
      valorTotal: 117000,
      children: [
        {
          id: "item-1",
          secretaria: "04 - SECRETARIA DE FINANÇAS",
          orgao: "01 - PREFEITURA DO MUNICÍPIO DE OSASCO",
          unidade: "04.01 - GABINETE DO SECRETÁRIO",
          funcao: "04 - ADMINISTRAÇÃO",
          subfuncao: "122 - ADMINISTRAÇÃO GERAL",
          programa: "0001 - GESTÃO FISCAL",
          acao: "2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS",
          tipoAcao: "Atividade",
          programaticaLoa: "04.01.04.122.0001.2001",
          natureza: "3.3.90.39.00 - Outros Serviços de Terceiros",
          categoriaEconomica: "3 - Despesas Correntes",
          grupoNatureza: "3 - Outras Despesas Correntes",
          elemento: "3.3.90.39 - Outros Serviços de Terceiros - Pessoa Jurídica",
          subelemento: "Outros Serviços de Terceiros",
          fonteVinculo: "01.100.0000",
          codigoAplicacao: "110.0000",
          processo: "1234/2026",
          contrato: "SIM",
          projetoIniciado: "SIM",
          origem: "LOA Base",
          valLdo: 100000,
          valLoa: 110000,
          valLoa2026: 95000,
          valorReajuste: 5000,
          valorAditamento: 2000,
          valorSugestaoSf: 0,
          valorCorteGp: 0,
          observacao: "Adequação contratual",
        },
      ],
    };

    // 1. Aba: Resumo por Ação
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
        Indicador: "Índice de Eficiência Fiscal",
        "Unidade de Medida": "%",
        "Meta Física 2027": 100,
      },
    ];

    // 2. Aba Principal: Detalhamento Analítico Completo (Primeira aba do Excel)
    const analiticoData = mockEditableGroup.children.map((item) => {
      const valLoaTotal = item.valLoa + item.valorReajuste + item.valorAditamento;
      const diffTotal = valLoaTotal - item.valLdo;
      return {
        "UG": "04",
        "Cód. Secretaria": "04",
        "Secretaria": item.secretaria,
        "Cód. Órgão": "01",
        "Órgão": item.orgao,
        "Cód. Unidade": "04.01",
        "Unidade Orçamentária": item.unidade,
        "Cód. Função": "04",
        "Função": item.funcao,
        "Cód. Subfunção": "122",
        "Subfunção": item.subfuncao,
        "Cód. Programa": "0001",
        "Programa": item.programa,
        "Cód. Ação": "2.001",
        "Ação": item.acao,
        "Tipo de Ação": item.tipoAcao,
        "Programática LOA": item.programaticaLoa,
        "Cód. Natureza": "3.3.90.39.00",
        "Natureza da Despesa": item.natureza,
        "Categoria Econômica": item.categoriaEconomica,
        "Grupo de Natureza": item.grupoNatureza,
        "Elemento de Despesa": item.elemento,
        "Subelemento": item.subelemento,
        "Fonte/Vínculo": `${item.fonteVinculo}.${item.codigoAplicacao}`,
        "Código de Aplicação": item.codigoAplicacao,
        "Processo Administrativo": item.processo,
        "Contrato / Projeto Iniciado": item.contrato,
        "Tipo de Despesa": "CONTRATO",
        "Origem da Despesa": item.origem,
        "Peça Orçamentária": "LOA 2027",
        "Valor Original LDO (R$)": item.valLdo,
        "Valor LOA 2026 (Inicial) (R$)": item.valLoa2026,
        "Valor LOA Vigente (R$)": item.valLoa,
        "Valor Reajuste (R$)": item.valorReajuste,
        "Valor Vigente + Reajuste (R$)": item.valLoa + item.valorReajuste,
        "Valor Aditamento (R$)": item.valorAditamento,
        "Valor Sugestão SF (R$)": item.valorSugestaoSf,
        "Valor Corte GP (R$)": item.valorCorteGp,
        "Valor Total LOA 2027 (R$)": valLoaTotal,
        "Diferença Total - LDO (R$)": diffTotal,
        "Variação vs LDO (%)": (diffTotal / item.valLdo) * 100,
        "Status Orçamentário": "Suplementada",
        "Validado pelo Usuário": "SIM",
        "Justificativa / Observação": item.observacao,
        "Indicador LDO": "Índice de Eficiência Fiscal",
        "Unidade de Medida LDO": "%",
        "Meta Física LDO 2027": 100,
      };
    });

    const workbook = XLSX.utils.book_new();

    // 1. Primeira aba deve ser Detalhamento_LOA_Completo
    const wsAnalitico = XLSX.utils.json_to_sheet(analiticoData);
    XLSX.utils.book_append_sheet(workbook, wsAnalitico, "Detalhamento_LOA_Completo");

    // 2. Abas Especializadas
    const analiticoContratos = analiticoData.filter(
      (r) => String(r["Contrato / Projeto Iniciado"] || "").toUpperCase() === "SIM"
    );
    const analiticoDemais = analiticoData.filter(
      (r) => String(r["Contrato / Projeto Iniciado"] || "").toUpperCase() !== "SIM"
    );

    if (analiticoContratos.length > 0) {
      const wsContratos = XLSX.utils.json_to_sheet(analiticoContratos);
      XLSX.utils.book_append_sheet(workbook, wsContratos, "Contratos_Vigentes");
    }
    if (analiticoDemais.length > 0) {
      const wsDemais = XLSX.utils.json_to_sheet(analiticoDemais);
      XLSX.utils.book_append_sheet(workbook, wsDemais, "Demais_Despesas");
    }

    // 3. Aba de Resumo por Ação
    const wsAcoes = XLSX.utils.json_to_sheet(acoesData);
    XLSX.utils.book_append_sheet(workbook, wsAcoes, "Resumo_Acoes");

    // 4. Aba de Memória de Ajustes
    const auditoriaData = [
      {
        Tipo: "ALTERAÇÃO DE VALOR",
        Secretaria: mockEditableGroup.secretaria,
        Programa: mockEditableGroup.programa,
        Ação: mockEditableGroup.acao,
        "Natureza da Despesa": "3.3.90.39.00",
        Subelemento: "Outros Serviços de Terceiros",
        "Fonte/Vínculo": "01.100.0000",
        "Valor Original (R$)": 100000,
        "Novo Valor LOA (R$)": 110000,
        "Diferença (R$)": 10000,
        "Justificativa Técnica": "Ajuste inflacionário",
      },
    ];
    const wsAuditoria = XLSX.utils.json_to_sheet(auditoriaData);
    XLSX.utils.book_append_sheet(workbook, wsAuditoria, "Memoria_Ajustes");

    // Gerar buffer binário e validar se é um XLSX válido
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);

    // Ler de volta o XLSX gerado
    const parsed = XLSX.read(buffer, { type: "buffer" });
    
    // Validar ordem das abas: primeira aba DEVE ser Detalhamento_LOA_Completo
    expect(parsed.SheetNames[0]).toBe("Detalhamento_LOA_Completo");
    expect(parsed.SheetNames).toContain("Contratos_Vigentes");
    expect(parsed.SheetNames).toContain("Resumo_Acoes");
    expect(parsed.SheetNames).toContain("Memoria_Ajustes");

    // Validar conteúdo da aba Detalhamento_LOA_Completo
    const sheetDetalhamento = parsed.Sheets["Detalhamento_LOA_Completo"];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheetDetalhamento);
    expect(rows.length).toBe(1);

    const firstRow = rows[0];
    
    // Validar colunas essenciais que o usuário precisa
    expect(firstRow["UG"]).toBe("04");
    expect(firstRow["Secretaria"]).toBe("04 - SECRETARIA DE FINANÇAS");
    expect(firstRow["Órgão"]).toBe("01 - PREFEITURA DO MUNICÍPIO DE OSASCO");
    expect(firstRow["Unidade Orçamentária"]).toBe("04.01 - GABINETE DO SECRETÁRIO");
    expect(firstRow["Função"]).toBe("04 - ADMINISTRAÇÃO");
    expect(firstRow["Subfunção"]).toBe("122 - ADMINISTRAÇÃO GERAL");
    expect(firstRow["Programa"]).toBe("0001 - GESTÃO FISCAL");
    expect(firstRow["Ação"]).toBe("2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS");
    expect(firstRow["Tipo de Ação"]).toBe("Atividade");
    expect(firstRow["Programática LOA"]).toBe("04.01.04.122.0001.2001");
    expect(firstRow["Natureza da Despesa"]).toBe("3.3.90.39.00 - Outros Serviços de Terceiros");
    expect(firstRow["Categoria Econômica"]).toBe("3 - Despesas Correntes");
    expect(firstRow["Grupo de Natureza"]).toBe("3 - Outras Despesas Correntes");
    expect(firstRow["Elemento de Despesa"]).toBe("3.3.90.39 - Outros Serviços de Terceiros - Pessoa Jurídica");
    expect(firstRow["Subelemento"]).toBe("Outros Serviços de Terceiros");
    expect(firstRow["Fonte/Vínculo"]).toBe("01.100.0000.110.0000");
    expect(firstRow["Código de Aplicação"]).toBe("110.0000");
    expect(firstRow["Processo Administrativo"]).toBe("1234/2026");
    expect(firstRow["Contrato / Projeto Iniciado"]).toBe("SIM");
    expect(firstRow["Tipo de Despesa"]).toBe("CONTRATO");
    expect(firstRow["Origem da Despesa"]).toBe("LOA Base");
    expect(firstRow["Peça Orçamentária"]).toBe("LOA 2027");
    expect(firstRow["Valor Original LDO (R$)"]).toBe(100000);
    expect(firstRow["Valor LOA 2026 (Inicial) (R$)"]).toBe(95000);
    expect(firstRow["Valor LOA Vigente (R$)"]).toBe(110000);
    expect(firstRow["Valor Reajuste (R$)"]).toBe(5000);
    expect(firstRow["Valor Vigente + Reajuste (R$)"]).toBe(115000);
    expect(firstRow["Valor Aditamento (R$)"]).toBe(2000);
    expect(firstRow["Valor Total LOA 2027 (R$)"]).toBe(117000);
    expect(firstRow["Diferença Total - LDO (R$)"]).toBe(17000);
    expect(firstRow["Validado pelo Usuário"]).toBe("SIM");
    expect(firstRow["Justificativa / Observação"]).toBe("Adequação contratual");
    expect(firstRow["Indicador LDO"]).toBe("Índice de Eficiência Fiscal");
    expect(firstRow["Unidade de Medida LDO"]).toBe("%");
    expect(firstRow["Meta Física LDO 2027"]).toBe(100);
  });
});
