"use client";

import { useState } from "react";
import { FIELDS, type FieldKey } from "@/types/loa";

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

export type FilterState = Record<FieldKey, string[]> & { min: string; max: string; search: string };
export const EMPTY_FILTERS: FilterState = Object.assign(Object.fromEntries(FIELDS.map((field) => [field, []])), { min: "", max: "", search: "" }) as unknown as FilterState;

function MultiSelect({ field, options, selected, onChange }: { field: FieldKey; options: string[]; selected: string[]; onChange(values: string[]): void }) {
  const [search, setSearch] = useState("");
  const visible = search ? options.filter((option) => option.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) : options;
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  return (
    <div className="filter-field">
      <span className="filter-label">{FIELD_LABELS[field]}</span>
      <details className="filter-select">
        <summary><span>{selected.length ? `${selected.length} selecionado${selected.length > 1 ? "s" : ""}` : "Todos"}</span><span aria-hidden="true">⌄</span></summary>
        <div className="select-menu">
          <input className="select-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${FIELD_LABELS[field].toLowerCase()}...`} aria-label={`Buscar ${FIELD_LABELS[field]}`} />
          <div className="select-options">
            {visible.length ? visible.map((option) => <label className="select-option" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} /><span>{option}</span></label>) : <div className="select-option">Nenhuma opção encontrada</div>}
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
    <section className="panel filters-panel" aria-labelledby="filters-title">
      <div className="panel-header"><div><h2 className="panel-title" id="filters-title">Filtros da análise</h2><p className="panel-caption">As seleções atualizam todo o painel automaticamente</p></div><button className="button ghost" onClick={() => setAdvanced((value) => !value)}>{advanced ? "Menos filtros" : "Mais filtros"}</button></div>
      <div className="filter-grid">
        {fields.map((field) => <MultiSelect key={field} field={field} options={options[field] ?? []} selected={filters[field]} onChange={(values) => onChange({ ...filters, [field]: values })} />)}
        {advanced && <div className="filter-field"><label>Faixa de valor</label><div className="range"><input className="input" inputMode="decimal" aria-label="Valor mínimo" placeholder="Mínimo" value={filters.min} onChange={(event) => onChange({ ...filters, min: event.target.value })} /><input className="input" inputMode="decimal" aria-label="Valor máximo" placeholder="Máximo" value={filters.max} onChange={(event) => onChange({ ...filters, max: event.target.value })} /></div></div>}
      </div>
      <div className="filter-footer"><div className="active-filters"><strong>{total.toLocaleString("pt-BR")}</strong> registros encontrados {activeCount > 0 && <span className="tag">{activeCount} filtro{activeCount > 1 ? "s" : ""} ativo{activeCount > 1 ? "s" : ""}</span>}</div><button className="button secondary" onClick={onClear} disabled={!activeCount}>Limpar filtros</button></div>
    </section>
  );
}

