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

export function RigidityDonut({
  rigidCompromisedPct,
  breakdown,
}: {
  rigidCompromisedPct: number;
  breakdown: {
    category: string;
    value: number;
    share: number;
    color: string;
    description: string;
  }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Geração das fatias do Donut SVG
  const slices = useMemo(() => {
    let accumulated = 0;
    const circumference = 2 * Math.PI * 40; // raio 40 => ~251.32

    return breakdown.map((item, idx) => {
      const sliceLength = (item.share / 100) * circumference;
      const strokeDashoffset = -accumulated;
      accumulated += sliceLength;

      return {
        ...item,
        idx,
        strokeDasharray: `${sliceLength} ${circumference}`,
        strokeDashoffset,
      };
    });
  }, [breakdown]);

  const activeItem = hoveredIdx !== null ? breakdown[hoveredIdx] : null;

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Mapa de Rigidez Orçamentária</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Grau de comprometimento prévio das receitas</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8 my-2">
        {/* Donut Interativo */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f5f9" strokeWidth="14" />
            {slices.map((slice) => (
              <circle
                key={slice.category}
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke={slice.color}
                strokeWidth={hoveredIdx === slice.idx ? "17" : "14"}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Centro do Donut com % rígido ou item hover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
            {activeItem ? (
              <>
                <span className="text-lg font-black text-on-surface leading-none font-mono">
                  {percent.format(activeItem.share / 100)}
                </span>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase truncate max-w-[100px] mt-1">
                  {activeItem.category.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-slate-900 leading-none font-mono">
                  {percent.format(rigidCompromisedPct / 100)}
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight mt-1 max-w-[110px] leading-tight">
                  do orçamento rigidamente comprometido
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legenda com percentual e valores */}
        <div className="flex-1 space-y-2 w-full text-xs">
          {breakdown.map((item, idx) => (
            <div
              key={item.category}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                hoveredIdx === idx ? "bg-surface-container font-bold" : "hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-on-surface font-medium" title={item.description}>
                  {item.category}
                </span>
              </div>
              <div className="text-right font-mono shrink-0">
                <span className="font-bold text-on-surface">{percent.format(item.share / 100)}</span>
                <span className="text-on-surface-variant text-[10px] ml-1.5 hidden sm:inline">
                  ({compactCurrency(item.value)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeItem ? (
        <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant">
          <strong className="text-on-surface">{activeItem.category}:</strong> {activeItem.description} ({compactCurrency(activeItem.value)})
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-on-surface-variant italic">
          Passe o mouse nas fatias ou itens para consultar o valor nominal e a base legal de cada compromisso.
        </div>
      )}
    </div>
  );
}

export function MandatoryVsDiscretionaryCard({
  totalMandatory,
  totalDiscretionary,
  mandatoryPct,
  discretionaryPct,
}: {
  totalMandatory: number;
  totalDiscretionary: number;
  mandatoryPct: number;
  discretionaryPct: number;
}) {
  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Despesas Obrigatórias vs Discricionárias</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Flexibilidade de gestão do orçamento municipal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Visual Donut Dual */}
        <div className="flex items-center gap-5 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#e2e8f0" strokeWidth="16" />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="38"
                stroke="#ef4444"
                strokeWidth="16"
                strokeDasharray={`${(mandatoryPct / 100) * 238.7} 238.7`}
                strokeDashoffset="0"
                className="transition-all duration-500"
              />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="38"
                stroke="#10b981"
                strokeWidth="16"
                strokeDasharray={`${(discretionaryPct / 100) * 238.7} 238.7`}
                strokeDashoffset={`-${(mandatoryPct / 100) * 238.7}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-on-surface font-mono">{percent.format(mandatoryPct / 100)}</span>
              <span className="text-[9px] font-bold text-rose-600 uppercase">Rígidas</span>
            </div>
          </div>

          <div className="space-y-3 flex-1 text-xs">
            <div>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Obrigatórias
                </span>
                <span className="font-mono">{percent.format(mandatoryPct / 100)}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-mono">{compactCurrency(totalMandatory)}</p>
            </div>

            <div className="pt-2 border-t border-outline-variant/30">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Discricionárias
                </span>
                <span className="font-mono">{percent.format(discretionaryPct / 100)}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-mono">{compactCurrency(totalDiscretionary)}</p>
            </div>
          </div>
        </div>

        {/* Lista das Principais Obrigações */}
        <div className="space-y-2 text-xs">
          <p className="font-bold text-on-surface uppercase text-[11px] tracking-wider mb-2 text-slate-700">
            Composição das Obrigatórias:
          </p>
          <div className="flex justify-between p-2 bg-surface-container-low rounded-lg font-medium">
            <span>Pessoal e Encargos Sociais</span>
            <span className="font-mono font-bold text-on-surface">Folha Ativa/Inativa</span>
          </div>
          <div className="flex justify-between p-2 bg-surface-container-low rounded-lg font-medium">
            <span>Saúde (Mínimo 15% CF)</span>
            <span className="font-mono font-bold text-on-surface">Vinc. Constitucional</span>
          </div>
          <div className="flex justify-between p-2 bg-surface-container-low rounded-lg font-medium">
            <span>Educação (Mínimo 25% CF)</span>
            <span className="font-mono font-bold text-on-surface">Vinc. Constitucional</span>
          </div>
          <div className="flex justify-between p-2 bg-surface-container-low rounded-lg font-medium">
            <span>Serviço da Dívida e Precatórios</span>
            <span className="font-mono font-bold text-on-surface">Contratos/Sentenças</span>
          </div>
        </div>
      </div>
    </div>
  );
}
