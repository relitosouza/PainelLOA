import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { FIELDS, type FieldKey, type GroupTotal } from "@/types/loa";
import { cleanImportFileName, inferImportExercise } from "@/lib/import-metadata";
import {
  classificationLabel,
  extractExpenseCode,
  resolveExpenseSubelementCode,
  validateExpenseNature,
  validateExpenseSubelement,
} from "@/lib/expense-classification";

const SORTABLE = new Set([...FIELDS, "value"]);

function buildWhere(params: URLSearchParams): Prisma.BudgetRecordWhereInput {
  const AND: Prisma.BudgetRecordWhereInput[] = [];
  for (const field of FIELDS) {
    const values = params.getAll(field).filter(Boolean);
    if (values.length) AND.push({ [field]: { in: values } });
  }
  const minimum = Number(params.get("min"));
  const maximum = Number(params.get("max"));
  if (params.get("min") && Number.isFinite(minimum)) AND.push({ value: { gte: minimum } });
  if (params.get("max") && Number.isFinite(maximum)) AND.push({ value: { lte: maximum } });
  const search = params.get("search")?.trim();
  if (search) AND.push({ OR: FIELDS.map((field) => ({ [field]: { contains: search, mode: "insensitive" as const } })) });
  return AND.length ? { AND } : {};
}

function withExpensePrefix(where: Prisma.BudgetRecordWhereInput, prefix: string): Prisma.BudgetRecordWhereInput {
  return { AND: [where, { expenseNature: { startsWith: prefix } }] };
}

type RawGroup = Record<string, unknown> & { _sum: { value: { toNumber(): number } | null }; _count: { _all: number } };

function normalizeGroups(rows: unknown, field: FieldKey): GroupTotal[] {
  return (rows as RawGroup[]).map((row) => ({ label: String(row[field]), value: row._sum.value?.toNumber() ?? 0, count: row._count._all }));
}

async function groupBy(field: FieldKey, where: Prisma.BudgetRecordWhereInput) {
  const args = { where, _sum: { value: true as const }, _count: { _all: true as const }, orderBy: { _sum: { value: "desc" as const } }, take: 12 };
  switch (field) {
    case "organ": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["organ"], ...args }), field);
    case "budgetUnit": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["budgetUnit"], ...args }), field);
    case "functionName": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["functionName"], ...args }), field);
    case "subfunction": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["subfunction"], ...args }), field);
    case "program": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["program"], ...args }), field);
    case "action": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["action"], ...args }), field);
    case "expenseNature": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["expenseNature"], ...args }), field);
    case "subelement": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["subelement"], ...args }), field);
    case "administrativeProcess": return normalizeGroups(await db.budgetRecord.groupBy({ by: ["administrativeProcess"], ...args }), field);
  }
  return [];
}

async function distinctCount(field: FieldKey, where: Prisma.BudgetRecordWhereInput) {
  switch (field) {
    case "organ": return (await db.budgetRecord.groupBy({ by: ["organ"], where })).length;
    case "budgetUnit": return (await db.budgetRecord.groupBy({ by: ["budgetUnit"], where })).length;
    case "functionName": return (await db.budgetRecord.groupBy({ by: ["functionName"], where })).length;
    case "program": return (await db.budgetRecord.groupBy({ by: ["program"], where })).length;
    case "action": return (await db.budgetRecord.groupBy({ by: ["action"], where })).length;
    case "administrativeProcess": return (await db.budgetRecord.groupBy({ by: ["administrativeProcess"], where })).length;
    default: return 0;
  }
}

type QualityRow = {
  expenseNature: string;
  subelement: string;
  _sum: { value: { toNumber(): number } | null };
  _count: { _all: number };
};

function buildClassificationGroups(rows: QualityRow[]) {
  const buckets = {
    category: new Map<string, GroupTotal>(),
    expenseGroup: new Map<string, GroupTotal>(),
    modality: new Map<string, GroupTotal>(),
    economic: new Map<string, GroupTotal>(),
    subelement: new Map<string, GroupTotal>(),
  };

  const add = (bucket: Map<string, GroupTotal>, label: string, value: number, count: number) => {
    const current = bucket.get(label) ?? { label, value: 0, count: 0 };
    current.value += value;
    current.count += count;
    bucket.set(label, current);
  };

  for (const row of rows) {
    const code = extractExpenseCode(row.expenseNature);
    if (!code) continue;
    const [category, expenseGroup, modality] = code.split(".");
    const value = row._sum.value?.toNumber() ?? 0;
    const count = row._count._all;
    add(buckets.category, `${category} — ${classificationLabel("category", category)}`, value, count);
    add(buckets.expenseGroup, `${expenseGroup} — ${classificationLabel("group", expenseGroup)}`, value, count);
    add(buckets.modality, `${modality} — ${classificationLabel("modality", modality)}`, value, count);
    add(buckets.economic, row.expenseNature, value, count);
    const subelementCode = resolveExpenseSubelementCode(row.expenseNature, row.subelement);
    const subelementLabel = subelementCode
      ? `${subelementCode} — ${row.subelement}`
      : row.subelement || "Subelemento não informado";
    add(buckets.subelement, subelementLabel, value, count);
  }

  const sorted = (bucket: Map<string, GroupTotal>) => [...bucket.values()].sort((left, right) => right.value - left.value);
  return {
    category: sorted(buckets.category),
    expenseGroup: sorted(buckets.expenseGroup),
    modality: sorted(buckets.modality),
    economic: sorted(buckets.economic),
    subelement: sorted(buckets.subelement),
  };
}

function buildQualitySummary(rows: QualityRow[]) {
  const issueMap = new Map<string, { type: "missing-nature" | "invalid-nature" | "unmatched-subelement"; expenseCode: string; subelementDescription: string; count: number; value: number }>();
  let totalRecords = 0;
  let validRecords = 0;
  let warningRecords = 0;
  let validValue = 0;
  let warningValue = 0;
  let unmatchedSubelements = 0;

  const addIssue = (
    type: "missing-nature" | "invalid-nature" | "unmatched-subelement",
    expenseCode: string,
    subelementDescription: string,
    count: number,
    value: number,
  ) => {
    const key = `${type}:${expenseCode}:${subelementDescription}`;
    const current = issueMap.get(key) ?? { type, expenseCode, subelementDescription, count: 0, value: 0 };
    current.count += count;
    current.value += value;
    issueMap.set(key, current);
  };

  for (const row of rows) {
    const count = row._count._all;
    const value = row._sum.value?.toNumber() ?? 0;
    const nature = validateExpenseNature(row.expenseNature);
    const subelement = validateExpenseSubelement(row.expenseNature, row.subelement);
    const expenseCode = extractExpenseCode(row.expenseNature) ?? "Não informado";
    const subelementDescription = row.subelement.trim() || "Não informado";
    const hasWarning = !nature.valid || !subelement.valid;
    totalRecords += count;

    if (hasWarning) {
      warningRecords += count;
      warningValue += value;
    } else {
      validRecords += count;
      validValue += value;
    }

    if (!nature.valid) {
      addIssue(nature.reason === "missing" ? "missing-nature" : "invalid-nature", expenseCode, subelementDescription, count, value);
    } else if (!subelement.valid) {
      unmatchedSubelements += count;
      addIssue("unmatched-subelement", expenseCode, subelementDescription, count, value);
    }
  }

  return {
    available: totalRecords > 0,
    totalRecords,
    validRecords,
    warningRecords,
    validValue,
    warningValue,
    coverage: totalRecords ? validRecords / totalRecords : 0,
    unmatchedSubelements,
    issues: [...issueMap.values()].sort((left, right) => right.value - left.value).slice(0, 8),
  };
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const isAll = params.get("all") === "true";
    const page = isAll ? 1 : Math.max(1, Number(params.get("page")) || 1);
    const pageSize = isAll ? 10000 : Math.min(100, Math.max(10, Number(params.get("pageSize")) || 20));
    const sort = SORTABLE.has(params.get("sort") ?? "") ? params.get("sort")! : "value";
    const direction = params.get("direction") === "asc" ? "asc" : "desc";
    const importRows = await db.loaImport.findMany({ orderBy: { createdAt: "desc" } });
    const imports = importRows.map((item) => ({
      id: item.id,
      fileName: cleanImportFileName(item.fileName),
      recordCount: item.recordCount,
      totalValue: item.totalValue.toNumber(),
      createdAt: item.createdAt.toISOString(),
      exercise: inferImportExercise(item.fileName, item.createdAt.getFullYear()),
    }));
    const requestedImportId = params.get("importId");
    const selectedImport = imports.find((item) => item.id === requestedImportId) ?? imports[0] ?? null;
    const baseWhere: Prisma.BudgetRecordWhereInput = { importId: selectedImport?.id ?? "__no_import__" };
    const where: Prisma.BudgetRecordWhereInput = { AND: [baseWhere, buildWhere(params)] };
    const secretariatWhere = where;
    const select = Object.fromEntries(FIELDS.map((field) => [field, true])) as Record<FieldKey, true>;

    const [totalRecords, filteredValue, loaValue, operatingValue, investmentValue, records, optionRows, groups, secretariatCeilings, organs, units, functions, programs, actions, processes, newProjects, qualityRows] = await Promise.all([
      db.budgetRecord.count({ where }),
      db.budgetRecord.aggregate({ where, _sum: { value: true } }),
      db.budgetRecord.aggregate({ where: baseWhere, _sum: { value: true } }),
      db.budgetRecord.aggregate({ where: withExpensePrefix(where, "3"), _sum: { value: true } }),
      db.budgetRecord.aggregate({ where: withExpensePrefix(where, "4"), _sum: { value: true } }),
      db.budgetRecord.findMany({ where, select: { id: true, ...select, value: true }, orderBy: { [sort]: direction }, skip: (page - 1) * pageSize, take: pageSize }),
      db.budgetRecord.findMany({ where, select, distinct: [...FIELDS], take: 5000 }),
      Promise.all(FIELDS.map((field) => groupBy(field, where))),
      groupBy("organ", secretariatWhere),
      distinctCount("organ", where),
      distinctCount("budgetUnit", where),
      distinctCount("functionName", where),
      distinctCount("program", where),
      distinctCount("action", where),
      distinctCount("administrativeProcess", where),
      distinctCount("action", { AND: [where, { action: { contains: "projeto", mode: "insensitive" } }] }),
      db.budgetRecord.groupBy({ by: ["expenseNature", "subelement"], where, _sum: { value: true }, _count: { _all: true } }),
    ]);

    const filterOptions = Object.fromEntries(FIELDS.map((field) => [field, [...new Set(optionRows.map((row) => row[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"))]));
    const typedQualityRows = qualityRows as QualityRow[];
    const classificationGroups = buildClassificationGroups(typedQualityRows);
    return NextResponse.json({
      hasData: totalRecords > 0,
      imports,
      selection: { importId: selectedImport?.id ?? null, exercise: selectedImport?.exercise ?? null },
      records: records.map((record) => ({ ...record, id: record.id.toString(), value: record.value.toNumber() })),
      pagination: { page, pageSize, total: totalRecords, pages: Math.max(1, Math.ceil(totalRecords / pageSize)) },
      totals: { loa: loaValue._sum.value?.toNumber() ?? 0, filtered: filteredValue._sum.value?.toNumber() ?? 0 },
      secretariatCeiling: secretariatCeilings[0] ?? null,
      spending: { operating: operatingValue._sum.value?.toNumber() ?? 0, investment: investmentValue._sum.value?.toNumber() ?? 0 },
      counts: { organs, units, functions, programs, actions, processes, newProjects },
      groups: Object.fromEntries(FIELDS.map((field, index) => [field, groups[index]])),
      filterOptions,
      classifications: classificationGroups,
      quality: buildQualitySummary(typedQualityRows),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível consultar os dados da LOA." }, { status: 500 });
  }
}
