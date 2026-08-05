"use client";

import { useMemo } from "react";
import { currency, integer, percent } from "@/lib/format";
import { EMPTY_FILTERS, type FilterState } from "./filters";
import type { DashboardData } from "@/types/loa";

export function SecretariasMenu({
  data,
  filters,
  onChange,
  totalVal,
}: {
  data: DashboardData;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalVal: number;
}) {
  const selectedOrgans = filters.organ;

  const handleSelect = (organ: string) => {
    if (selectedOrgans.includes(organ)) {
      onChange({ ...filters, organ: selectedOrgans.filter((item) => item !== organ) });
    } else {
      onChange({ ...filters, organ: [organ] });
    }
  };

  const handleClear = () => {
    onChange({ ...EMPTY_FILTERS, organ: [] });
  };

  const sortedOrgans = useMemo(() => {
    return [...data.groups.organ].sort((a, b) => b.value - a.value);
  }, [data.groups.organ]);

  const maxValue = sortedOrgans[0]?.value ?? 1;

  return (
    <section className="rounded-xl border border-outline-variant bg-surface overflow-hidden" aria-labelledby="secretariats-menu-title">
      <div className="border-b border-outline-variant px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="secretariats-menu-title" className="text-lg font-headline font-bold text-on-surface">Menu Secretarias</h3>
          <p className="text-sm text-on-surface-variant">Clique para filtrar o painel por orgao</p>
        </div>
        {selectedOrgans.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="self-start text-xs font-semibold text-tertiary hover:underline cursor-pointer"
          >
            Limpar selecao
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-container text-xs text-on-surface-variant">
            <tr>
              <th className="px-5 py-3 w-8"></th>
              <th className="px-5 py-3">Secretaria</th>
              <th className="px-5 py-3 text-right">Registros</th>
              <th className="px-5 py-3 text-right">Participacao</th>
              <th className="px-5 py-3 text-right">Valor previsto</th>
              <th className="px-5 py-3 text-center w-40">Distribuicao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {sortedOrgans.map((item) => {
              const isSelected = selectedOrgans.includes(item.label);
              const share = totalVal ? (item.value / totalVal) * 100 : 0;
              const barWidth = maxValue ? (item.value / maxValue) * 100 : 0;
              return (
                <tr
                  key={item.label}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-tertiary/5" : "hover:bg-surface-container-low"}`}
                  onClick={() => handleSelect(item.label)}
                >
                  <td className="px-5 py-3">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded border ${isSelected ? "border-tertiary bg-tertiary text-on-tertiary" : "border-outline-variant text-transparent"}`}>
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </span>
                  </td>
                  <td className={`px-5 py-3 font-medium ${isSelected ? "text-tertiary" : "text-on-surface"}`}>{item.label}</td>
                  <td className="px-5 py-3 text-right text-on-surface-variant">{integer.format(item.count)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{percent.format(share)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-on-surface">{currency.format(item.value)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isSelected ? "bg-tertiary" : "bg-tertiary/60"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface-variant w-10 text-right">{Math.round(barWidth)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
