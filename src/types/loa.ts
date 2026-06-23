export const FIELDS = ["organ", "budgetUnit", "functionName", "subfunction", "program", "action", "expenseNature", "subelement", "administrativeProcess"] as const;
export type FieldKey = (typeof FIELDS)[number];

export type BudgetRow = Record<FieldKey, string> & { value: number };

export type GroupTotal = { label: string; value: number; count: number };

export type DashboardData = {
  hasData: boolean;
  records: Array<BudgetRow & { id: string }>;
  pagination: { page: number; pageSize: number; total: number; pages: number };
  totals: { loa: number; filtered: number };
  counts: Record<"organs" | "units" | "functions" | "programs" | "actions" | "processes", number>;
  groups: Record<FieldKey, GroupTotal[]>;
  filterOptions: Record<FieldKey, string[]>;
};

