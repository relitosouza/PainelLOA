"use client";

import { useState, useMemo } from "react";
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
  const [expandedOrgans, setExpandedOrgans] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const toggleExpand = (organ: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  };

  const handleSelect = (organ: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const visibleOrgans = useMemo(() => {
    if (showAll) return sortedOrgans;
    return sortedOrgans.slice(0, 5);
  }, [sortedOrgans, showAll]);

  const maxValue = sortedOrgans[0]?.value ?? 1;

  // Helper to compute secretariat details from data.records
  const getSecretariatDetails = (organName: string) => {
    if (!data.records || data.records.length === 0) return null;

    const organRecords = data.records.filter((r) => r.organ === organName);
    if (organRecords.length === 0) return null;

    // Group by Budget Unit
    const unitMap = new Map<string, { label: string; value: number; count: number }>();
    // Group by Action / Project
    const actionMap = new Map<string, { label: string; value: number; count: number }>();
    // Group by Subelement
    const subelementMap = new Map<string, { label: string; value: number; count: number }>();

    organRecords.forEach((r) => {
      // Unit
      if (r.budgetUnit) {
        const current = unitMap.get(r.budgetUnit) || { label: r.budgetUnit, value: 0, count: 0 };
        unitMap.set(r.budgetUnit, { label: r.budgetUnit, value: current.value + r.value, count: current.count + 1 });
      }
      // Action
      if (r.action) {
        const current = actionMap.get(r.action) || { label: r.action, value: 0, count: 0 };
        actionMap.set(r.action, { label: r.action, value: current.value + r.value, count: current.count + 1 });
      }
      // Subelement
      if (r.subelement) {
        const current = subelementMap.get(r.subelement) || { label: r.subelement, value: 0, count: 0 };
        subelementMap.set(r.subelement, { label: r.subelement, value: current.value + r.value, count: current.count + 1 });
      }
    });

    const units = Array.from(unitMap.values()).sort((a, b) => b.value - a.value);
    const actions = Array.from(actionMap.values()).sort((a, b) => b.value - a.value).slice(0, 5);
    const subelements = Array.from(subelementMap.values()).sort((a, b) => b.value - a.value).slice(0, 5);

    return { units, actions, subelements };
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-sm flex flex-col" aria-labelledby="secretariats-menu-title">
      {/* Header */}
      <div className="border-b border-outline-variant px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-surface-container-low">
        <div>
          <h3 id="secretariats-menu-title" className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">account_tree</span>
            Menu Secretarias
          </h3>
          <p className="text-xs text-on-surface-variant">
            Exibindo {visibleOrgans.length} de {sortedOrgans.length} secretarias. Clique para expandir os detalhes (accordion).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {expandedOrgans.length > 0 && (
            <button
              type="button"
              onClick={() => setExpandedOrgans([])}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Recolher todos
            </button>
          )}
          {selectedOrgans.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-tertiary hover:underline cursor-pointer bg-tertiary/10 px-2.5 py-1 rounded-md"
            >
              Limpar seleção ({selectedOrgans.length})
            </button>
          )}
        </div>
      </div>

      {/* Table Container with Max Height */}
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full min-w-[720px] text-left text-sm relative">
          <thead className="bg-surface-container text-xs text-on-surface-variant font-semibold sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="px-3 py-3 w-10 text-center"></th>
              <th className="px-3 py-3 w-10 text-center"></th>
              <th className="px-5 py-3">Secretaria</th>
              <th className="px-5 py-3 text-right">Registros</th>
              <th className="px-5 py-3 text-right">Participação</th>
              <th className="px-5 py-3 text-right">Valor previsto</th>
              <th className="px-5 py-3 text-center w-40">Distribuição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {visibleOrgans.map((item) => {
              const isSelected = selectedOrgans.includes(item.label);
              const isExpanded = expandedOrgans.includes(item.label);
              const share = totalVal ? (item.value / totalVal) * 100 : 0;
              const barWidth = maxValue ? (item.value / maxValue) * 100 : 0;
              const details = isExpanded ? getSecretariatDetails(item.label) : null;

              return (
                <tr key={item.label} className="group">
                  <td colSpan={7} className="p-0">
                    <div
                      className={`flex items-center w-full transition-colors cursor-pointer ${
                        isSelected ? "bg-tertiary/10 font-semibold" : isExpanded ? "bg-surface-container-low" : "hover:bg-surface-container-low"
                      }`}
                      onClick={() => toggleExpand(item.label)}
                    >
                      {/* Expand Chevron Icon */}
                      <div className="px-3 py-3 w-10 text-center flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(item.label, e)}
                          className="w-7 h-7 rounded-full hover:bg-surface-variant/50 flex items-center justify-center text-on-surface-variant transition-transform"
                          title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                        >
                          <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                            expand_more
                          </span>
                        </button>
                      </div>

                      {/* Filter Checkbox */}
                      <div className="px-3 py-3 w-10 text-center flex items-center justify-center" onClick={(e) => handleSelect(item.label, e)}>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            isSelected ? "border-tertiary bg-tertiary text-on-tertiary" : "border-outline-variant text-transparent hover:border-tertiary/60"
                          }`}
                          title="Filtrar painel por esta secretaria"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </span>
                      </div>

                      {/* Secretaria Name */}
                      <div className={`px-5 py-3 flex-1 font-medium ${isSelected ? "text-tertiary font-bold" : "text-on-surface"}`}>
                        {item.label}
                      </div>

                      {/* Registros */}
                      <div className="px-5 py-3 text-right text-on-surface-variant w-28">
                        {integer.format(item.count)}
                      </div>

                      {/* Participacao */}
                      <div className="px-5 py-3 text-right font-semibold w-32 text-on-surface">
                        {percent.format(share)}
                      </div>

                      {/* Valor previsto */}
                      <div className="px-5 py-3 text-right font-semibold text-on-surface w-44">
                        {currency.format(item.value)}
                      </div>

                      {/* Distribuicao Bar */}
                      <div className="px-5 py-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isSelected ? "bg-tertiary" : "bg-tertiary/60"}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-on-surface-variant w-10 text-right">{Math.round(barWidth)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Accordion Expanded Panel */}
                    {isExpanded && (
                      <div className="bg-surface-container-lowest border-t border-b border-outline-variant/40 px-8 py-5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/30">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-sm">info</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              Detalhamento Orçamentário da Secretaria
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleSelect(item.label, e)}
                            className="text-xs font-semibold text-tertiary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">filter_list</span>
                            {isSelected ? "Remover filtro desta secretaria" : "Filtrar painel completo por esta secretaria"}
                          </button>
                        </div>

                        {details ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Unidades Orçamentárias */}
                            <div className="bg-surface rounded-lg p-4 border border-outline-variant/40 shadow-2xs">
                              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-tertiary">corporate_fare</span>
                                Unidades Orçamentárias ({details.units.length})
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {details.units.map((unit) => (
                                  <div key={unit.label} className="text-xs p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1">
                                    <span className="font-medium text-on-surface line-clamp-1" title={unit.label}>{unit.label}</span>
                                    <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                                      <span>{unit.count} registros</span>
                                      <span className="font-semibold text-on-surface">{currency.format(unit.value)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Principais Ações / Projetos */}
                            <div className="bg-surface rounded-lg p-4 border border-outline-variant/40 shadow-2xs">
                              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-tertiary">assignment</span>
                                Principais Ações / Projetos
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {details.actions.length > 0 ? (
                                  details.actions.map((act) => (
                                    <div key={act.label} className="text-xs p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1">
                                      <span className="font-medium text-on-surface line-clamp-1" title={act.label}>{act.label}</span>
                                      <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                                        <span>{act.count} despesas</span>
                                        <span className="font-semibold text-on-surface">{currency.format(act.value)}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-on-surface-variant italic">Nenhuma ação registrada</p>
                                )}
                              </div>
                            </div>

                            {/* Subelementos de Despesa */}
                            <div className="bg-surface rounded-lg p-4 border border-outline-variant/40 shadow-2xs">
                              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-tertiary">receipt_long</span>
                                Principais Subelementos
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {details.subelements.length > 0 ? (
                                  details.subelements.map((sub) => (
                                    <div key={sub.label} className="text-xs p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1">
                                      <span className="font-medium text-on-surface line-clamp-1" title={sub.label}>{sub.label}</span>
                                      <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                                        <span>{sub.count} itens</span>
                                        <span className="font-semibold text-on-surface">{currency.format(sub.value)}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-on-surface-variant italic">Nenhum subelemento registrado</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-xs text-on-surface-variant bg-surface rounded-lg">
                            Visão resumida da secretaria: <strong>{item.label}</strong> com <strong>{integer.format(item.count)}</strong> registros e orçamento previsto de <strong>{currency.format(item.value)}</strong> ({percent.format(share)} da LOA).
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Toggle Button */}
      {sortedOrgans.length > 5 && (
        <div className="border-t border-outline-variant px-5 py-3 bg-surface-container-lowest text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-tertiary hover:text-tertiary/80 transition-colors cursor-pointer bg-tertiary/5 px-4 py-2 rounded-lg border border-tertiary/20"
          >
            <span className="material-symbols-outlined text-base">
              {showAll ? "unfold_less" : "unfold_more"}
            </span>
            {showAll
              ? "Mostrar menos (exibir apenas as 5 principais secretarias)"
              : `Ver todas as ${sortedOrgans.length} secretarias`}
          </button>
        </div>
      )}
    </section>
  );
}


