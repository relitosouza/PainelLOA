import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const headers = ["Apelido", "Vínculo", "Descrição do Vínculo", "Total"];
    const examples = [
      ["1.9", "01.110.0000", "TESOURO-GERAL", 27189794.56],
      ["001", "01.200.0000", "TESOURO-EDUCAÇÃO", 18500000.0],
      ["REC-01", "02.300.0000", "TRANSFERÊNCIAS DA SAÚDE", 12750000.0],
      ["2.1 - Saúde", "02.300.0000", "FUNDO MUNICIPAL DE SAÚDE", 5000000.0],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    worksheet["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 35 }, { wch: 22 }];

    const instructions = XLSX.utils.aoa_to_sheet([
      ["MODELO DE PREVISÃO DE RECEITAS DA LDO"],
      ["Instruções:"],
      ["1. Não altere o nome das colunas do cabeçalho."],
      ["2. O campo 'Apelido' é texto livre (preserva zeros à esquerda ex: '001', hífens ex: 'REC-01', códigos ex: '1.9')."],
      ["3. O campo 'Total' deve conter o valor previsto da receita para o exercício da LDO."],
      ["4. Preencha o Vínculo exatamente como cadastrado no sistema."],
    ]);
    instructions["!cols"] = [{ wch: 90 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, instructions, "Instruções");
    XLSX.utils.book_append_sheet(workbook, worksheet, "Receitas_LDO");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="modelo-receitas-ldo.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar modelo LDO:", error);
    return NextResponse.json({ error: "Erro ao gerar arquivo modelo" }, { status: 500 });
  }
}
