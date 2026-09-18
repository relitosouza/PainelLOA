import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { processDetalhamentoWorkbook, parseExcelNumber } from "./import-detalhamento-excel";
import type { RawBudgetItem } from "./loa-analise-items";

describe("Importação do Detalhamento LOA Completo via Excel", () => {
  it("deve converter formatos de moeda brasileira e números corretamente", () => {
    expect(parseExcelNumber("R$ 150.000,50")).toBe(150000.5);
    expect(parseExcelNumber("120.000,00")).toBe(120000);
    expect(parseExcelNumber(50000)).toBe(50000);
    expect(parseExcelNumber("0,00")).toBe(0);
    expect(parseExcelNumber("")).toBe(0);
    expect(parseExcelNumber(undefined)).toBe(0);
  });

  it("deve ler o workbook e reconciliar alterações de valores e dados cadastrais", () => {
    const baseItems: RawBudgetItem[] = [
      {
        id: "item-fin-001",
        progKey: "2.001|3.3.90.39|Serviços Técnicos",
        secretaria: "04 - SECRETARIA DE FINANÇAS",
        orgao: "01 - PREFEITURA DO MUNICÍPIO DE OSASCO",
        unidade: "04.01 - GABINETE DO SECRETÁRIO",
        programa: "0001 - GESTÃO FISCAL",
        acao: "2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS",
        tipoAcao: "Atividade",
        natureza: "3.3.90.39.00 - Outros Serviços",
        elemento: "3.3.90.39",
        subelemento: "Serviços Técnicos",
        fonteVinculo: "01",
        categoriaEconomica: "3",
        grupoNatureza: "3",
        processo: "100/2026",
        valLdo: 100000,
        valLoa: 100000,
        valorReajuste: 0,
        valorAditamento: 0,
        valorSugestaoSf: 0,
        valorCorteGp: 0,
        projetoIniciado: "NÃO",
        observacao: "",
      },
      {
        id: "item-saude-002",
        progKey: "2.002|3.3.90.30|Medicamentos",
        secretaria: "08 - SECRETARIA DE SAÚDE",
        orgao: "01 - PREFEITURA DO MUNICÍPIO DE OSASCO",
        unidade: "08.01 - FUNDO MUNICIPAL DE SAÚDE",
        programa: "0002 - ATENÇÃO BÁSICA",
        acao: "2.002 - DISTRIBUIÇÃO DE MEDICAMENTOS",
        tipoAcao: "Atividade",
        natureza: "3.3.90.30.00 - Material de Consumo",
        elemento: "3.3.90.30",
        subelemento: "Medicamentos Básicos",
        fonteVinculo: "05",
        categoriaEconomica: "3",
        grupoNatureza: "3",
        processo: "200/2026",
        valLdo: 500000,
        valLoa: 500000,
        valorReajuste: 0,
        valorAditamento: 0,
        valorSugestaoSf: 0,
        valorCorteGp: 0,
        projetoIniciado: "SIM",
        observacao: "Contrato em vigor",
      },
    ];

    // Criar uma planilha simulando a exportação preenchida pelo usuário com novos valores
    const excelRows = [
      {
        "ID": "item-fin-001",
        "UG": "04",
        "Secretaria": "04 - SECRETARIA DE FINANÇAS",
        "Programa": "0001 - GESTÃO FISCAL",
        "Ação": "2.001 - MANUTENÇÃO DOS SERVIÇOS TÉCNICOS",
        "Natureza da Despesa": "3.3.90.39.00 - Outros Serviços",
        "Elemento de Despesa": "3.3.90.39",
        "Subelemento": "Serviços Técnicos",
        "Fonte/Vínculo": "01",
        "Código de Aplicação": "110.0000",
        "Processo Administrativo": "100/2026-REV",
        "Contrato / Projeto Iniciado": "SIM",
        "Valor Original LDO (R$)": 100000,
        "Valor LOA Vigente (R$)": "115.000,00", // alterou de 100k para 115k
        "Valor Reajuste (R$)": "5.000,00", // novo reajuste
        "Valor Aditamento (R$)": "2.500,00", // novo aditamento
        "Valor Sugestão SF (R$)": "0,00",
        "Valor Corte GP (R$)": "0,00",
        "Validado pelo Usuário": "SIM",
        "Justificativa / Observação": "Reajuste anual acordado em comissão",
      },
      {
        // Sem a coluna ID para testar o casamento resiliente pela chave funcional
        "UG": "08",
        "Secretaria": "08 - SECRETARIA DE SAÚDE",
        "Programa": "0002 - ATENÇÃO BÁSICA",
        "Ação": "2.002 - DISTRIBUIÇÃO DE MEDICAMENTOS",
        "Natureza da Despesa": "3.3.90.30.00 - Material de Consumo",
        "Elemento de Despesa": "3.3.90.30",
        "Subelemento": "Medicamentos Básicos",
        "Fonte/Vínculo": "05",
        "Processo Administrativo": "200/2026",
        "Valor Original LDO (R$)": 500000,
        "Valor LOA Vigente (R$)": 500000,
        "Valor Reajuste (R$)": 0,
        "Valor Aditamento (R$)": 0,
        "Valor Sugestão SF (R$)": "50.000,00", // nova sugestão SF
        "Valor Corte GP (R$)": "10.000,00", // novo corte GP
        "Validado pelo Usuário": "NÃO",
        "Justificativa / Observação": "Adequação de metas do FMS",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Detalhamento_LOA_Completo");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    // Processar o arquivo
    const result = processDetalhamentoWorkbook(buffer, baseItems);

    expect(result.success).toBe(true);
    expect(result.totalLinhasLidas).toBe(2);
    expect(result.correspondencias).toBe(2);
    expect(result.itensModificados).toBe(2);

    // Verificar alterações no item 1
    const updatedItem1 = result.updatedRawItems.find((i) => i.id === "item-fin-001");
    expect(updatedItem1).toBeDefined();
    expect(updatedItem1!.valLoa).toBe(115000);
    expect(updatedItem1!.valorReajuste).toBe(5000);
    expect(updatedItem1!.valorAditamento).toBe(2500);
    expect(updatedItem1!.processo).toBe("100/2026-REV");
    expect(updatedItem1!.codigoAplicacao).toBe("110.0000");
    expect(updatedItem1!.projetoIniciado).toBe("SIM");
    expect(updatedItem1!.observacao).toBe("Reajuste anual acordado em comissão");

    // Verificar validação e justificativas
    expect(result.validatedRows["item-fin-001"]).toBe(true);
    expect(result.justifications["item-fin-001"]).toBe("Reajuste anual acordado em comissão");

    // Verificar customEdits como NÚMERO PURO (Record<string, number>)
    expect(result.customEdits["item-fin-001"]).toBe(115000);
    expect(typeof result.customEdits["item-fin-001"]).toBe("number");

    // Verificar item 2 (casamento sem ID)
    const updatedItem2 = result.updatedRawItems.find((i) => i.id === "item-saude-002");
    expect(updatedItem2).toBeDefined();
    expect(updatedItem2!.valorSugestaoSf).toBe(50000);
    expect(updatedItem2!.valorCorteGp).toBe(10000);
    expect(result.validatedRows["item-saude-002"]).toBe(false);
  });

  it("deve reconhecer nova linha adicionada pelo usuário e mapeá-la em addedExpenses", () => {
    const baseItems: RawBudgetItem[] = [
      {
        id: "item-base-1",
        progKey: "2.001|3.3.90.39|Serviços",
        secretaria: "04 - SECRETARIA DE FINANÇAS",
        programa: "0001 - GESTÃO FISCAL",
        acao: "2.001 - MANUTENÇÃO DOS SERVIÇOS",
        tipoAcao: "Atividade",
        natureza: "3.3.90.39.00 - Outros Serviços",
        elemento: "3.3.90.39",
        subelemento: "Serviços",
        valLdo: 50000,
        valLoa: 50000,
      },
    ];

    // Planilha contendo o item existente e uma NOVA LINHA que não existe no sistema
    const excelRows = [
      {
        "ID": "item-base-1",
        "Secretaria": "04 - SECRETARIA DE FINANÇAS",
        "Programa": "0001 - GESTÃO FISCAL",
        "Ação": "2.001 - MANUTENÇÃO DOS SERVIÇOS",
        "Natureza da Despesa": "3.3.90.39.00 - Outros Serviços",
        "Valor Vigente": "60.000,00", // alteração de valor com nome de coluna flexível
      },
      {
        // NOVA LINHA (sem ID existente)
        "Secretaria": "08 - SECRETARIA DE SAÚDE",
        "Programa": "0002 - ATENÇÃO BÁSICA",
        "Ação": "1.005 - REFORMA DE UBS",
        "Natureza da Despesa": "4.4.90.51.00 - Obras e Instalações",
        "Elemento de Despesa": "4.4.90.51",
        "Subelemento": "Reforma e Ampliação",
        "Fonte/Vínculo": "02.100.0000",
        "Valor Total LOA 2027 (R$)": "250.000,00",
        "Valor Reajuste (R$)": "10.000,00",
        "Contrato / Projeto Iniciado": "SIM",
        "Justificativa / Observação": "Nova dotação solicitada pelo FMS",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Detalhamento_LOA_Completo");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = processDetalhamentoWorkbook(buffer, baseItems);

    expect(result.success).toBe(true);
    expect(result.totalLinhasLidas).toBe(2);
    expect(result.correspondencias).toBe(2);
    expect(result.itensModificados).toBe(2);

    // Validação da alteração no item base com coluna flexível "Valor Vigente"
    expect(result.customEdits["item-base-1"]).toBe(60000);

    // Validação da nova despesa em addedExpenses
    expect(result.addedExpenses).toHaveLength(1);
    const added = result.addedExpenses[0];
    expect(added.secretaria).toBe("08 - SECRETARIA DE SAÚDE");
    expect(added.acao).toBe("1.005 - REFORMA DE UBS");
    expect(added.natureza).toBe("4.4.90.51.00 - Obras e Instalações");
    expect(added.elemento).toBe("4.4.90.51");
    expect(added.subelemento).toBe("Reforma e Ampliação");
    expect(added.valorReajuste).toBe(10000);
    // 250k total - 10k reajuste = 240k valorLoa
    expect(added.valLoa).toBe(240000);
    expect(added.projetoIniciado).toBe("SIM");
    expect(added.observacao).toBe("Nova dotação solicitada pelo FMS");
    expect(result.updatedRawItems).toHaveLength(2);
  });
});
