"use client";

import { useState } from "react";
import { percent } from "@/lib/format";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function DecisionCapacityCard({
  value,
  totalLoa,
  managerialMarginPct,
}: {
  value: number;
  totalLoa: number;
  managerialMarginPct: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group">
      {/* Tooltip trigger */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-tertiary">
            Capacidade de Decisão 2027
          </p>
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip((prev) => !prev)}
              className="text-on-surface-variant hover:text-tertiary transition-colors flex items-center justify-center p-0.5 rounded-full"
              aria-label="Como este indicador foi calculado?"
            >
              <span className="material-symbols-outlined text-sm">help</span>
            </button>

            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-30 font-normal leading-relaxed border border-slate-700 pointer-events-none animate-in fade-in">
                <p className="font-bold mb-1 text-sky-300">Como é calculada a Margem:</p>
                <p>
                  Representa a LOA Total deduzida das despesas com <strong>Pessoal e Encargos</strong>, 
                  <strong> Vinculações Constitucionais</strong> (Saúde 15% / Educação 25%), 
                  <strong> Contratos Continuados</strong> essenciais e <strong>Investimentos já em andamento</strong>.
                </p>
                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-300 font-mono">
                  Margem Gerencial = LOA Total − Compromissos Rígidos
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
          <span className="material-symbols-outlined text-xl">target</span>
        </div>
      </div>

      <div>
        <h3 className="text-4xl font-headline font-black text-on-surface mb-1 tracking-tight">
          {compactCurrency(value)}
        </h3>
        <p className="text-sm font-extrabold text-emerald-600">
          {percent.format(managerialMarginPct / 100)} da LOA
        </p>
        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
          Recursos com maior flexibilidade para decisões e novas prioridades do governo.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant font-medium">
        <span>Compromissos rígidos:</span>
        <span className="font-bold text-on-surface">{compactCurrency(totalLoa - value)}</span>
      </div>
    </div>
  );
}
