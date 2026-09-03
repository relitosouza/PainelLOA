/**
 * Serviço de Cálculo e Métricas Orçamentárias
 * Extraído para garantir cálculos determinísticos, puros e 100% testáveis.
 */

export interface BudgetMetricItem {
  valLdo: number;
  valLoa: number;
  natureza?: string;
  codigo?: string;
  subelementos?: Array<{
    valor: number;
  }>;
}

export interface CalculatedBudgetMetrics {
  valLdoTotal: number;
  valLoaTotal: number;
  diff: number;
  percentExec: number;
  totalNaturezas: number;
}

/**
 * Calcula o total consolidado de LDO e LOA a partir de uma lista de registros
 */
export function calculateBudgetMetrics(
  records: BudgetMetricItem[],
  customSubelementSum?: (item: BudgetMetricItem) => number
): CalculatedBudgetMetrics {
  let valLdoTotal = 0;
  let valLoaTotal = 0;
  const naturezasSet = new Set<string>();

  for (const item of records) {
    valLdoTotal += Number(item.valLdo) || 0;

    if (customSubelementSum) {
      valLoaTotal += customSubelementSum(item);
    } else if (item.subelementos && item.subelementos.length > 0) {
      valLoaTotal += item.subelementos.reduce((acc, sub) => acc + (Number(sub.valor) || 0), 0);
    } else {
      valLoaTotal += Number(item.valLoa) || 0;
    }

    if (item.natureza) {
      naturezasSet.add(item.natureza.trim());
    }
  }

  const diff = Number((valLoaTotal - valLdoTotal).toFixed(2));
  const percentExec = valLdoTotal > 0 ? Number(((valLoaTotal / valLdoTotal) * 100).toFixed(2)) : 0;

  return {
    valLdoTotal,
    valLoaTotal,
    diff,
    percentExec,
    totalNaturezas: naturezasSet.size,
  };
}

/**
 * Normaliza o valor de diferença orçamentária para fins de auditoria
 */
export function calculateDifferenceStatus(valLoa: number, valLdo: number): {
  diff: number;
  isPositive: boolean;
  isNegative: boolean;
  isEqual: boolean;
  statusLabel: string;
} {
  const diff = Number((valLoa - valLdo).toFixed(2));
  return {
    diff,
    isPositive: diff > 0,
    isNegative: diff < 0,
    isEqual: diff === 0,
    statusLabel: diff > 0 ? "Excesso (LOA > LDO)" : diff < 0 ? "Redução (LOA < LDO)" : "Equivalente",
  };
}
