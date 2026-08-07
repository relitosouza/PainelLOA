"use client";

import { useState } from "react";
import { FIELDS, type FieldKey } from "@/types/loa";
import { EMPTY_DASHBOARD_FILTERS, type DashboardFilterState } from "@/lib/dashboard-data";

export const FIELD_LABELS: Record<FieldKey, string> = {
  organ: "Secretaria",
  budgetUnit: "Unidade Orçamentária",
  functionName: "Função",
  subfunction: "Subfunção",
  program: "Programa",
  action: "Ação",
  expenseNature: "Natureza da Despesa",
  subelement: "Subelemento",
  administrativeProcess: "Processo Administrativo",
};

export type FilterState = DashboardFilterState;
export const EMPTY_FILTERS: FilterState = EMPTY_DASHBOARD_FILTERS;

export function Filters({
  filters,
  options,
  total,
  onChange,
  onClear,
}: {
  filters: FilterState;
  options: Record<FieldKey, string[]>;
  total: number;
  onChange(filters: FilterState): void;
  onClear(): void;
}) {
  const [showRange, setShowRange] = useState(false);

  const activeCount =
    FIELDS.reduce((sum, field) => sum + (filters[field]?.length || 0), 0) +
    Number(Boolean(filters.min)) +
    Number(Boolean(filters.max)) +
    Number(Boolean(filters.search));

  const removeFilterItem = (field: FieldKey, value: string) => {
    onChange({
      ...filters,
      [field]: (filters[field] || []).filter((item) => item !== value),
    });
  };

  return (
    <section className="glass-card p-5 bg-surface border border-outline-variant space-y-4 rounded-xl shadow-sm" data-testid="filters-panel">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          <div>
            <h3 className="text-sm font-headline font-bold text-on-surface" id="filters-title" data-testid="filters-title">
              Filtros Avançados Orçamentários
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              As seleções atualizam o painel dinamicamente
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por código, ação, palavra-chave..."
              value={filters.search || ""}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-60"
              data-testid="filters-search"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onChange({ ...filters, search: "" })}
                className="absolute right-2 top-1.5 text-xs text-on-surface-variant hover:text-rose-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Faixa de Valor Toggle */}
          <button
            type="button"
            onClick={() => setShowRange((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              showRange || filters.min || filters.max
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "border-outline-variant text-on-surface-variant hover:bg-surface-container/50"
            }`}
            data-testid="filters-advanced-toggle"
          >
            {showRange ? "Ocultar Valores" : "Faixa de Valor"}
          </button>

          {/* Total Counter Badge */}
          <div className="text-xs text-on-surface-variant bg-surface-container/60 px-3 py-1.5 rounded-lg border border-outline-variant/60" data-testid="filters-status">
            <strong data-testid="filters-total">{total.toLocaleString("pt-BR")}</strong> registros
            {activeCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-primary text-on-primary font-bold rounded-full" data-testid="filters-active-count">
                {activeCount}
              </span>
            )}
          </div>

          {/* Limpar Filtros Button */}
          <button
            type="button"
            onClick={onClear}
            disabled={!activeCount}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              activeCount
                ? "text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                : "text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
            }`}
            data-testid="filters-clear"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Faixa de valor (se ativada) */}
      {showRange && (
        <div className="flex items-center gap-3 pt-1 pb-2 border-t border-outline-variant/40">
          <span className="text-xs font-bold text-on-surface-variant">Valores (R$):</span>
          <input
            className="px-3 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface w-36"
            id="filters-min"
            name="min"
            inputMode="decimal"
            placeholder="Mínimo"
            value={filters.min || ""}
            onChange={(e) => onChange({ ...filters, min: e.target.value })}
            data-testid="filters-min"
          />
          <span className="text-xs text-on-surface-variant">até</span>
          <input
            className="px-3 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface w-36"
            id="filters-max"
            name="max"
            inputMode="decimal"
            placeholder="Máximo"
            value={filters.max || ""}
            onChange={(e) => onChange({ ...filters, max: e.target.value })}
            data-testid="filters-max"
          />
        </div>
      )}

      {/* Grade de Select Chips (idêntico à página Analise LOA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {FIELDS.map((field) => {
          const selected = filters[field] || [];
          const selectedCount = selected.length;
          const rawOptions = options[field] || [];
          // Filtrar números de 4 dígitos ou formato XX.YY das opções de Natureza/Subelemento se houver
          const filteredOpts = rawOptions
            .filter((opt) => {
              const trimmed = opt.trim();
              return !/^\d{4}$/.test(trimmed) && !/^\d{2}\.\d{2}$/.test(trimmed);
            })
            .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

          return (
            <div key={field} className="flex flex-col gap-1" data-testid={`filter-${field}-select`}>
              <label className="text-[11px] font-bold text-on-surface-variant flex items-center justify-between">
                <span>{FIELD_LABELS[field]}</span>
              </label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const alreadySelected = selected.includes(val);
                  const nextValues = alreadySelected
                    ? selected.filter((v) => v !== val)
                    : [...selected, val];
                  onChange({ ...filters, [field]: nextValues });
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  selectedCount
                    ? "bg-primary/5 border-primary font-bold text-primary cursor-pointer"
                    : "bg-surface border-outline-variant text-on-surface-variant cursor-pointer hover:bg-surface-container/50"
                }`}
                value=""
                data-testid={`filter-${field}-summary`}
              >
                <option value="">{selectedCount ? `${selectedCount} sel.` : "Todos"}</option>
                {filteredOpts.slice(0, 150).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Badges dos Filtros Ativos para fácil remoção rápida */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/40">
          <span className="text-[11px] font-bold text-on-surface-variant mr-1">Filtros ativos:</span>
          {FIELDS.flatMap((field) =>
            (filters[field] || []).map((val) => (
              <span
                key={`${field}-${val}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20"
              >
                <strong>{FIELD_LABELS[field]}:</strong> {val}
                <button
                  type="button"
                  onClick={() => removeFilterItem(field, val)}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                >
                  ×
                </button>
              </span>
            ))
          )}
          {filters.min && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <strong>Mínimo:</strong> R$ {filters.min}
              <button type="button" onClick={() => onChange({ ...filters, min: "" })} className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs">×</button>
            </span>
          )}
          {filters.max && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <strong>Máximo:</strong> R$ {filters.max}
              <button type="button" onClick={() => onChange({ ...filters, max: "" })} className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs">×</button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <strong>Busca:</strong> "{filters.search}"
              <button type="button" onClick={() => onChange({ ...filters, search: "" })} className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs">×</button>
            </span>
          )}
        </div>
      )}
    </section>
  );
}
