import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseWorkbook } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const replace = form.get("replace") === "true";
    if (!(file instanceof File)) return NextResponse.json({ message: "Selecione uma planilha válida." }, { status: 400 });
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return NextResponse.json({ message: "Formato inválido. Use XLSX, XLS ou CSV." }, { status: 400 });

    const parsed = parseWorkbook(await file.arrayBuffer());
    if (!parsed.hasRequiredFields || parsed.missingOrgan) {
      return NextResponse.json({ message: "A planilha não possui todos os campos obrigatórios. Verifique os cabeçalhos da LOA." }, { status: 422 });
    }
    if (parsed.invalidValues.length) {
      return NextResponse.json({ message: "Alguns valores não puderam ser interpretados corretamente.", invalidRows: parsed.invalidValues.slice(0, 20) }, { status: 422 });
    }
    if (!parsed.records.length) return NextResponse.json({ message: "Nenhum registro válido foi encontrado." }, { status: 422 });

    const totalValue = parsed.records.reduce((sum, row) => sum + row.value, 0);
    const imported = await db.$transaction(async (tx) => {
      if (replace) await tx.loaImport.deleteMany();
      const batch = await tx.loaImport.create({ data: { fileName: file.name, recordCount: parsed.records.length, totalValue: new Prisma.Decimal(totalValue) } });
      for (let start = 0; start < parsed.records.length; start += 1000) {
        await tx.budgetRecord.createMany({
          data: parsed.records.slice(start, start + 1000).map((row) => ({ ...row, importId: batch.id, value: new Prisma.Decimal(row.value) })),
        });
      }
      return batch;
    }, { maxWait: 10_000, timeout: 60_000 });

    const unique = (key: keyof (typeof parsed.records)[number]) => new Set(parsed.records.map((row) => row[key]).filter(Boolean)).size;
    return NextResponse.json({
      message: "Importação concluída com sucesso.",
      importId: imported.id,
      summary: { rows: parsed.records.length, totalValue, organs: unique("organ"), units: unique("budgetUnit"), programs: unique("program"), actions: unique("action"), processes: unique("administrativeProcess") },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível importar a planilha. Verifique o arquivo e a conexão com o banco." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.loaImport.deleteMany();
    return NextResponse.json({ message: "Dados removidos com sucesso." });
  } catch {
    return NextResponse.json({ message: "Não foi possível remover os dados." }, { status: 500 });
  }
}

