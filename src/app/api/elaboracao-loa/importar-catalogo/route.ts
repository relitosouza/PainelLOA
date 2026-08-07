import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseAuxiliaryTablesWorkbook } from "@/lib/auxiliary-tables-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const exercise = Number(form.get("exercise"));
    if (!(file instanceof File)) return NextResponse.json({ message: "Selecione o Anexo II de tabelas auxiliares." }, { status: 400 });
    if (!Number.isInteger(exercise) || exercise < 2000 || exercise > 2100) return NextResponse.json({ message: "Informe um exercício válido." }, { status: 400 });
    const parsed = parseAuxiliaryTablesWorkbook(await file.arrayBuffer());
    if (!parsed.records.length) return NextResponse.json({ message: "Nenhum código auxiliar válido foi encontrado." }, { status: 422 });

    const imported = await db.$transaction(async (tx) => {
      await tx.codigoAuxiliarImportacao.updateMany({ where: { exercicio: exercise, ativo: true }, data: { ativo: false } });
      const batch = await tx.codigoAuxiliarImportacao.create({ data: { nomeArquivo: file.name, exercicio: exercise, versao: "2026 V-07", quantidade: parsed.records.length } });
      for (let start = 0; start < parsed.records.length; start += 500) {
        await tx.codigoAuxiliar.createMany({
          data: parsed.records.slice(start, start + 500).map((record) => ({
            importacaoId: batch.id,
            exercicio: exercise,
            tipo: record.tipo,
            abaOrigem: record.abaOrigem,
            codigo: record.codigo,
            nome: record.nome,
            especificacao: record.especificacao || null,
            observacao: record.observacao || null,
            metadados: record.metadados,
          })),
          skipDuplicates: true,
        });
      }
      return batch;
    }, { timeout: 60_000 });

    return NextResponse.json({ message: "Tabelas auxiliares importadas como catálogo versionado.", importId: imported.id, summary: { rows: parsed.records.length, sheets: parsed.sheets } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível importar as tabelas auxiliares." }, { status: 500 });
  }
}
