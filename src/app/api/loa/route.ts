import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { FIELDS, type FieldKey, type GroupTotal } from "@/types/loa";

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

function buildSecretariatWhere(params: URLSearchParams): Prisma.BudgetRecordWhereInput {
  const organs = params.getAll("organ").filter(Boolean);
  return organs.length ? { organ: { in: organs } } : {};
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
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(params.get("pageSize")) || 20));
    const sort = SORTABLE.has(params.get("sort") ?? "") ? params.get("sort")! : "value";
    const direction = params.get("direction") === "asc" ? "asc" : "desc";
    const where = buildWhere(params);
    const secretariatWhere = buildSecretariatWhere(params);
    const select = Object.fromEntries(FIELDS.map((field) => [field, true])) as Record<FieldKey, true>;

    const [totalRecords, filteredValue, loaValue, operatingValue, investmentValue, records, optionRows, groups, secretariatCeilings, organs, units, functions, programs, actions, processes] = await Promise.all([
      db.budgetRecord.count({ where }),
      db.budgetRecord.aggregate({ where, _sum: { value: true } }),
      db.budgetRecord.aggregate({ _sum: { value: true } }),
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
    ]);

    const filterOptions = Object.fromEntries(FIELDS.map((field) => [field, [...new Set(optionRows.map((row) => row[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"))]));
    return NextResponse.json({
      hasData: (await db.loaImport.count()) > 0,
      records: records.map((record) => ({ ...record, id: record.id.toString(), value: record.value.toNumber() })),
      pagination: { page, pageSize, total: totalRecords, pages: Math.max(1, Math.ceil(totalRecords / pageSize)) },
      totals: { loa: loaValue._sum.value?.toNumber() ?? 0, filtered: filteredValue._sum.value?.toNumber() ?? 0 },
      secretariatCeiling: secretariatCeilings[0] ?? null,
      spending: { operating: operatingValue._sum.value?.toNumber() ?? 0, investment: investmentValue._sum.value?.toNumber() ?? 0 },
      counts: { organs, units, functions, programs, actions, processes },
      groups: Object.fromEntries(FIELDS.map((field, index) => [field, groups[index]])),
      filterOptions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível consultar os dados da LOA." }, { status: 500 });
  }
}
