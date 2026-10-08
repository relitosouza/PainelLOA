import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { db } from "../src/lib/db";
import { fileNameWithExercise } from "../src/lib/import-metadata";
import { normalizeUnidadeOrcamentaria } from "../src/lib/unidades-orcamentarias-catalogo";
import { parseBrazilianMoney } from "../src/lib/parser";

const filePath = process.argv[2] ?? "/home/sf01/Downloads/modelo-importacao-loa (1) (1) (1).xlsx";
const exercise = Number(process.env.LOA_EXERCICIO ?? 2027);

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function headerIndex(headers: unknown[], name: string) {
  const index = headers.findIndex((header) => clean(header).toLowerCase() === name.toLowerCase());
  if (index < 0) throw new Error(`Coluna obrigatória não encontrada na aba Dados_LOA: ${name}`);
  return index;
}

async function main() {
  if (!fs.existsSync(filePath)) throw new Error(`Arquivo não encontrado: ${filePath}`);
  if (!Number.isInteger(exercise) || exercise < 2000 || exercise > 2100) throw new Error("Exercício inválido.");

  const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets.Dados_LOA;
  if (!sheet) throw new Error("A aba Dados_LOA não foi encontrada.");

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  const headers = rows[0] ?? [];
  const columns = {
    organ: headerIndex(headers, "CD_ÓRGÃO-DS_ÓRGÃO"),
    unit: headerIndex(headers, "CD_UNID.-DS_UNID."),
    functionName: headerIndex(headers, "CD_FUNÇÃO-DS_FUNÇÃO"),
    subfunction: headerIndex(headers, "CD SUBFUNÇÃO-DS_SUBFUNÇÃO"),
    program: headerIndex(headers, "CD_PROGRAMA-DS_PROGRAMA"),
    action: headerIndex(headers, "CD_AÇÃO-DS_AÇÃO"),
    expenseNature: headerIndex(headers, "NATUREZA DE DESPESA"),
    source: headerIndex(headers, "Fonte/Vínculo"),
    subelement: headerIndex(headers, "Desc Sub"),
    process: headerIndex(headers, "PROCESSO ADMINISTRATIVO"),
    value: headerIndex(headers, "Valor Final"),
  };

  const records: Array<{
    organ: string;
    budgetUnit: string;
    functionName: string;
    subfunction: string;
    program: string;
    action: string;
    expenseNature: string;
    subelement: string;
    administrativeProcess: string;
    value: Prisma.Decimal;
    fonteRecurso: string | null;
  }> = [];
  const invalidRows: number[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const hasDetail = [columns.organ, columns.unit, columns.functionName, columns.subfunction, columns.program, columns.action, columns.expenseNature, columns.subelement, columns.process]
      .some((index) => clean(row[index]));
    if (!hasDetail) continue;

    const value = parseBrazilianMoney(row[columns.value]);
    if (!Number.isFinite(value)) {
      invalidRows.push(rowIndex + 1);
      continue;
    }

    const organ = clean(row[columns.organ]);
    const budgetUnit = normalizeUnidadeOrcamentaria(organ, clean(row[columns.unit]));
    records.push({
      organ,
      budgetUnit,
      functionName: clean(row[columns.functionName]),
      subfunction: clean(row[columns.subfunction]),
      program: clean(row[columns.program]),
      action: clean(row[columns.action]),
      expenseNature: clean(row[columns.expenseNature]),
      subelement: clean(row[columns.subelement]),
      administrativeProcess: clean(row[columns.process]),
      value: new Prisma.Decimal(value),
      fonteRecurso: clean(row[columns.source]) || null,
    });
  }

  if (invalidRows.length) throw new Error(`Valores inválidos nas linhas: ${invalidRows.slice(0, 20).join(", ")}`);
  if (!records.length) throw new Error("Nenhum registro válido foi encontrado na aba Dados_LOA.");

  const totalValue = records.reduce((sum, row) => sum + row.value.toNumber(), 0);
  const previous = await db.budgetRecord.count();
  const imported = await db.$transaction(async (tx) => {
    await tx.loaImport.deleteMany();
    const batch = await tx.loaImport.create({
      data: {
        fileName: fileNameWithExercise(path.basename(filePath), exercise),
        recordCount: records.length,
        totalValue: new Prisma.Decimal(totalValue),
      },
    });
    for (let start = 0; start < records.length; start += 1000) {
      await tx.budgetRecord.createMany({
        data: records.slice(start, start + 1000).map((record) => ({ ...record, importId: batch.id })),
      });
    }
    return batch;
  }, { maxWait: 10_000, timeout: 60_000 });

  const stored = await db.budgetRecord.count({ where: { importId: imported.id } });
  const storedTotal = await db.budgetRecord.aggregate({ where: { importId: imported.id }, _sum: { value: true } });
  console.log(JSON.stringify({
    sourceFile: filePath,
    sourceSheet: "Dados_LOA",
    ignoredSheets: workbook.SheetNames.filter((name) => name !== "Dados_LOA"),
    previousRecords: previous,
    importedRecords: stored,
    expectedRecords: records.length,
    totalValue,
    storedTotal: storedTotal._sum.value?.toNumber() ?? 0,
    importId: imported.id,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
