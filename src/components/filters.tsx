"use client";

import { useState } from "react";
import { FIELDS, type FieldKey } from "@/types/loa";
import { EMPTY_DASHBOARD_FILTERS, type DashboardFilterState } from "@/lib/dashboard-data";

export const FIELD_LABELS: Record<FieldKey, string> = {
  organ: "Órgão",
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

function MultiSelect({ field, options, selected, onChange }: { field: FieldKey; options: string[]; selected: string[]; onChange(values: string[]): void }) {
  const [search, setSearch] = useState("");
  const fieldId = `filter-${field}`;
  const visible = search ? options.filter((option) => option.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) : options;
  const toggle = (value: string) => {
    const alreadySelected = selected.includes(value);
    onChange(alreadySelected ? selected.filter((item) => item !== value) : [...selected, value]);
    if (!alreadySelected) setSearch("");
  };
  const visibleSelected = selected.slice(0, 2);
  const hiddenSelectedCount = Math.max(0, selected.length - visibleSelected.length);
  const removeSelected = (value: string) => onChange(selected.filter((item) => item !== value));
  return (
    <div className="filter-field">
      <span className="filter-label" id={`${fieldId}-label`}>{FIELD_LABELS[field]}</span>
      <details className="filter-select" data-testid={`${fieldId}-select`}>
        <summary aria-labelledby={`${fieldId}-label`} aria-describedby={selected.length ? `${fieldId}-selected-summary` : undefined} data-testid={`${fieldId}-summary`}>
          <span>{selected.length ? `${selected.length} selecionado${selected.length > 1 ? "s" : ""}` : "Todos"}</span><span aria-hidden="true">⌄</span>
        </summary>
        <div className="select-menu">
          {selected.length > 0 && (
            <div className="selected-preview" id={`${fieldId}-selected-summary`} data-testid={`${fieldId}-selected-preview`}>
              {visibleSelected.map((item, index) => (
                <button
                  type="button"
                  className="selected-chip"
                  key={item}
                  title={`Remover ${item}`}
                  onClick={() => removeSelected(item)}
                  data-testid={`${fieldId}-selected-chip-${index}`}
                >
                  <span className="selected-chip-label">{item}</span>
                  <span aria-hidden="true" className="selected-chip-remove">×</span>
                </button>
              ))}
              {hiddenSelectedCount > 0 && <span className="selected-chip selected-chip-more">+{hiddenSelectedCount}</span>}
            </div>
          )}
          <input
            className="select-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Buscar ${FIELD_LABELS[field].toLowerCase()}…`}
            aria-label={`Buscar ${FIELD_LABELS[field]}`}
            aria-controls={`${fieldId}-options`}
            autoComplete="off"
            name={`${field}-search`}
            data-testid={`${fieldId}-search`}
          />
          <div className="select-options" id={`${fieldId}-options`} data-testid={`${fieldId}-options`}>
            {visible.length ? visible.map((option, index) => (
              <label className="select-option" key={option} data-testid={`${fieldId}-option-${index}`}>
                <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
                <span>{option}</span>
              </label>
            )) : <div className="select-option" role="status">Nenhuma opção encontrada</div>}
          </div>
        </div>
      </details>
    </div>
  );
}

export function Filters({ filters, options, total, onChange, onClear }: { filters: FilterState; options: Record<FieldKey, string[]>; total: number; onChange(filters: FilterState): void; onClear(): void }) {
  const [advanced, setAdvanced] = useState(false);
  const activeCount = FIELDS.reduce((sum, field) => sum + filters[field].length, 0) + Number(Boolean(filters.min)) + Number(Boolean(filters.max));
  const fields = advanced ? FIELDS : FIELDS.slice(0, 4);
  return (
    <section className="panel filters-panel" aria-labelledby="filters-title" data-testid="filters-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" id="filters-title">Filtros da análise</h2>
          <p className="panel-caption">As seleções atualizam todo o painel automaticamente</p>
        </div>
        <button className="button ghost" type="button" onClick={() => setAdvanced((value) => !value)} aria-expanded={advanced} data-testid="filters-advanced-toggle">
          {advanced ? "Menos filtros" : "Mais filtros"}
        </button>
      </div>
      <div className="filter-grid">
        {fields.map((field) => <MultiSelect key={field} field={field} options={options[field] ?? []} selected={filters[field]} onChange={(values) => onChange({ ...filters, [field]: values })} />)}
        {advanced && (
          <div className="filter-field">
            <label htmlFor="filters-min">Faixa de valor</label>
            <div className="range">
              <input className="input" id="filters-min" name="min" inputMode="decimal" aria-label="Valor mínimo" placeholder="Mínimo" value={filters.min} onChange={(event) => onChange({ ...filters, min: event.target.value })} data-testid="filters-min" />
              <input className="input" id="filters-max" name="max" inputMode="decimal" aria-label="Valor máximo" placeholder="Máximo" value={filters.max} onChange={(event) => onChange({ ...filters, max: event.target.value })} data-testid="filters-max" />
            </div>
          </div>
        )}
      </div>
      <div className="filter-footer">
        <div className="active-filters" role="status" aria-live="polite" data-testid="filters-status">
          <strong data-testid="filters-total">{total.toLocaleString("pt-BR")}</strong> registros encontrados {activeCount > 0 && <span className="tag" data-testid="filters-active-count">{activeCount} filtro{activeCount > 1 ? "s" : ""} ativo{activeCount > 1 ? "s" : ""}</span>}
        </div>
        <button className="button secondary" type="button" onClick={onClear} disabled={!activeCount} data-testid="filters-clear">
          Limpar filtros
        </button>
      </div>
    </section>
  );
}
