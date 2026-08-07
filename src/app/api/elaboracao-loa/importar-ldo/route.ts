import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseLdoActionWorkbook } from "@/lib/ldo-action-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const exercise = Number(form.get("exercise"));
    if (!(file instanceof File)) return NextResponse.json({ message: "Selecione a planilha de ações da LDO." }, { status: 400 });
    if (!Number.isInteger(exercise) || exercise < 2000 || exercise > 2100) return NextResponse.json({ message: "Informe um exercício válido." }, { status: 400 });
    const parsed = parseLdoActionWorkbook(await file.arrayBuffer());
    if (!parsed.records.length) return NextResponse.json({ message: "Nenhuma ação LDO válida foi encontrada.", invalidRows: parsed.invalidRows.slice(0, 20) }, { status: 422 });

    const imported = await db.$transaction(async (tx) => {
      await tx.ldoAcaoImportacao.updateMany({ where: { exercicio: exercise, ativo: true }, data: { ativo: false } });
      const batch = await tx.ldoAcaoImportacao.create({
        data: { nomeArquivo: file.name, exercicio: exercise, quantidade: parsed.records.length, valorTotal: new Prisma.Decimal(parsed.totalValue) },
      });
      for (let start = 0; start < parsed.records.length; start += 500) {
        await tx.ldoAcao.createMany({
          data: parsed.records.slice(start, start + 500).map((record) => ({
            importacaoId: batch.id,
            exercicio: exercise,
            secretaria: record.secretaria,
            programaCodigo: record.programaCodigo || null,
            programaNome: record.programaNome,
            funcaoCodigo: record.funcaoCodigo || null,
            funcaoNome: record.funcaoNome || null,
            subfuncaoCodigo: record.subfuncaoCodigo || null,
            subfuncaoNome: record.subfuncaoNome || null,
            acaoCodigo: record.acaoCodigo,
            acaoNome: record.acaoNome || null,
            produto: record.produto,
            metaFisica: record.metaFisica === null ? null : new Prisma.Decimal(record.metaFisica),
            custoFinanceiro: new Prisma.Decimal(record.custoFinanceiro),
            linhaOrigem: record.linhaOrigem,
          })),
        });
      }
      return batch;
    }, { timeout: 60_000 });

    return NextResponse.json({
      message: "Ações da LDO importadas em uma nova versão. As bases LOA existentes foram preservadas.",
      importId: imported.id,
      summary: { rows: parsed.records.length, invalidRows: parsed.invalidRows.length, totalValue: parsed.totalValue, secretariats: parsed.secretariats },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível importar as ações da LDO." }, { status: 500 });
  }
}
