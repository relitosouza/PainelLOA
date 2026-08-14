"use client";

import { useMemo, useState } from "react";
import { percent } from "@/lib/format";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function RevenueEvolutionChart({
  currentLoaTotal,
}: {
  currentLoaTotal: number;
}) {
  const [viewMode, setViewMode] = useState<"nominal" | "percent">("nominal");

  // Dados históricos consolidados da base de receitas
  const historicalData = useMemo(() => {
    return [
      { year: "2024", total: 5_260_000_000, label: "Arrecadado" },
      { year: "2025", total: 5_810_000_000, label: "Arrecadado" },
      { year: "2026", total: 5_815_000_000, label: "LOA 2026" },
      { year: "2027", total: currentLoaTotal > 0 ? currentLoaTotal : 6_500_000_000, label: "LOA 2027" },
    ];
  }, [currentLoaTotal]);

  const maxVal = Math.max(...historicalData.map((d) => d.total));
  const baseVal = historicalData[0].total;

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Evolução da Receita Total</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Série histórica comparada com a projeção da LOA 2027</p>
        </div>

        {/* Toggle Nominal vs Percentual */}
        <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("nominal")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "nominal" ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Nominal (R$)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("percent")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "percent" ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Variação (%)
          </button>
        </div>
      </div>

      {/* Gráfico de Linha / Pontos SVG */}
      <div className="relative h-44 w-full flex items-end justify-between px-6 pb-6 pt-8 border-b border-outline-variant/30">
        {/* Linhas de grade sutis */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 px-6 py-4">
          <div className="border-b border-dashed border-outline"></div>
          <div className="border-b border-dashed border-outline"></div>
          <div className="border-b border-dashed border-outline"></div>
        </div>

        {historicalData.map((d, i) => {
          const heightPct = Math.max(15, (d.total / maxVal) * 100);
          const growth = i > 0 ? (d.total / historicalData[i - 1].total - 1) * 100 : 0;
          const totalGrowth = ((d.total / baseVal - 1) * 100);

          return (
            <div key={d.year} className="relative flex flex-col items-center group z-10">
              {/* Valor / Tag sobre o ponto */}
              <div className="mb-2 text-center">
                <span className="text-xs font-mono font-black text-on-surface block">
                  {viewMode === "nominal" ? compactCurrency(d.total) : `${totalGrowth >= 0 ? "+" : ""}${totalGrowth.toFixed(1)}%`}
                </span>
                {i > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    +{growth.toFixed(1)}% a.a
                  </span>
                )}
              </div>

              {/* Ponto interativo */}
              <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20 shadow-md group-hover:scale-125 transition-transform cursor-pointer"></div>

              {/* Rótulo do Ano */}
              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-on-surface block">{d.year}</span>
                <span className="text-[10px] text-on-surface-variant">{d.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé explicativo */}
      <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Crescimento nominal acumulado (2024-2027):</span>
        <strong className="text-primary font-mono font-bold">
          +{(((historicalData[3].total / baseVal) - 1) * 100).toFixed(1)}%
        </strong>
      </div>
    </div>
  );
}
