import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const headers = [
      "CD_RECEITA",
      "NATUREZA_RECEITA",
      "DESCRICAO_RECEITA",
      "FONTE_RECURSO",
      "DESCRICAO_FONTE",
      "ORGAO_UNIDADE",
      "VALOR_ORCADO",
    ];

    const examples = [
      [
        "11120111",
        "1.1.1.2.01.1.1",
        "IPTU - Imposto Predial e Territorial Urbano",
        "01.110.0000",
        "Recursos Ordinários - Geral",
        "02.01 - Secretaria de Fazenda e Finanças",
        18500000.0,
      ],
      [
        "11180231",
        "1.1.1.8.02.3.1",
        "ISSQN - Imposto sobre Serviços de Qualquer Natureza",
        "01.110.0000",
        "Recursos Ordinários - Geral",
        "02.01 - Secretaria de Fazenda e Finanças",
        14200000.0,
      ],
      [
        "11180141",
        "1.1.1.8.01.4.1",
        "ITBI - Imposto sobre Transmissão de Bens Imóveis",
        "01.110.0000",
        "Recursos Ordinários - Geral",
        "02.01 - Secretaria de Fazenda e Finanças",
        6400000.0,
      ],
      [
        "17180121",
        "1.7.1.8.01.2.1",
        "Cota-Parte do FPM - Fundo de Participação dos Municípios",
        "01.110.0000",
        "Recursos Ordinários - Geral",
        "02.01 - Secretaria de Fazenda e Finanças",
        32000000.0,
      ],
      [
        "17180151",
        "1.7.1.8.01.5.1",
        "Transferências de Recursos do SUS - Atenção Básica",
        "01.310.0000",
        "Transferências e Convênios - Saúde",
        "02.03 - Fundo Municipal de Saúde",
        15800000.0,
      ],
      [
        "17580111",
        "1.7.5.8.01.1.1",
        "Transferências de Recursos do FUNDEB",
        "01.210.0000",
        "Transferências do FUNDEB - Educação",
        "02.02 - Secretaria Municipal de Educação",
        24600000.0,
      ],
      [
        "17280111",
        "1.7.2.8.01.1.1",
        "Cota-Parte do ICMS",
        "01.110.0000",
        "Recursos Ordinários - Geral",
        "02.01 - Secretaria de Fazenda e Finanças",
        28900000.0,
      ],
      [
        "17280121",
        "1.7.2.8.01.2.1",
        "Cota-Parte do IPVA",
        "01.110.0000",
        "Recursos Ordinários - Geral",
        "02.01 - Secretaria de Fazenda e Finanças",
        9750000.0,
      ],
    ];

    const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    dataSheet["!cols"] = [
      { wch: 16 }, // CD_RECEITA
      { wch: 22 }, // NATUREZA_RECEITA
      { wch: 55 }, // DESCRICAO_RECEITA
      { wch: 18 }, // FONTE_RECURSO
      { wch: 38 }, // DESCRICAO_FONTE
      { wch: 42 }, // ORGAO_UNIDADE
      { wch: 20 }, // VALOR_ORCADO
    ];
    dataSheet["!autofilter"] = { ref: "A1:G9" };

    const instructions = XLSX.utils.aoa_to_sheet([
      ["MODELO OFICIAL DE IMPORTAÇÃO — RECEITAS DA LOA (LEI ORÇAMENTÁRIA ANUAL)"],
      [""],
      ["Instruções para Preenchimento:"],
      ["1. Preencha os dados na aba 'Dados_LOA_Receitas' mantendo os nomes de cabeçalho da linha 1."],
      ["2. NATUREZA_RECEITA: Código estruturado da natureza da receita (ex: 1.1.1.8.01.1.1). Campo obrigatório."],
      ["3. FONTE_RECURSO: Código da fonte ou vínculo de destinação dos recursos (ex: 01.110.0000). Campo obrigatório."],
      ["4. VALOR_ORCADO: Previsão de arrecadação orçada na LOA. Aceita números diretos (ex: 15000000) ou formato moeda (R$ 15.000.000,00). Campo obrigatório."],
      ["5. DESCRICAO_RECEITA: Nome descritivo da rubrica/natureza orçamentária."],
      ["6. DESCRICAO_FONTE e ORGAO_UNIDADE: Identificadores da destinação legal e do órgão/fundo gestor da receita."],
      ["7. Exclua ou substitua as linhas de exemplo antes de realizar o envio no sistema."],
      ["8. Não insira linhas em branco ou subtotais no meio da lista de dados."],
    ]);
    instructions["!cols"] = [{ wch: 110 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, instructions, "Instruções");
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Dados_LOA_Receitas");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="modelo-receitas-loa.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar planilha modelo LOA Receitas:", error);
    return NextResponse.json({ error: "Erro ao gerar arquivo modelo" }, { status: 500 });
  }
}
