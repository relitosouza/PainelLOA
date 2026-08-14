"use client";

import { useMemo } from "react";
import { percent } from "@/lib/format";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function WaterfallDecisionMargin({
  totalLoa,
  mandatoryPersonnel,
  constitutionalObligations,
  continuedContracts,
  definedInvestments,
  managerialMargin,
}: {
  totalLoa: number;
  mandatoryPersonnel: number;
  constitutionalObligations: number;
  continuedContracts: number;
  definedInvestments: number;
  managerialMargin: number;
}) {
  const steps = useMemo(() => {
    let running = totalLoa;
    const items = [
      {
        label: "LOA Total",
        sublabel: "Orçamento Global",
        value: totalLoa,
        type: "total" as const,
        startVal: 0,
        endVal: totalLoa,
        color: "bg-[#00386b]",
      },
      {
        label: "Despesas Obrigatórias",
        sublabel: "Pessoal e Encargos",
        value: -mandatoryPersonnel,
        type: "deduction" as const,
        startVal: running,
        endVal: (running -= mandatoryPersonnel),
        color: "bg-rose-500",
      },
      {
        label: "Vinculações Legais",
        sublabel: "Saúde e Educação",
        value: -constitutionalObligations,
        type: "deduction" as const,
        startVal: running,
        endVal: (running -= constitutionalObligations),
        color: "bg-sky-500",
      },
      {
        label: "Contratos Continuados",
        sublabel: "Custeio Essencial",
        value: -continuedContracts,
        type: "deduction" as const,
        startVal: running,
        endVal: (running -= continuedContracts),
        color: "bg-amber-500",
      },
      {
        label: "Investimentos Definidos",
        sublabel: "Projetos em Curso",
        value: -definedInvestments,
        type: "deduction" as const,
        startVal: running,
        endVal: (running -= definedInvestments),
        color: "bg-orange-500",
      },
      {
        label: "Margem Gerencial",
        sublabel: "Poder de Decisão",
        value: managerialMargin,
        type: "final" as const,
        startVal: 0,
        endVal: managerialMargin,
        color: "bg-emerald-600",
      },
    ];
    return items;
  }, [totalLoa, mandatoryPersonnel, constitutionalObligations, continuedContracts, definedInvestments, managerialMargin]);

  const maxVal = totalLoa > 0 ? totalLoa : 1;

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Margem de Decisão do Prefeito</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Deduções estruturais até a capacidade real de alocação</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Cascata Orçamentária
        </span>
      </div>

      {/* Gráfico de Barras em Cascata */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3 h-52 items-end pb-4 border-b border-outline-variant/30">
        {steps.map((step) => {
          const heightPct = Math.max(8, (Math.abs(step.type === "total" || step.type === "final" ? step.endVal : step.value) / maxVal) * 100);
          const bottomPct = (Math.min(step.startVal, step.endVal) / maxVal) * 100;

          return (
            <div key={step.label} className="h-full flex flex-col justify-end items-center group relative">
              {/* Tooltip no hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] p-2 rounded-lg pointer-events-none z-20 whitespace-nowrap shadow-lg border border-slate-700 font-mono">
                <p className="font-bold text-sky-300">{step.label}</p>
                <p>{step.type === "deduction" ? "-" : ""}{compactCurrency(Math.abs(step.value))}</p>
                <p className="text-[10px] text-slate-300">{percent.format(Math.abs(step.value) / maxVal)} da LOA</p>
              </div>

              {/* Valor no topo da barra */}
              <span className={`text-[10px] font-black mb-1 font-mono ${step.type === "final" ? "text-emerald-700" : "text-on-surface"}`}>
                {compactCurrency(Math.abs(step.value))}
              </span>

              {/* Barra do Waterfall */}
              <div className="w-full h-full relative flex items-end">
                <div
                  style={{
                    height: `${heightPct}%`,
                    marginBottom: step.type === "deduction" ? `${bottomPct}%` : undefined,
                  }}
                  className={`w-full rounded-lg ${step.color} shadow-sm transition-all group-hover:brightness-110 flex items-center justify-center`}
                >
                  {step.type === "final" && (
                    <span className="material-symbols-outlined text-white text-xs animate-pulse">check</span>
                  )}
                </div>
              </div>

              {/* Rótulo inferior */}
              <div className="text-center mt-2 w-full">
                <p className="text-[10px] font-bold text-on-surface truncate" title={step.label}>
                  {step.label.split(" ")[0]}
                </p>
                <p className="text-[9px] text-on-surface-variant font-medium hidden sm:block truncate">
                  {step.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé explicativo */}
      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          Margem Gerencial: <strong className="text-emerald-700 font-bold">{compactCurrency(managerialMargin)}</strong> ({percent.format(managerialMargin / (totalLoa || 1))})
        </span>
        <span className="text-[11px] text-on-surface-variant/70 hidden sm:inline">
          Dedução estrita da base LOA 2027
        </span>
      </div>
    </div>
  );
}
