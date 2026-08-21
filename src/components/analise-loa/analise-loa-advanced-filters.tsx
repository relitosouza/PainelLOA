"use client";

import React, { useState } from "react";
import type { TechnicalFilterState } from "../analise-loa-view";

interface AnaliseLoaAdvancedFiltersProps {
  filters: TechnicalFilterState;
  setFilters: React.Dispatch<React.SetStateAction<TechnicalFilterState>>;
  initialFilters: TechnicalFilterState;
  filterOptions: Record<string, string[]>;
}

const LABELS_MAP: Record<string, string> = {
  secretaria: "Secretaria",
  unidade: "Unidade",
  programa: "Programa",
  tipoAcao: "Tipo de Ação",
  acao: "Ação",
  natureza: "Natureza",
  fonteVinculo: "Fonte / Vínculo",
  categoriaEconomica: "Cat. Despesa",
  grupoNatureza: "Grupo Despesa",
  elemento: "Mod. Aplicação",
  subelemento: "Subelemento",
  processo: "Processo",
};

export const AnaliseLoaAdvancedFilters = React.memo(function AnaliseLoaAdvancedFilters({
  filters,
  setFilters,
  initialFilters,
  filterOptions,
}: AnaliseLoaAdvancedFiltersProps) {
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState<Record<string, string>>({});

  const filterKeys = (Object.keys(filterOptions) as Array<keyof typeof filterOptions>).filter(
    (key) => key !== "orgao"
  );

  const activeFilterCount =
    filterKeys.reduce((sum, k) => sum + (filters[k as keyof TechnicalFilterState]?.length || 0), 0) +
    Number(Boolean(filters.search));

  return (
    <section className="glass-card p-5 bg-surface border border-outline-variant space-y-4 rounded-2xl shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h3 className="text-sm font-headline font-bold text-on-surface">Filtros Avançados Orçamentários</h3>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por código, ação, palavra-chave..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-64"
          />
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Grade de Filtros Popover Multi-Select */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filterKeys.map((key) => {
          const fieldLabel = LABELS_MAP[key] || key;
          const selectedValues = (filters[key as keyof TechnicalFilterState] || []) as string[];
          const selectedCount = selectedValues.length;
          const allOptions = filterOptions[key] || [];
          const searchQ = (filterSearchQuery[key] || "").toLowerCase();
          const visibleOptions = allOptions.filter((opt) => opt.toLowerCase().includes(searchQ));
          const isOpen = openFilterKey === key;

          return (
            <div key={key} className="relative flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant flex items-center justify-between">
                <span>{fieldLabel}</span>
                {selectedCount > 0 && (
                  <span className="text-[10px] text-primary font-extrabold">{selectedCount}</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setOpenFilterKey(isOpen ? null : key)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1 transition-colors w-full font-medium cursor-pointer ${
                  selectedCount
                    ? "bg-primary/10 border-primary font-bold text-primary"
                    : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container/60"
                }`}
              >
                <span className="truncate">
                  {selectedCount === 0
                    ? "Todos"
                    : selectedCount === 1
                    ? selectedValues[0]
                    : `${selectedCount} sel.`}
                </span>
                <span className="material-symbols-outlined text-xs shrink-0">
                  {isOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setOpenFilterKey(null)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-64 max-w-xs bg-surface rounded-xl shadow-2xl border border-outline-variant p-2.5 z-40 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
                      <span className="text-[11px] font-bold text-on-surface">Filtrar {fieldLabel}</span>
                      {selectedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilters((prev) => ({ ...prev, [key]: [] }));
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder={`Buscar ${fieldLabel.toLowerCase()}...`}
                      value={filterSearchQuery[key] || ""}
                      onChange={(e) =>
                        setFilterSearchQuery((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-full px-2 py-1 text-xs rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                      {visibleOptions.length === 0 ? (
                        <p className="text-[11px] text-on-surface-variant p-2 text-center">Nenhuma opção encontrada</p>
                      ) : (
                        visibleOptions.map((opt) => {
                          const isChecked = selectedValues.includes(opt);
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "hover:bg-surface-container/60 text-on-surface"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFilters((prev) => {
                                    const current = (prev[key as keyof TechnicalFilterState] || []) as string[];
                                    return {
                                      ...prev,
                                      [key]: isChecked
                                        ? current.filter((v) => v !== opt)
                                        : [...current, opt],
                                    };
                                  });
                                }}
                                className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span className="truncate min-w-0" title={opt}>{opt}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Badges de Filtros Ativos */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/40">
          <span className="text-[11px] font-bold text-on-surface-variant mr-1">Filtros ativos:</span>
          {filterKeys.flatMap((k) =>
            ((filters[k as keyof TechnicalFilterState] || []) as string[]).map((val) => (
              <span
                key={`${k}-${val}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20"
              >
                <strong>{LABELS_MAP[k] || k}:</strong> {val}
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      [k]: (prev[k as keyof TechnicalFilterState] as string[]).filter((v) => v !== val),
                    }));
                  }}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                >
                  ×
                </button>
              </span>
            ))
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <strong>Busca:</strong> &ldquo;{filters.search}&rdquo;
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </section>
  );
});
