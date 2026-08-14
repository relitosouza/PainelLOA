"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currency, percent } from "@/lib/format";
import { getPresentationRecords, groupPresentation, type PresentationRecord } from "@/lib/presentation-data";
import { calculateExecutiveMetrics } from "@/lib/executive-calculations";
import { DecisionCapacityCard } from "./executive/decision-capacity-card";
import { WaterfallDecisionMargin } from "./executive/waterfall-decision-margin";
import { RigidityDonut, MandatoryVsDiscretionaryCard } from "./executive/rigidity-donut";
import { RevenueEvolutionChart } from "./executive/revenue-evolution-chart";
import { RevenueRiskTable } from "./executive/revenue-risk-table";
import { BudgetScenarioSimulator } from "./executive/budget-scenario-simulator";
import { PolicyAllocationChart, InvestmentsByOrganCard } from "./executive/policy-allocation-chart";
import { LdoDeliveryMatrix, InsufficientLdoGoalsCard, StrategicProgramsCard } from "./executive/ldo-delivery-matrix";
import { ExecutiveActionKpis, ExecutiveAlertsMap } from "./executive/executive-alerts-panel";
import { useDataSource } from "./data-source-toggle";
import type { DashboardData, BudgetRow } from "@/types/loa";

type AiObservation = {
  title: string;
  text: string;
  icon: string;
  tone: "info" | "positive" | "warning" | "critical";
};

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function cleanBudgetLabel(label: string) {
  return label
    .replace(/^\d{2}\.\d{2}\.\d{3}\.\d{2}\s*-\s*/i, "")
    .replace(/=$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatActionLabel(action?: string, program?: string) {
  const act = (action || "").trim();
  const prog = cleanBudgetLabel(program || "");
  if (!act) return prog || "Ação de Investimento";
  if (/^\d{3,5}$/.test(act) && prog) {
    return `${act} — ${prog}`;
  }
  return cleanBudgetLabel(act);
}

function share(value: number, total: number) {
  return total ? percent.format(value / total) : "0%";
}

function Treemap({
  items,
  selectedSecretariat,
  onSelectSecretariat,
}: {
  items: { label: string; value: number }[];
  selectedSecretariat?: string;
  onSelectSecretariat: (name: string) => void;
}) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.value - a.value);
  }, [items]);

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];
  const top4 = sorted[3];
  const top5 = sorted[4];
  const othersValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
  const othersCount = Math.max(0, sorted.length - 5);

  const getActiveRing = (label?: string) =>
    label && selectedSecretariat === label
      ? "ring-4 ring-amber-400 scale-[1.02] z-10 font-black shadow-lg"
      : "";

  return (
    <div className="grid grid-cols-10 grid-rows-2 h-[320px] gap-3">
      {top1 && (
        <div
          onClick={() => onSelectSecretariat(selectedSecretariat === top1.label ? "" : top1.label)}
          className={`col-span-4 row-span-2 bg-gradient-to-br from-tertiary to-[#004883] text-white p-6 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-all cursor-pointer shadow-md group relative overflow-hidden ${getActiveRing(top1.label)}`}
          title={selectedSecretariat === top1.label ? "Clique para desmarcar e voltar a todas" : `Filtrar por ${cleanBudgetLabel(top1.label)}`}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-tertiary-fixed/80 mb-1">Maior Secretaria</p>
          <h4 className="font-black text-3xl leading-tight mb-1">{cleanBudgetLabel(top1.label)}</h4>
          <p className="text-lg font-medium text-white/90">{compactCurrency(top1.value)}</p>
        </div>
      )}
      {top2 && (
        <div
          onClick={() => onSelectSecretariat(selectedSecretariat === top2.label ? "" : top2.label)}
          className={`col-span-3 row-span-1 bg-[#2b88d8] text-white p-5 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-all cursor-pointer shadow-sm relative overflow-hidden group ${getActiveRing(top2.label)}`}
          title={selectedSecretariat === top2.label ? "Clique para desmarcar e voltar a todas" : `Filtrar por ${cleanBudgetLabel(top2.label)}`}
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-black text-xl leading-tight mb-1">{cleanBudgetLabel(top2.label)}</h4>
          <p className="text-sm font-medium text-white/90">{compactCurrency(top2.value)}</p>
        </div>
      )}
      {top3 && (
        <div
          onClick={() => onSelectSecretariat(selectedSecretariat === top3.label ? "" : top3.label)}
          className={`col-span-3 row-span-1 bg-[#56a5eb] text-white p-5 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-all cursor-pointer shadow-sm relative overflow-hidden group ${getActiveRing(top3.label)}`}
          title={selectedSecretariat === top3.label ? "Clique para desmarcar e voltar a todas" : `Filtrar por ${cleanBudgetLabel(top3.label)}`}
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-black text-lg leading-tight mb-1">{cleanBudgetLabel(top3.label)}</h4>
          <p className="text-sm font-medium text-white/90">{compactCurrency(top3.value)}</p>
        </div>
      )}
      {top4 && (
        <div
          onClick={() => onSelectSecretariat(selectedSecretariat === top4.label ? "" : top4.label)}
          className={`col-span-2 row-span-1 bg-[#90c6f4] text-[#00386b] p-4 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-all cursor-pointer shadow-sm relative overflow-hidden group ${getActiveRing(top4.label)}`}
          title={selectedSecretariat === top4.label ? "Clique para desmarcar e voltar a todas" : `Filtrar por ${cleanBudgetLabel(top4.label)}`}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-bold text-base leading-tight mb-1">{cleanBudgetLabel(top4.label)}</h4>
          <p className="text-xs font-semibold">{compactCurrency(top4.value)}</p>
        </div>
      )}
      {top5 && (
        <div
          onClick={() => onSelectSecretariat(selectedSecretariat === top5.label ? "" : top5.label)}
          className={`col-span-2 row-span-1 bg-[#b9dbf8] text-[#00386b] p-4 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-all cursor-pointer shadow-sm relative overflow-hidden group ${getActiveRing(top5.label)}`}
          title={selectedSecretariat === top5.label ? "Clique para desmarcar e voltar a todas" : `Filtrar por ${cleanBudgetLabel(top5.label)}`}
        >
          <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-bold text-sm leading-tight mb-1">{cleanBudgetLabel(top5.label)}</h4>
          <p className="text-xs font-semibold">{compactCurrency(top5.value)}</p>
        </div>
      )}
      {othersCount > 0 && (
        <div
          onClick={() => onSelectSecretariat("")}
          className="col-span-2 row-span-1 bg-surface-container-low text-on-surface-variant p-4 rounded-xl flex flex-col justify-center items-center border-2 border-dashed border-outline-variant/50 hover:bg-surface-container hover:border-outline-variant transition-colors cursor-pointer"
          title="Ver todas as secretarias"
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-1">Outras {othersCount}</p>
          <p className="text-sm font-black">{compactCurrency(othersValue)}</p>
        </div>
      )}
    </div>
  );
}

export function PresentationDashboard() {
  const [year, setYear] = useState<2026 | 2027>(2027);
  const [secretariat, setSecretariat] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [dataSource, setDataSource] = useDataSource();
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Pergunte ao Orçamento Interactivity State
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (dataSource !== "real" || dbData) return;

    let cancelled = false;
    setIsLoadingRealData(true);
    setDataError(null);

    fetch("/api/loa?all=true")
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao carregar dados: ${res.status}`);
        return res.json() as Promise<DashboardData>;
      })
      .then((res) => {
        if (cancelled) return;
        if (!res.hasData || !res.records?.length) {
          throw new Error("Nenhuma importação de orçamento foi encontrada.");
        }
        setDbData(res);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error(error);
        setDataError(error instanceof Error ? error.message : "Não foi possível carregar os dados importados.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRealData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataSource, dbData]);

  const realRecords = useMemo((): PresentationRecord[] => {
    if (!dbData?.records) return [];
    return dbData.records.map((record: BudgetRow) => {
      const isOperating = record.expenseNature.startsWith("3") || record.subelement === "33";
      let nature: PresentationRecord["nature"] = "Custeio";
      if (record.expenseNature.startsWith("3.1")) nature = "Pessoal";
      else if (record.expenseNature.startsWith("3.3")) nature = "Custeio";
      else if (record.expenseNature.startsWith("4.4")) nature = "Investimentos";
      else if (record.expenseNature.startsWith("4.6")) nature = "Amortização";
      else if (!isOperating) nature = "Investimentos";

      return {
        secretariat: record.organ,
        unit: record.budgetUnit,
        functionName: record.functionName,
        program: record.program,
        action: record.action,
        expenseNature: record.expenseNature,
        process: record.administrativeProcess,
        category: isOperating ? "operating" : "investment",
        nature,
        value: record.value,
      };
    });
  }, [dbData]);

  const getCurrentRecords = useMemo(() => {
    return (selectedYear: 2026 | 2027): PresentationRecord[] => {
      if (dataSource === "ficticio") return getPresentationRecords(selectedYear);
      if (selectedYear === 2027) return realRecords;
      return realRecords.map((record, index) => ({
        ...record,
        value: Math.round(record.value * (0.88 + (index % 4) * 0.01)),
      }));
    };
  }, [dataSource, realRecords]);

  const summary = useMemo(() => {
    const records = getCurrentRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const total = records.reduce((sum, record) => sum + record.value, 0);
    const operating = records.filter((record) => record.category === "operating").reduce((sum, record) => sum + record.value, 0);
    const functions = groupPresentation(records, "functionName");
    const units = groupPresentation(records, "unit");
    const programs = groupPresentation(records, "program");
    const processes = groupPresentation(records, "process");
    const organs = groupPresentation(records, "secretariat");
    return {
      total,
      operating,
      investment: total - operating,
      functions,
      units,
      programs,
      processes,
      organs,
      totalRecords: records.length,
      secretariatCount: new Set(records.map((record) => record.secretariat)).size,
      unitCount: new Set(records.map((record) => record.unit)).size,
      programCount: new Set(records.map((record) => record.program)).size,
      processCount: new Set(records.map((record) => record.process)).size,
      natureTotals: records.reduce<Record<PresentationRecord["nature"], number>>(
        (acc, record) => {
          acc[record.nature] += record.value;
          return acc;
        },
        { Pessoal: 0, Custeio: 0, Investimentos: 0, Amortização: 0 }
      ),
    };
  }, [secretariat, year, getCurrentRecords]);

  const availableSecretariats = useMemo(() => {
    return groupPresentation(getCurrentRecords(year), "secretariat")
      .map((item) => item.label)
      .sort((left, right) => cleanBudgetLabel(left).localeCompare(cleanBudgetLabel(right), "pt-BR"));
  }, [getCurrentRecords, year]);

  const previousTotal = useMemo(() => {
    return getCurrentRecords(2026)
      .filter((record) => !secretariat || record.secretariat === secretariat)
      .reduce((sum, record) => sum + record.value, 0);
  }, [secretariat, getCurrentRecords]);

  const trend = previousTotal ? summary.total / previousTotal - 1 : 0;
  const topFiveShare = summary.total ? summary.organs.slice(0, 5).reduce((sum, item) => sum + item.value, 0) / summary.total : 0;
  const ownRevenue = summary.total * 0.41;
  const transfers = summary.total * 0.53;
  const capitalRevenue = Math.max(0, summary.total - ownRevenue - transfers);
  const investmentShare = summary.total ? summary.investment / summary.total : 0;
  const perCapita = summary.total / 723500;

  const topProgram = useMemo(() => {
    const records = getCurrentRecords(year).filter(
      (record) => !secretariat || record.secretariat === secretariat
    );
    // Desconsiderar despesas 3.1 (Pessoal e Encargos Sociais)
    const nonPersonnelRecords = records.filter(
      (r) => !(r.expenseNature ? r.expenseNature.startsWith("3.1") : r.nature === "Pessoal")
    );
    const map = new Map<string, number>();
    for (const r of nonPersonnelRecords) {
      if (!r.program) continue;
      map.set(r.program, (map.get(r.program) || 0) + r.value);
    }
    const sorted = [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return sorted[0] || summary.programs[0];
  }, [year, secretariat, getCurrentRecords, summary.programs]);

  const topProcess = useMemo(() => {
    const records = getCurrentRecords(year).filter(
      (record) => !secretariat || record.secretariat === secretariat
    );
    // Filtrar processos administrativos não vazios
    const validProcessRecords = records.filter(
      (r) => r.process && r.process.trim().length > 0 && r.process.trim() !== "-"
    );
    const map = new Map<string, number>();
    for (const r of validProcessRecords) {
      const proc = r.process.trim();
      map.set(proc, (map.get(proc) || 0) + r.value);
    }
    const sorted = [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 0) return sorted[0];
    return summary.processes.find((p) => p.label && p.label.trim().length > 0) || summary.processes[0];
  }, [year, secretariat, getCurrentRecords, summary.processes]);

  const topInvestmentAction = useMemo(() => {
    const records = getCurrentRecords(year).filter(
      (record) => !secretariat || record.secretariat === secretariat
    );
    // Filtrar despesas que começam com "4.4" (Investimentos Diretos)
    const capitalRecords = records.filter((r) =>
      r.expenseNature ? r.expenseNature.startsWith("4.4") : r.nature === "Investimentos"
    );
    const map = new Map<string, { label: string; value: number }>();
    for (const r of capitalRecords) {
      const fullLabel = formatActionLabel(r.action, r.program);
      const existing = map.get(fullLabel);
      if (existing) {
        existing.value += r.value;
      } else {
        map.set(fullLabel, { label: fullLabel, value: r.value });
      }
    }
    const sorted = [...map.values()].sort((a, b) => b.value - a.value);

    return sorted[0] || { label: "Ação de Investimento em Infraestrutura", value: summary.investment };
  }, [year, secretariat, getCurrentRecords, summary.investment]);

  const getPriorityValue = (keywords: string[], fallbackPct: number) => {
    const organMatch = summary.organs.find((item) =>
      keywords.some((keyword) => item.label.toLowerCase().includes(keyword))
    );
    if (organMatch) return organMatch.value;

    const functionMatch = summary.functions.find((item) =>
      keywords.some((keyword) => item.label.toLowerCase().includes(keyword))
    );
    if (functionMatch) return functionMatch.value;

    return summary.total * fallbackPct;
  };

  const prioritySaude = getPriorityValue(["saude", "saúde"], 0.24);
  const priorityEducacao = getPriorityValue(["educac", "educaç"], 0.20);
  const priorityObras = getPriorityValue(["obras", "infraestrutura", "infra", "urbanismo"], 0.08);
  const priorityMobilidade = getPriorityValue(["mobilidade", "transporte", "trânsito", "transito"], 0.05);
  const priorityAssistencia = getPriorityValue(["assistência", "assistencia", "social", "cidadania"], 0.04);

  const priorities = [
    { label: "Saúde", value: prioritySaude, color: "bg-red-500" },
    { label: "Educação", value: priorityEducacao, color: "bg-indigo-500" },
    { label: "Obras", value: priorityObras, color: "bg-amber-500" },
    { label: "Mobilidade", value: priorityMobilidade, color: "bg-blue-500" },
    { label: "Assistência", value: priorityAssistencia, color: "bg-emerald-500" },
  ].sort((left, right) => right.value - left.value);

  const personnelShare = summary.total ? summary.natureTotals.Pessoal / summary.total : 0;
  const budgetPressure = useMemo(
    () =>
      personnelShare >= topFiveShare && personnelShare >= 0.45
        ? {
            label: "Despesas com pessoal",
            detail: `${share(summary.natureTotals.Pessoal, summary.total)} da LOA está alocada em pessoal e encargos.`,
          }
        : topFiveShare >= 0.75
          ? {
              label: "Concentração nas maiores secretarias",
              detail: `As cinco maiores secretarias concentram ${percent.format(topFiveShare)} do orçamento.`,
            }
          : investmentShare < 0.15
            ? {
                label: "Baixa margem para investimentos",
                detail: `Investimentos representam apenas ${percent.format(investmentShare)} da LOA.`,
              }
            : {
                label: "Concentração orçamentária",
                detail: `As cinco maiores secretarias concentram ${percent.format(topFiveShare)} do orçamento.`,
              },
    [investmentShare, personnelShare, summary.natureTotals.Pessoal, summary.total, topFiveShare]
  );

  // Pergunte ao Orçamento Interactivity Handler
  const askQuestion = (question: string) => {
    setQuestionText(question);
    setIsTyping(true);
    setAnswerText(null);

    setTimeout(() => {
      setIsTyping(false);
      let answer = "";
      const lower = question.toLowerCase();

      if (lower.includes("saúde") || lower.includes("saude")) {
        answer = `A Saúde é uma das maiores prioridades do município, com uma dotação de **${compactCurrency(
          prioritySaude
        )}**, representando aproximadamente **${share(prioritySaude, summary.total)}** do orçamento total LOA ${year}.`;
      } else if (lower.includes("secretaria") || lower.includes("órgão")) {
        const topOrganName = summary.organs[0]?.label ?? "Saúde";
        const topOrganValue = summary.organs[0]?.value ?? 0;
        answer = `A secretaria com maior dotação orçamentária é a **${cleanBudgetLabel(
          topOrganName
        )}**, com um montante de **${compactCurrency(topOrganValue)}** (cerca de **${share(
          topOrganValue,
          summary.total
        )}** do total do município).`;
      } else if (lower.includes("obras")) {
        answer = `O setor de Obras e Infraestrutura Urbana tem dotação estimada em **${compactCurrency(
          priorityObras
        )}** para o exercício de ${year}.`;
      } else if (lower.includes("educação") || lower.includes("educacao")) {
        answer = `Para a Educação está previsto o valor de **${compactCurrency(
          priorityEducacao
        )}**, equivalente a **${share(priorityEducacao, summary.total)}** do total LOA ${year}.`;
      } else if (lower.includes("investimentos e novos projetos") || lower.includes("disponível para investimentos")) {
        answer = `Estão previstos **${compactCurrency(summary.investment)}** para investimentos e novos projetos, o equivalente a **${share(
          summary.investment,
          summary.total
        )}** da LOA ${year}.`;
      } else if (lower.includes("risco") || lower.includes("pressão") || lower.includes("pressao")) {
        answer = `O principal ponto de atenção identificado é **${budgetPressure.label}**: ${budgetPressure.detail}`;
      } else {
        answer = `No orçamento LOA ${year}, o total estimado é de **${compactCurrency(
          summary.total
        )}**. Destacam-se **${compactCurrency(
          summary.natureTotals.Pessoal
        )}** em Pessoal e Encargos, **${compactCurrency(
          summary.natureTotals.Custeio
        )}** em Custeio/Manutenção e **${compactCurrency(
          summary.natureTotals.Investimentos
        )}** para Investimentos diretos.`;
      }

      setAnswerText(answer);
    }, 600);
  };

  // PDF Report Export Handler
  const handlePdfExport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Prefeitura de Osasco", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Sala de Situação - Relatório Executivo LOA ${year}`, 14, 28);
    if (secretariat) {
      doc.text(`Secretaria Filtrada: ${cleanBudgetLabel(secretariat)}`, 14, 35);
    }

    doc.line(14, 38, 196, 38);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Resumo dos Indicadores Gerais", 14, 46);

    doc.setFont("helvetica", "normal");
    doc.text(`Orçamento Total: ${currency.format(summary.total)}`, 14, 54);
    doc.text(`Custeio Real: ${share(summary.operating, summary.total)}`, 14, 61);
    doc.text(`Investimentos Real: ${share(summary.investment, summary.total)}`, 14, 68);
    doc.text(`Pessoal e Folha: ${share(summary.natureTotals.Pessoal, summary.total)}`, 14, 75);

    doc.line(14, 80, 196, 80);

    doc.setFont("helvetica", "bold");
    doc.text("2. Despesas por Natureza", 14, 88);

    doc.setFont("helvetica", "normal");
    doc.text(`Pessoal e Encargos: ${currency.format(summary.natureTotals.Pessoal)}`, 14, 96);
    doc.text(`Outras Despesas Correntes (Custeio): ${currency.format(summary.natureTotals.Custeio)}`, 14, 103);
    doc.text(`Investimentos (Obras/Projetos): ${currency.format(summary.natureTotals.Investimentos)}`, 14, 110);
    doc.text(`Amortização da Dívida: ${currency.format(summary.natureTotals.Amortização)}`, 14, 117);

    doc.line(14, 122, 196, 122);

    doc.setFont("helvetica", "bold");
    doc.text("3. Distribuição das Principais Secretarias", 14, 130);

    doc.setFont("helvetica", "normal");
    let y = 138;
    summary.organs.slice(0, 5).forEach((organ, index) => {
      doc.text(
        `${index + 1}. ${cleanBudgetLabel(organ.label)}: ${currency.format(organ.value)} (${share(
          organ.value,
          summary.total
        )})`,
        14,
        y
      );
      y += 8;
    });

    doc.save(`LOA-${year}-Relatorio-Executivo.pdf`);
  };

  const suggestedQuestions = [
    "Quanto será investido em Saúde?",
    "Qual secretaria recebe mais recursos?",
    "Quanto será investido em obras?",
    "Quanto vai para Educação?",
    "Quanto está disponível para investimentos e novos projetos?",
    "Onde está o maior risco orçamentário neste exercício?",
  ];

  const renderAnswerDisplay = () => {
    if (!isTyping && !answerText) return null;

    return (
      <div
        className="rounded-xl border border-tertiary/25 bg-tertiary/[0.04] p-4 shadow-sm ring-1 ring-tertiary/10 transition-all duration-300"
        aria-live="polite"
      >
        <div className="mb-3 flex items-center gap-2 text-tertiary">
          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          <span className="text-[11px] font-black uppercase tracking-wider">Insight executivo</span>
        </div>
        {isTyping ? (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
            <span className="animate-pulse">Analisando dotações da LOA...</span>
          </div>
        ) : (
          <p
            className="text-sm text-on-surface-variant font-medium leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: answerText
                ? answerText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-extrabold">$1</strong>')
                : "",
            }}
          ></p>
        )}
      </div>
    );
  };

  const aiObservations = useMemo<AiObservation[]>(() => {
    if (!summary.total) {
      return [{
        title: "Dados insuficientes",
        text: "Não há valores orçamentários disponíveis para gerar observações nesta seleção.",
        icon: "database",
        tone: "critical",
      }];
    }

    const composition = [
      { label: "Pessoal e encargos", value: summary.natureTotals.Pessoal },
      { label: "Custeio", value: summary.natureTotals.Custeio },
      { label: "Investimentos diretos", value: summary.natureTotals.Investimentos },
      { label: "Amortização", value: summary.natureTotals.Amortização },
    ].sort((left, right) => right.value - left.value);
    const dominantComposition = composition[0];
    const topOrgan = summary.organs[0];
    const directInvestmentShare = summary.natureTotals.Investimentos / summary.total;
    const observations: AiObservation[] = [
      {
        title: "Concentração administrativa",
        text: `${cleanBudgetLabel(topOrgan?.label ?? "Não informado")} é o maior bloco administrativo, com ${compactCurrency(topOrgan?.value ?? 0)} (${share(topOrgan?.value ?? 0, summary.total)} da LOA). As cinco maiores secretarias concentram ${percent.format(topFiveShare)} do orçamento.`,
        icon: "account_balance",
        tone: topFiveShare >= 0.75 ? "warning" : "info",
      },
      {
        title: "Composição da despesa",
        text: `${dominantComposition.label} é a principal categoria, somando ${compactCurrency(dominantComposition.value)} (${share(dominantComposition.value, summary.total)} do total). Essa composição indica onde está concentrada a maior parte da capacidade de execução orçamentária.`,
        icon: "pie_chart",
        tone: dominantComposition.label === "Pessoal e encargos" ? "warning" : "info",
      },
      {
        title: "Capacidade de investimento",
        text: `Os investimentos diretos somam ${compactCurrency(summary.natureTotals.Investimentos)}, equivalentes a ${percent.format(directInvestmentShare)} da LOA. A ação de maior valor é ${cleanBudgetLabel(topInvestmentAction?.label ?? "não informada")}, com ${compactCurrency(topInvestmentAction?.value ?? 0)}.`,
        icon: "trending_up",
        tone: directInvestmentShare >= 0.2 ? "positive" : "warning",
      },
      {
        title: "Prioridade financeira",
        text: `O maior programa identificado é ${cleanBudgetLabel(topProgram?.label ?? "não informado")}, com ${compactCurrency(topProgram?.value ?? 0)}. O processo administrativo de maior valor é ${cleanBudgetLabel(topProcess?.label ?? "não informado")}, com ${compactCurrency(topProcess?.value ?? 0)}.`,
        icon: "track_changes",
        tone: "info",
      },
      {
        title: "Ponto de atenção",
        text: `${budgetPressure.label}: ${budgetPressure.detail} Recomenda-se acompanhar esse indicador durante a execução da LOA.`,
        icon: "warning",
        tone: "critical",
      },
    ];

    return observations;
  }, [budgetPressure, summary, topFiveShare, topInvestmentAction, topProcess, topProgram]);

  const execMetrics = useMemo(() => {
    const records = getCurrentRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    return calculateExecutiveMetrics(records, summary.total);
  }, [getCurrentRecords, year, secretariat, summary.total]);

  return (
    <div className="relative min-h-screen bg-background font-body text-on-surface antialiased">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/50 flex justify-between items-center w-full px-8 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-surface-container rounded-xl flex items-center justify-center text-on-surface cursor-pointer transition-colors"
            aria-label="Alternar Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {sidebarCollapsed ? "menu" : "menu_open"}
            </span>
          </button>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brasao.png"
              alt="Brasão de Osasco"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="hidden md:flex gap-8 font-headline text-sm font-semibold tracking-wide">
            <Link className="text-tertiary border-b-2 border-tertiary pb-1" href="/apresentacao">
              Painel Executivo
            </Link>
            <Link className="text-on-surface-variant hover:text-tertiary transition-colors pb-1" href="/transparente">
              LOA Transparência
            </Link>
            <Link className="text-on-surface-variant hover:text-tertiary transition-colors pb-1" href="/">
              Visão Analítica
            </Link>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside
        className={`flex flex-col h-screen fixed left-0 top-0 border-r border-inverse-surface/10 pt-24 pb-6 px-4 bg-[#1e2022] text-white w-72 shadow-xl z-40 transition-all duration-300 lg:translate-x-0 ${
          sidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:px-0 lg:border-r-0" : "translate-x-0"
        } lg:flex`}
      >
        <nav className="flex-1 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <Link
            className="flex items-center gap-4 px-4 py-3 bg-tertiary text-white rounded-xl font-bold font-body text-sm shadow-md shadow-tertiary/20"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span>Visão Geral</span>
          </Link>
          <Link
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="/receitas"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="font-medium">Receita</span>
          </Link>
          <Link
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="/despesas"
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            <span className="font-medium">Despesa</span>
          </Link>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#secao-1"
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            <span className="font-medium">1. Quanto temos?</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#secao-2"
          >
            <span className="material-symbols-outlined text-xl">target</span>
            <span className="font-medium">2. Quanto podemos decidir?</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#secao-3"
          >
            <span className="material-symbols-outlined text-xl">pie_chart</span>
            <span className="font-medium">3. Onde está o dinheiro?</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#secao-4"
          >
            <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
            <span className="font-medium">4. Entrega o Plano?</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#secao-5"
          >
            <span className="material-symbols-outlined text-xl">notification_important</span>
            <span className="font-medium">5. Onde agir?</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#insights"
          >
            <span className="material-symbols-outlined text-xl">psychology</span>
            <span className="font-medium">Análise IA</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#pergunte"
          >
            <span className="material-symbols-outlined text-xl">forum</span>
            <span className="font-medium">Pergunte ao Orçamento</span>
          </a>
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-white/10">
          <button
            onClick={handlePdfExport}
            className="w-full flex items-center justify-center gap-3 bg-tertiary/20 text-tertiary-fixed py-3.5 rounded-xl font-bold mb-6 hover:bg-tertiary/30 transition-colors border border-tertiary/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>Gerar Relatório
          </button>
          <Link
            className="flex items-center gap-4 px-4 py-2.5 text-white/60 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="/transparente"
          >
            <span className="material-symbols-outlined text-xl">help</span>
            <span className="font-medium">Suporte</span>
          </Link>
          <Link
            className="flex items-center gap-4 px-4 py-2.5 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all font-body text-sm rounded-xl"
            href="/"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-medium">Sair</span>
          </Link>
        </div>
      </aside>

      {!sidebarCollapsed && (
        <button
          aria-label="Fechar menu"
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden border-0 cursor-pointer"
        />
      )}

      <main className={`transition-all duration-300 pt-24 px-4 sm:px-8 pb-16 max-w-[1600px] mx-auto w-full ${
        sidebarCollapsed ? "lg:ml-0" : "lg:ml-72"
      }`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
              <span>Gabinete do Prefeito</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Sala de Situação Orçamentária</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-black text-on-surface tracking-tight">
              Painel Executivo da LOA 2027
            </h1>
            <p className="text-on-surface-variant text-base mt-1">
              Sala de Situação do Prefeito — Visão Consolidada para Tomada de Decisão
            </p>
          </div>
        </div>

        {dataSource === "real" && isLoadingRealData && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-tertiary/20 bg-tertiary/[0.04] px-4 py-3 text-sm font-medium text-tertiary" role="status">
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            Carregando os dados da importação selecionada...
          </div>
        )}
        {dataSource === "real" && dataError && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-error/25 bg-error/[0.04] px-4 py-3 text-sm font-medium text-error" role="alert">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{dataError} Verifique a importação e tente novamente.</span>
          </div>
        )}

        <div className="bg-surface-container-low border border-outline-variant/30 px-6 py-4 mb-8 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="relative flex items-center bg-surface border border-outline-variant/60 rounded-xl px-4 py-2.5 hover:bg-surface-container-low transition-colors shadow-sm text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] mr-2">corporate_fare</span>
              <select
                name="presentation-secretariat"
                value={secretariat}
                onChange={(e) => setSecretariat(e.target.value)}
                className="bg-transparent border-none outline-none pr-8 cursor-pointer appearance-none animate-none"
                aria-label="Filtrar por secretaria"
              >
                <option value="">Todas as Secretarias</option>
                {availableSecretariats.map((item) => (
                  <option key={item} value={item}>{cleanBudgetLabel(item)}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-sm absolute right-3 pointer-events-none">expand_more</span>
            </div>

            <button
              onClick={() => setYear((y) => (y === 2027 ? 2026 : 2027))}
              className="px-5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              LOA {year}
            </button>

            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30" role="group" aria-label="Origem dos dados">
              <button
                type="button"
                onClick={() => setDataSource("ficticio")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === "ficticio"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Simulados
              </button>
              <button
                type="button"
                onClick={() => setDataSource("real")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === "real"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Reais
              </button>
            </div>

            <button
              onClick={() => {
                setSecretariat("");
                setYear(2027);
              }}
              className="px-6 py-2.5 bg-tertiary text-white rounded-xl font-bold shadow-lg shadow-tertiary/30 hover:bg-[#004e8c] transition-colors flex items-center gap-2 ml-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Resetar Filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="p-7 rounded-2xl bg-gradient-to-br from-tertiary to-[#00386b] text-white shadow-xl shadow-tertiary/20 relative overflow-hidden group border border-tertiary/20">
            <div className="absolute -right-6 -bottom-6 opacity-[0.08] group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[160px]">account_balance</span>
            </div>
            <div className="relative z-10">
              <p className="text-tertiary-fixed font-semibold text-xs tracking-wide mb-2 opacity-90 uppercase">LOA Total {year}</p>
              <h3 className="text-4xl font-headline font-black mb-3 tracking-tight">{compactCurrency(summary.total)}</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold bg-white/10 backdrop-blur-sm w-fit px-2.5 py-1 rounded-lg border border-white/10">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>{trend >= 0 ? "+" : ""}{percent.format(trend)} vs 2026</span>
              </div>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <p className="text-outline font-bold text-xs uppercase tracking-wider">Receita Própria</p>
              <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                41%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-headline font-black text-on-surface mb-1">{compactCurrency(execMetrics.ownRevenue)}</h3>
              <p className="text-xs text-on-surface-variant font-medium">IPTU, ISS, Taxas e Contribuições</p>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <p className="text-outline font-bold text-xs uppercase tracking-wider">Transferências</p>
              <span className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                59%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-headline font-black text-on-surface mb-1">{compactCurrency(execMetrics.transfers)}</h3>
              <p className="text-xs text-on-surface-variant font-medium">FPM, ICMS, SUS, FUNDEB</p>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <p className="text-outline font-bold text-xs uppercase tracking-wider">Resultado Projetado</p>
              <div className="w-8 h-8 rounded-full bg-[#e6f4ea] flex items-center justify-center text-[#137333]">
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-headline font-black text-on-surface mb-1">Equilibrado</h3>
              <p className="text-xs font-semibold text-[#137333]">Superávit Projetado: R$ 12 mi</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-4">
            <DecisionCapacityCard
              value={execMetrics.managerialMargin}
              totalLoa={summary.total}
              managerialMarginPct={execMetrics.managerialMarginPct}
            />
          </div>
          <div className="lg:col-span-4">
            <WaterfallDecisionMargin
              totalLoa={summary.total}
              mandatoryPersonnel={execMetrics.mandatoryPersonnel}
              constitutionalObligations={execMetrics.constitutionalObligations}
              continuedContracts={execMetrics.continuedContracts}
              definedInvestments={execMetrics.definedInvestments}
              managerialMargin={execMetrics.managerialMargin}
            />
          </div>
          <div className="lg:col-span-4">
            <RigidityDonut
              rigidCompromisedPct={execMetrics.rigidCompromisedPct}
              breakdown={execMetrics.rigidityBreakdown}
            />
          </div>
        </div>

        <section id="secao-1" className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              1
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface">Quanto temos?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueEvolutionChart currentLoaTotal={summary.total} />
            <RevenueRiskTable totalLoa={summary.total} />
            <BudgetScenarioSimulator baseTotal={summary.total} />
          </div>
        </section>

        <section id="secao-2" className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              2
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface">Quanto realmente podemos decidir?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MandatoryVsDiscretionaryCard
              totalMandatory={execMetrics.totalMandatory}
              totalDiscretionary={execMetrics.totalDiscretionary}
              mandatoryPct={execMetrics.mandatoryPct}
              discretionaryPct={execMetrics.discretionaryPct}
            />
            <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline font-black text-lg text-on-surface">Destinação das Fontes de Recursos</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Alocação entre Manutenção da Máquina e Obras</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 uppercase text-on-surface">
                    <span>Manutenção da Máquina ({share(summary.operating, summary.total)})</span>
                    <span className="font-mono text-outline">{compactCurrency(summary.operating)}</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full transition-all duration-500"
                      style={{ width: `${summary.total > 0 ? (summary.operating / summary.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 uppercase text-primary">
                    <span>Investimentos e Obras ({share(summary.investment, summary.total)})</span>
                    <span className="font-mono">{compactCurrency(summary.investment)}</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${summary.total > 0 ? (summary.investment / summary.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs font-medium text-on-surface-variant italic border-l-4 border-primary/40 pl-3 py-1 mt-4">
                &quot;R$ {compactCurrency(summary.investment)} está alocado em melhorias estruturais da cidade neste exercício.&quot;
              </p>
            </div>
          </div>
        </section>

        <section id="secao-3" className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              3
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface">Onde estamos colocando o dinheiro?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PolicyAllocationChart functions={execMetrics.functionsRanking} />
            <InvestmentsByOrganCard investments={execMetrics.investmentsByOrgan} />
          </div>

          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-7 shadow-sm">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Alocação por Secretaria (Mapa de Valor)</h3>
                {secretariat && (
                  <p className="text-xs font-semibold text-tertiary mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Filtrando por: <strong>{cleanBudgetLabel(secretariat)}</strong>
                  </p>
                )}
              </div>
              {secretariat && (
                <button
                  onClick={() => setSecretariat("")}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Mostrar todas as secretarias</span>
                </button>
              )}
            </div>

            <Treemap items={summary.organs} selectedSecretariat={secretariat} onSelectSecretariat={setSecretariat} />
          </div>
        </section>

        <section id="secao-4" className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              4
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface">O orçamento entrega o Plano de Governo?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LdoDeliveryMatrix totalLoa={summary.total} />
            <InsufficientLdoGoalsCard />
            <StrategicProgramsCard />
          </div>
        </section>

        <section id="secao-5" className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              5
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface">Onde o Prefeito precisa agir?</h2>
          </div>

          <div className="space-y-6">
            <ExecutiveActionKpis
              transfersDependencyPct={execMetrics.transfersDependencyPct}
              transfersValue={execMetrics.transfers}
              topFiveOrgansShare={execMetrics.topFiveOrgansShare}
              highRiskRevenueTotal={execMetrics.highRiskRevenueTotal}
              insufficientGoalsCount={4}
            />
            <ExecutiveAlertsMap />
          </div>
        </section>

        <div id="insights" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 scroll-mt-24">
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-outline-variant/40 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant/30">
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div>
                <h2 className="text-2xl font-headline font-black text-on-surface">Análise Inteligente (IA)</h2>
                <p className="text-xs text-on-surface-variant">Recomendações e pontos de atenção com base estrita nos dados da LOA 2027</p>
              </div>
            </div>
            <div className="space-y-4">
              {aiObservations.map((observation) => {
                const styles = {
                  info: {
                    container: "bg-surface-container-lowest border-outline-variant/40 hover:border-tertiary/30",
                    icon: "bg-tertiary",
                    text: "text-on-surface-variant",
                  },
                  positive: {
                    container: "bg-[#e8f5e9] border-[#c8e6c9] hover:border-[#a5d6a7]",
                    icon: "bg-[#43a047]",
                    text: "text-[#1b5e20]",
                  },
                  warning: {
                    container: "bg-[#fff8e1] border-[#ffecb3] hover:border-[#ffd54f]",
                    icon: "bg-[#fbc02d]",
                    text: "text-[#795548]",
                  },
                  critical: {
                    container: "bg-[#ffebee] border-[#ffcdd2] hover:border-[#ef9a9a]",
                    icon: "bg-[#e53935]",
                    text: "text-[#b71c1c]",
                  },
                }[observation.tone];

                return (
                  <div key={observation.title} className={`flex gap-4 items-start p-5 rounded-xl border transition-colors shadow-sm ${styles.container}`}>
                    <div className={`mt-0.5 w-9 h-9 rounded-lg ${styles.icon} text-white flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-lg">{observation.icon}</span>
                    </div>
                    <div className={`text-sm font-medium leading-relaxed ${styles.text}`}>
                      <p className="font-black mb-1">{observation.title}</p>
                      <p>{observation.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="pergunte" className="bg-gradient-to-b from-surface-container-low to-surface-container rounded-2xl p-8 shadow-inner flex flex-col border border-outline-variant/50 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">forum</span>
              </div>
              <h2 className="text-2xl font-headline font-black text-on-surface">Pergunte ao Orçamento</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 font-medium">Acesso rápido aos dados consolidados para tomadas de decisão imediatas.</p>

            <div className="space-y-3 flex-1">
              {suggestedQuestions.map((q) => (
                <div key={q} className="space-y-2">
                  <button
                    onClick={() => askQuestion(q)}
                    className={`w-full text-left p-4 bg-white border transition-all rounded-xl text-sm font-bold flex justify-between items-center group text-on-surface cursor-pointer ${
                      questionText === q ? "border-tertiary shadow-sm" : "border-outline-variant/30 hover:border-tertiary hover:shadow-md"
                    }`}
                  >
                    {q}
                    <span className="material-symbols-outlined text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      arrow_forward
                    </span>
                  </button>
                  {questionText === q && renderAnswerDisplay()}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (questionText.trim()) {
                    askQuestion(questionText);
                  }
                }}
                className="relative"
              >
                <input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-white border-2 border-outline-variant/30 rounded-xl px-5 py-4 text-sm pr-14 focus:ring-0 focus:border-tertiary shadow-sm outline-none transition-colors placeholder:text-outline font-medium"
                  placeholder="Digite sua pergunta..."
                  type="text"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-tertiary text-white rounded-lg flex items-center justify-center hover:bg-[#004e8c] transition-colors shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
            {questionText && !suggestedQuestions.includes(questionText) && <div className="mt-4">{renderAnswerDisplay()}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
