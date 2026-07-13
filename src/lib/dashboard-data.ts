import { FIELDS, type DashboardData, type FieldKey } from "../types/loa";
import { getSecretariatDemoRecords, type SecretariatRecord } from "./secretariat-data";

export type DashboardFilterState = Record<FieldKey, string[]> & {
  min: string;
  max: string;
  search: string;
};

const EMPTY_FILTER_FIELD_MAP = Object.fromEntries(
  FIELDS.map((field) => [field, [] as string[]])
) as Record<FieldKey, string[]>;

export const EMPTY_DASHBOARD_FILTERS: DashboardFilterState = {
  ...EMPTY_FILTER_FIELD_MAP,
  min: "",
  max: "",
  search: "",
};

type DashboardRow = DashboardData["records"][number];
type SortKey = FieldKey | "value";

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseMoneyInput(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  if (!normalized) return NaN;
  return Number(normalized);
}

function mapDemoRecord(record: SecretariatRecord, index: number): DashboardRow {
  return {
    id: String(index + 1),
    organ: record.secretariat,
    budgetUnit: record.unit,
    functionName: record.functionName,
    subfunction: record.functionName,
    program: record.program,
    action: record.process,
    expenseNature: record.expenseNature,
    subelement: record.category === "operating" ? "33" : "51",
    administrativeProcess: record.process,
    value: record.value,
  };
}

function matchesSelection(value: string, selection: string[]) {
  if (!selection.length) return true;
  const normalized = normalizeText(value);
  return selection.some((item) => normalizeText(item) === normalized);
}

function matchesSearch(row: DashboardRow, search: string) {
  if (!search) return true;
  const normalizedSearch = normalizeText(search);
  return FIELDS.some((field) => normalizeText(row[field]).includes(normalizedSearch));
}

function applyFilters(rows: DashboardRow[], filters: DashboardFilterState) {
  const min = filters.min ? parseMoneyInput(filters.min) : NaN;
  const max = filters.max ? parseMoneyInput(filters.max) : NaN;

  return rows.filter((row) => {
    if (!matchesSearch(row, filters.search)) return false;

    for (const field of FIELDS) {
      if (!matchesSelection(row[field], filters[field])) return false;
    }

    if (filters.min && Number.isFinite(min) && row.value < min) return false;
    if (filters.max && Number.isFinite(max) && row.value > max) return false;
    return true;
  });
}

function buildGroups(rows: DashboardRow[], field: FieldKey) {
  const grouped = new Map<string, { value: number; count: number }>();
  for (const row of rows) {
    const current = grouped.get(row[field]) ?? { value: 0, count: 0 };
    current.value += row.value;
    current.count += 1;
    grouped.set(row[field], current);
  }

  return [...grouped.entries()]
    .map(([label, metrics]) => ({ label, value: metrics.value, count: metrics.count }))
    .sort((a, b) => b.value - a.value);
}

function distinctCount(rows: DashboardRow[], field: FieldKey) {
  return new Set(rows.map((row) => row[field])).size;
}

function sortRows(rows: DashboardRow[], sort: SortKey, direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    if (sort === "value") return (left.value - right.value) * multiplier;
    return left[sort].localeCompare(right[sort], "pt-BR") * multiplier;
  });
}

export function buildDemoDashboardData(
  filters: DashboardFilterState = EMPTY_DASHBOARD_FILTERS,
  page = 1,
  sort: SortKey = "value",
  direction: "asc" | "desc" = "desc"
): DashboardData {
  const records = getSecretariatDemoRecords(2027).map(mapDemoRecord);
  const filteredRecords = applyFilters(records, filters);
  const sortedRecords = sortRows(filteredRecords, sort, direction);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const pagedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    hasData: true,
    records: pagedRecords,
    pagination: { page: currentPage, pageSize, total: sortedRecords.length, pages: pageCount },
    totals: {
      loa: records.reduce((sum, row) => sum + row.value, 0),
      filtered: filteredRecords.reduce((sum, row) => sum + row.value, 0),
    },
    secretariatCeiling: buildGroups(filteredRecords, "organ")[0] ?? null,
    spending: {
      operating: filteredRecords.filter((row) => row.subelement === "33").reduce((sum, row) => sum + row.value, 0),
      investment: filteredRecords.filter((row) => row.subelement === "51").reduce((sum, row) => sum + row.value, 0),
    },
    counts: {
      organs: distinctCount(filteredRecords, "organ"),
      units: distinctCount(filteredRecords, "budgetUnit"),
      functions: distinctCount(filteredRecords, "functionName"),
      programs: distinctCount(filteredRecords, "program"),
      actions: distinctCount(filteredRecords, "action"),
      processes: distinctCount(filteredRecords, "administrativeProcess"),
      newProjects: filteredRecords.filter((row) => normalizeText(row.action).includes("projeto")).length,
    },
    groups: {
      organ: buildGroups(filteredRecords, "organ"),
      budgetUnit: buildGroups(filteredRecords, "budgetUnit"),
      functionName: buildGroups(filteredRecords, "functionName"),
      subfunction: buildGroups(filteredRecords, "subfunction"),
      program: buildGroups(filteredRecords, "program"),
      action: buildGroups(filteredRecords, "action"),
      expenseNature: buildGroups(filteredRecords, "expenseNature"),
      subelement: buildGroups(filteredRecords, "subelement"),
      administrativeProcess: buildGroups(filteredRecords, "administrativeProcess"),
    },
    filterOptions: Object.fromEntries(
      FIELDS.map((field) => [
        field,
        [...new Set(records.map((row) => row[field]))].sort((a, b) => a.localeCompare(b, "pt-BR")),
      ])
    ) as DashboardData["filterOptions"],
  };
}
