export const FIELDS = ["organ", "budgetUnit", "functionName", "subfunction", "program", "action", "expenseNature", "subelement", "administrativeProcess", "apelido"] as const;
export type FieldKey = (typeof FIELDS)[number];

export type BudgetRow = Record<FieldKey, string> & { value: number; contrato?: string; fonteRecurso?: string; tipoAcao?: string };

export type GroupTotal = { label: string; value: number; count: number };

export type DashboardImport = {
  id: string;
  fileName: string;
  recordCount: number;
  totalValue: number;
  createdAt: string;
  exercise: number | null;
};

export type DataQualityIssue = {
  type: "missing-nature" | "invalid-nature" | "unmatched-subelement";
  expenseCode: string;
  subelementDescription: string;
  count: number;
  value: number;
};

export type DataQualitySummary = {
  available: boolean;
  totalRecords: number;
  validRecords: number;
  warningRecords: number;
  validValue: number;
  warningValue: number;
  coverage: number;
  unmatchedSubelements: number;
  issues: DataQualityIssue[];
};

export type ExpenseClassificationGroups = Record<"category" | "expenseGroup" | "modality" | "economic" | "subelement", GroupTotal[]>;

export type DashboardData = {
  hasData: boolean;
  imports: DashboardImport[];
  selection: { importId: string | null; exercise: number | null };
  records: Array<BudgetRow & { id: string }>;
  pagination: { page: number; pageSize: number; total: number; pages: number };
  totals: { loa: number; filtered: number };
  secretariatCeiling: GroupTotal | null;
  spending: { operating: number; investment: number };
  counts: Record<"organs" | "units" | "functions" | "programs" | "actions" | "processes" | "newProjects", number>;
  groups: Record<FieldKey, GroupTotal[]>;
  filterOptions: Record<FieldKey, string[]>;
  classifications: ExpenseClassificationGroups;
  quality: DataQualitySummary;
};
