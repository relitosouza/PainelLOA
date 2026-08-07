export type RuleSeverity = "error" | "warning";

export type EnquadramentoRuleMessage = {
  rule: "RN01" | "RN02" | "RN03" | "RN04" | "JUSTIFICATIVA";
  severity: RuleSeverity;
  message: string;
};

const normalizeText = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

export const normalizeBudgetCode = (value: string) => value.replace(/\D/g, "");

export const CAPITAL_KEYWORDS = ["construcao", "ampliacao", "aquisicao de veiculo", "equipamento"];
export const TECHNOLOGY_KEYWORDS = ["sistema", "software", "licenca", "nuvem", "internet", "tecnologia"];

export function isGenericExpenseCode(code: string) {
  const digits = normalizeBudgetCode(code);
  return digits.endsWith("99") || digits.endsWith("9900");
}

export function validateClassification(input: {
  actionText: string;
  product: string;
  expenseCode: string;
  sourceCode?: string;
  applicationCode?: string;
  value: number;
  remaining: number;
  justification?: string;
}) {
  const messages: EnquadramentoRuleMessage[] = [];
  const context = normalizeText(`${input.actionText} ${input.product}`);
  const expense = normalizeBudgetCode(input.expenseCode);
  const capitalContext = CAPITAL_KEYWORDS.some((keyword) => context.includes(keyword));
  const technologyContext = TECHNOLOGY_KEYWORDS.some((keyword) => context.includes(keyword));

  if (capitalContext && expense.startsWith("3")) {
    messages.push({ rule: "RN01", severity: "error", message: "A ação indica investimento. Selecione uma despesa do Grupo 4." });
  }
  if (technologyContext && expense.startsWith("3390") && !expense.startsWith("339040")) {
    messages.push({ rule: "RN02", severity: "error", message: "Serviços de tecnologia devem usar exclusivamente o elemento 3.3.90.40." });
  }
  if (!input.sourceCode || !input.applicationCode) {
    messages.push({ rule: "RN03", severity: "error", message: "Fonte de recurso e código de aplicação são obrigatórios." });
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    messages.push({ rule: "RN04", severity: "error", message: "Informe um valor maior que zero." });
  } else if (input.value > input.remaining + 0.001) {
    messages.push({ rule: "RN04", severity: "error", message: "O valor ultrapassa o saldo financeiro disponível na ação." });
  }
  if (isGenericExpenseCode(expense) && !input.justification?.trim()) {
    messages.push({ rule: "JUSTIFICATIVA", severity: "error", message: "Informe a justificativa técnica para utilizar uma classificação genérica." });
  }
  return messages;
}

export function scoreExpenseSuggestion(input: { actionText: string; product: string; code: string; name: string }) {
  const context = normalizeText(`${input.actionText} ${input.product}`);
  const candidate = normalizeText(input.name);
  const code = normalizeBudgetCode(input.code);
  let score = 0;
  const reasons: string[] = [];

  const technology = TECHNOLOGY_KEYWORDS.some((keyword) => context.includes(keyword));
  const capital = CAPITAL_KEYWORDS.some((keyword) => context.includes(keyword));
  if (technology && code.startsWith("339040")) { score += 100; reasons.push("compatível com serviços de tecnologia"); }
  if (technology && code.startsWith("3390") && !code.startsWith("339040")) score -= 100;
  if (capital && code.startsWith("4")) { score += 70; reasons.push("compatível com investimento"); }
  if (capital && code.startsWith("3")) score -= 70;

  const words = context.split(/\W+/).filter((word) => word.length > 4);
  const matches = words.filter((word) => candidate.includes(word));
  if (matches.length) { score += matches.length * 12; reasons.push(`similaridade: ${matches.slice(0, 3).join(", ")}`); }
  if (/manuten/.test(context) && /manuten|material de consumo|servicos/.test(candidate)) { score += 35; reasons.push("relacionado à manutenção"); }
  if (/evento/.test(context) && /servicos|locacao|premiac/.test(candidate)) { score += 35; reasons.push("relacionado a eventos"); }
  if (/equipamento/.test(context) && /equipamento|material permanente/.test(candidate)) { score += 50; reasons.push("relacionado a equipamentos"); }

  return { score, reason: reasons.join("; ") || "classificação disponível no catálogo oficial" };
}
