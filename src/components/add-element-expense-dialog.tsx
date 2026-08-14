"use client";

import { useEffect, useRef, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";

export type ExpenseElementOption = { code: string; label: string };

type Props = {
  actionLabel: string;
  natureLabel: string;
  search: string;
  setSearch: (value: string) => void;
  options: ExpenseElementOption[];
  selected: ExpenseElementOption | null;
  setSelected: Dispatch<SetStateAction<ExpenseElementOption | null>>;
  value: string;
  setValue: (value: string) => void;
  vinculo: string;
  setVinculo: (value: string) => void;
  processo: string;
  setProcesso: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  parseValue: (value: string) => number;
};

export function AddElementExpenseDialog({ actionLabel, natureLabel, search, setSearch, options, selected, setSelected, value, setValue, vinculo, setVinculo, processo, setProcesso, onClose, onConfirm, parseValue }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      triggerRef.current?.focus();
      triggerRef.current = null;
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const canConfirm = Boolean(selected && parseValue(value) > 0);

  return (
    <div
      className="fixed inset-0 z-[51] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-element-title"
      onKeyDown={onKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex max-h-[min(720px,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-outline-variant bg-surface shadow-2xl outline-none"
      >
        <div className="mx-5 mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-on-surface" aria-live="polite">
          <span className="font-semibold">Busca por código:</span> {search || "aguardando código"} · {options.length} resultado(s)
          {selected && <span className="ml-2 font-bold text-primary">Selecionado: {selected.code} — {selected.label}</span>}
        </div>
        <div className="flex items-start justify-between border-b border-outline-variant bg-surface-container/50 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Novo elemento de despesa</p>
            <h2 id="add-element-title" className="mt-1 text-lg font-bold text-on-surface">Adicionar Elemento de Despesa</h2>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{actionLabel} · {natureLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar adicionar elemento"
            className="min-h-10 min-w-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="space-y-4 p-5">
          <label className="block text-xs font-bold text-on-surface">
            Natureza de despesa *
            <input value={natureLabel} readOnly className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface-variant" />
          </label>
          <div role="group" aria-labelledby="element-search-label">
            <label id="element-search-label" className="block text-xs font-bold text-on-surface">Elemento de despesa *</label>
            <p className="mt-1 text-[11px] text-on-surface-variant">Digite somente o código do elemento para buscar (01, 02, 03...).</p>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => { setSearch(event.target.value.replace(/\D/g, "")); setSelected(null); }}
              inputMode="numeric"
              maxLength={2}
              placeholder="Ex.: 01"
              aria-describedby="element-search-help"
              className="mt-1 w-full rounded-lg border border-primary bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p id="element-search-help" className="mt-1 text-[11px] text-on-surface-variant" aria-live="polite">
              {search ? `${options.length} resultado(s) para o código ${search}.` : "Digite até dois dígitos para filtrar."}
            </p>
            <div role="listbox" aria-label="Elementos importados vinculados à Natureza" className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-outline-variant bg-surface">
              {options.length ? options.map((option) => {
                const isSelected = selected?.code === option.code && selected?.label === option.label;
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    key={`${option.code}-${option.label}`}
                    onClick={() => setSelected(option)}
                    className={`flex min-h-11 w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${isSelected ? "bg-primary/10 font-bold text-primary" : "text-on-surface"}`}
                  >
                    {option.code ? `${option.code} — ` : ""}{option.label}
                    {isSelected && <span className="ml-2 shrink-0 font-bold" aria-hidden="true">Selecionado</span>}
                  </button>
                );
              }) : <p className="p-3 text-xs text-on-surface-variant">Nenhum elemento importado vinculado a esta Natureza.</p>}
            </div>
          </div>
          <label className="block text-xs font-bold text-on-surface">
            Valor LOA *
            <input value={value} onChange={(event) => setValue(event.target.value.replace(/-/g, ""))} inputMode="decimal" placeholder="Ex.: 25.000,00" className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
          </label>
          <label className="block text-xs font-bold text-on-surface">
            Vínculo
            <select value={vinculo} onChange={(event) => setVinculo(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="">Tesouro / Próprio</option>
              <option value="01">01 — Tesouro</option>
              <option value="02">02 — Transferências</option>
              <option value="05">05 — Operações de crédito</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-on-surface">
            Processo
            <input value={processo} onChange={(event) => setProcesso(event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container/40 p-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={!canConfirm} className="min-h-11 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">Adicionar elemento</button>
        </div>
      </div>
    </div>
  );
}
