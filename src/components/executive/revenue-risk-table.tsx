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

export function RevenueRiskTable({
  totalLoa,
}: {
  totalLoa: number;
}) {
  const items = useMemo(() => {
    const total = totalLoa > 0 ? totalLoa : 6_500_000_000;
    return [
      {
        name: "ICMS — Cota-Parte Estadual",
        risk: "Alto" as const,
        riskBadge: "bg-rose-50 text-rose-700 border-rose-200",
        riskIcon: "🔴",
        value: total * 0.197,
        share: 19.7,
        justification: "Sensibilidade à atividade industrial e arrecadação do Estado.",
      },
      {
        name: "FPM — Fundo de Participação dos Municípios",
        risk: "Médio" as const,
        riskBadge: "bg-amber-50 text-amber-700 border-amber-200",
        riskIcon: "🟡",
        value: total * 0.150,
        share: 15.0,
        justification: "Dependência de arrecadação do IPI/IR pela União.",
      },
      {
        name: "IPTU — Imposto Predial e Territorial",
        risk: "Baixo" as const,
        riskBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        riskIcon: "🟢",
        value: total * 0.069,
        share: 6.9,
        justification: "Receita própria direta com base cadastral consolidada.",
      },
      {
        name: "ISS — Imposto Sobre Serviços",
        risk: "Médio" as const,
        riskBadge: "bg-amber-50 text-amber-700 border-amber-200",
        riskIcon: "🟡",
        value: total * 0.058,
        share: 5.8,
        justification: "Impactado por alterações na legislação tributária nacional.",
      },
      {
        name: "Demais Receitas Correntes e Capital",
        risk: "Baixo" as const,
        riskBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        riskIcon: "🟢",
        value: total * 0.526,
        share: 52.6,
        justification: "FUNDEB, taxas de poder de polícia e transferências do SUS.",
      },
    ];
  }, [totalLoa]);

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Receitas em Risco</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Grau de vulnerabilidade fiscal por fonte de recurso</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-bold text-[11px] uppercase">
              <th className="pb-2.5">Receita</th>
              <th className="pb-2.5 text-center">Risco</th>
              <th className="pb-2.5 text-right font-mono">Valor (R$)</th>
              <th className="pb-2.5 text-right font-mono">% da LOA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {items.map((row) => (
              <tr key={row.name} className="hover:bg-surface-container-low/60 transition-colors group">
                <td className="py-2.5 pr-2 font-medium text-on-surface">
                  <span className="block font-semibold" title={row.justification}>{row.name}</span>
                  <span className="text-[10px] text-on-surface-variant font-normal block truncate max-w-[240px]">
                    {row.justification}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.riskBadge}`}>
                    {row.risk}
                  </span>
                </td>
                <td className="py-2.5 text-right font-mono font-bold text-on-surface">
                  {compactCurrency(row.value)}
                </td>
                <td className="py-2.5 text-right font-mono text-on-surface-variant font-medium">
                  {percent.format(row.share / 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-on-surface-variant">
        <span>Critério: Volatilidade histórica de transferências e arrecadação.</span>
        <span className="font-semibold text-rose-700">Alto Risco: {compactCurrency(items[0].value)}</span>
      </div>
    </div>
  );
}
