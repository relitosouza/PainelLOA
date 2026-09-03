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

function cleanLabel(label: string) {
  return label.replace(/^\d{2}\.\d{2}\.\d{3}\.\d{2}\s*-\s*/i, "").replace(/=$/, "").trim();
}

export function PolicyAllocationChart({
  functions,
}: {
  functions: {
    functionName: string;
    value: number;
    share: number;
  }[];
}) {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  const maxVal = functions.length > 0 ? functions[0].value : 1;

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Alocação por Política Pública</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Distribuição do orçamento por Função de Governo</p>
        </div>
        {selectedFunction && (
          <button
            type="button"
            onClick={() => setSelectedFunction(null)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">close</span>
            Limpar seleção
          </button>
        )}
      </div>

      <div className="space-y-4">
        {functions.slice(0, 6).map((item, idx) => {
          const widthPct = Math.max(5, (item.value / maxVal) * 100);
          const colors = [
            "bg-[#1e3a8a]", // Navy Blue
            "bg-[#0284c7]", // Sky Blue
            "bg-[#0d9488]", // Teal
            "bg-[#f59e0b]", // Amber
            "bg-[#6366f1]", // Indigo
            "bg-[#64748b]", // Slate
          ];
          const barColor = colors[idx % colors.length];

          return (
            <div
              key={item.functionName}
              onClick={() => setSelectedFunction(selectedFunction === item.functionName ? null : item.functionName)}
              className={`space-y-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                selectedFunction === item.functionName
                  ? "bg-primary/10 ring-1 ring-primary/40 font-bold"
                  : "hover:bg-surface-container-low"
              }`}
            >
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span className="truncate pr-2">{cleanLabel(item.functionName)}</span>
                <span className="font-mono text-on-surface-variant shrink-0">
                  {compactCurrency(item.value)} ({percent.format(item.share / 100)})
                </span>
              </div>

              {/* Barra Horizontal Proporcional */}
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedFunction && (
        <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs animate-in fade-in">
          <p className="font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">account_tree</span>
            Drill-down: {cleanLabel(selectedFunction)}
          </p>
          <p className="text-on-surface-variant mt-1">
            Navegue para detalhar Programas, Ações e Dotações vinculadas a esta política pública.
          </p>
        </div>
      )}
    </div>
  );
}

export function InvestmentsByOrganCard({
  investments,
}: {
  investments: {
    organ: string;
    value: number;
    share: number;
  }[];
}) {
  const [showAllModal, setShowAllModal] = useState(false);

  const totalInvest = investments.reduce((sum, inv) => sum + inv.value, 0);
  const maxVal = investments.length > 0 ? investments[0].value : 1;

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Investimentos por Secretaria</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Ranking de despesas de capital e obras (4.4)</p>
        </div>
        <span className="text-xs font-mono font-bold text-primary">
          Total: {compactCurrency(totalInvest)}
        </span>
      </div>

      <div className="space-y-4">
        {investments.slice(0, 5).map((item) => {
          const widthPct = Math.max(8, (item.value / maxVal) * 100);

          return (
            <div key={item.organ} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-on-surface">
                <span className="truncate pr-2 font-semibold" title={cleanLabel(item.organ)}>
                  {cleanLabel(item.organ)}
                </span>
                <span className="font-mono text-on-surface shrink-0 font-bold">
                  {compactCurrency(item.value)}
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-3 border-t border-outline-variant/30 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          Ver todas as Secretarias ({investments.length})
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>

      {/* Modal Ver Todas as Secretarias */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface border border-outline-variant rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-3">
              <h4 className="text-base font-headline font-black text-on-surface">
                Todos os Investimentos por Secretaria (LOA 2027)
              </h4>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/20 pr-2">
              {investments.map((item, idx) => (
                <div key={item.organ} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 pr-2 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-surface-container flex items-center justify-center font-bold text-[10px] text-on-surface-variant">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-on-surface truncate" title={cleanLabel(item.organ)}>
                      {cleanLabel(item.organ)}
                    </span>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="font-bold text-on-surface">{compactCurrency(item.value)}</span>
                    <span className="text-on-surface-variant text-[11px] ml-2">
                      ({percent.format(item.share / 100)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
