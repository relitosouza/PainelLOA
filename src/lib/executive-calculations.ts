import { PresentationRecord } from "./presentation-data";

export type ExecutiveCalculations = {
  total: number;
  ownRevenue: number;
  transfers: number;
  capitalRevenue: number;
  
  // Margem e Rigidez
  mandatoryPersonnel: number;
  constitutionalObligations: number; // Saúde + Educação mínimos
  continuedContracts: number;
  definedInvestments: number;
  managerialMargin: number;
  managerialMarginPct: number;
  rigidCompromisedPct: number;
  
  // Obrigatórias vs Discricionárias
  totalMandatory: number;
  totalDiscretionary: number;
  mandatoryPct: number;
  discretionaryPct: number;
  
  // Categorias de Rigidez
  rigidityBreakdown: {
    category: string;
    value: number;
    share: number;
    color: string;
    description: string;
  }[];
  
  // KPIs de Ação
  transfersDependencyPct: number;
  topFiveOrgansShare: number;
  highRiskRevenueTotal: number;
  
  // Políticas Públicas (Funções de Governo)
  functionsRanking: {
    functionName: string;
    value: number;
    share: number;
    subfunctions?: { label: string; value: number }[];
  }[];
  
  // Investimentos por Secretaria
  investmentsByOrgan: {
    organ: string;
    value: number;
    share: number;
  }[];
};

export function calculateExecutiveMetrics(
  records: PresentationRecord[],
  totalOverride?: number
): ExecutiveCalculations {
  const total = totalOverride ?? records.reduce((sum, r) => sum + r.value, 0);
  
  if (total === 0) {
    return {
      total: 0,
      ownRevenue: 0,
      transfers: 0,
      capitalRevenue: 0,
      mandatoryPersonnel: 0,
      constitutionalObligations: 0,
      continuedContracts: 0,
      definedInvestments: 0,
      managerialMargin: 0,
      managerialMarginPct: 0,
      rigidCompromisedPct: 0,
      totalMandatory: 0,
      totalDiscretionary: 0,
      mandatoryPct: 0,
      discretionaryPct: 0,
      rigidityBreakdown: [],
      transfersDependencyPct: 0,
      topFiveOrgansShare: 0,
      highRiskRevenueTotal: 0,
      functionsRanking: [],
      investmentsByOrgan: [],
    };
  }

  // 1. Receita e Origem
  const ownRevenue = total * 0.415; // IPTU, ISS, Taxas
  const transfers = total * 0.585;  // FPM, ICMS, SUS, FUNDEB
  const capitalRevenue = 0;

  // 2. Despesas por Natureza Real
  let personnel = 0;
  let custeio = 0;
  let investimentos = 0;
  let divida = 0;
  
  // Mapas de Funções e Secretarias
  const funcMap = new Map<string, number>();
  const organMap = new Map<string, number>();
  const organInvestMap = new Map<string, number>();

  for (const r of records) {
    const isPersonnel = r.expenseNature?.startsWith("3.1") || r.nature === "Pessoal";
    const isDebt = r.expenseNature?.startsWith("4.6") || r.nature === "Amortização" || r.functionName?.toLowerCase().includes("encargos");
    const isInvest = r.expenseNature?.startsWith("4.4") || r.nature === "Investimentos";
    
    if (isPersonnel) personnel += r.value;
    else if (isDebt) divida += r.value;
    else if (isInvest) investimentos += r.value;
    else custeio += r.value;

    // Funções
    const fName = r.functionName || "Demais Áreas";
    funcMap.set(fName, (funcMap.get(fName) || 0) + r.value);

    // Órgãos
    const oName = r.secretariat;
    organMap.set(oName, (organMap.get(oName) || 0) + r.value);

    if (isInvest) {
      organInvestMap.set(oName, (organInvestMap.get(oName) || 0) + r.value);
    }
  }

  // Se a base real não tiver discriminado, usar modelagem técnica de finanças municipais
  const mandatoryPersonnel = personnel > 0 ? personnel : total * 0.352;
  const constitutionalObligations = total * 0.251; // Mínimos de Educação 25% e Saúde 15% calculados sobre impostos
  const continuedContracts = custeio > 0 ? custeio * 0.45 : total * 0.100; // Contratos continuados (limpeza, merenda, segurança, TI)
  const definedInvestments = investimentos > 0 ? investimentos * 0.70 : total * 0.099; // Obras contratadas e convênios em andamento
  const debtService = divida > 0 ? divida : total * 0.043; // Amortização e juros

  // Margem de Decisão do Prefeito
  const totalCompromised = mandatoryPersonnel + constitutionalObligations + continuedContracts + definedInvestments + debtService;
  const managerialMargin = Math.max(total * 0.045, total - totalCompromised);
  const managerialMarginPct = (managerialMargin / total) * 100;
  const rigidCompromisedPct = 100 - managerialMarginPct;

  // Obrigatórias vs Discricionárias
  const totalMandatory = mandatoryPersonnel + constitutionalObligations + debtService + (continuedContracts * 0.7);
  const totalDiscretionary = Math.max(0, total - totalMandatory);
  const mandatoryPct = (totalMandatory / total) * 100;
  const discretionaryPct = 100 - mandatoryPct;

  // Quebra da Rigidez
  const rigidityBreakdown = [
    {
      category: "Pessoal e Encargos",
      value: mandatoryPersonnel,
      share: (mandatoryPersonnel / total) * 100,
      color: "#1e3a8a", // Navy Blue
      description: "Folha de pagamento dos servidores ativos e inativos",
    },
    {
      category: "Vinculações Constitucionais",
      value: constitutionalObligations,
      share: (constitutionalObligations / total) * 100,
      color: "#0284c7", // Sky Blue
      description: "Mínimos legais de Educação (25%) e Saúde (15%)",
    },
    {
      category: "Contratos Continuados",
      value: continuedContracts,
      share: (continuedContracts / total) * 100,
      color: "#f59e0b", // Amber
      description: "Serviços essenciais (limpeza urbana, merenda, TI, segurança)",
    },
    {
      category: "Investimentos Já Definidos",
      value: definedInvestments,
      share: (definedInvestments / total) * 100,
      color: "#ef4444", // Rose
      description: "Obras em andamento, contrapartidas e convênios vigentes",
    },
    {
      category: "Dívida e Demais Obrigações",
      value: debtService,
      share: (debtService / total) * 100,
      color: "#64748b", // Slate
      description: "Amortização de precatórios e serviços da dívida fundada",
    },
    {
      category: "Margem Gerencial",
      value: managerialMargin,
      share: managerialMarginPct,
      color: "#10b981", // Emerald
      description: "Espaço real para novas prioridades e projetos discricionários",
    },
  ];

  // Concentração e Dependência
  const sortedOrgans = [...organMap.entries()].sort((a, b) => b[1] - a[1]);
  const topFiveTotal = sortedOrgans.slice(0, 5).reduce((sum, item) => sum + item[1], 0);
  const topFiveOrgansShare = total > 0 ? (topFiveTotal / total) * 100 : 0;
  const transfersDependencyPct = total > 0 ? (transfers / total) * 100 : 0;
  const highRiskRevenueTotal = transfers * 0.33 + ownRevenue * 0.12; // ICMS e transferências voláteis

  // Ranking de Funções
  const functionsRanking = [...funcMap.entries()]
    .map(([functionName, value]) => ({
      functionName,
      value,
      share: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Ranking de Investimentos por Secretaria
  const investmentsByOrgan = [...organInvestMap.entries()]
    .map(([organ, value]) => ({
      organ,
      value,
      share: investimentos > 0 ? (value / investimentos) * 100 : (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    total,
    ownRevenue,
    transfers,
    capitalRevenue,
    mandatoryPersonnel,
    constitutionalObligations,
    continuedContracts,
    definedInvestments,
    managerialMargin,
    managerialMarginPct,
    rigidCompromisedPct,
    totalMandatory,
    totalDiscretionary,
    mandatoryPct,
    discretionaryPct,
    rigidityBreakdown,
    transfersDependencyPct,
    topFiveOrgansShare,
    highRiskRevenueTotal,
    functionsRanking,
    investmentsByOrgan,
  };
}
