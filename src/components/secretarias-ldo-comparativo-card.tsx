"use client";

import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useLiveRefresh } from "@/lib/live-refresh";
import { currency, percent } from "@/lib/format";
import type { DashboardData } from "@/types/loa";

export interface ComparativoSecretariaItem {
  id: string;
  secretaria: string;
  valLoaVigente: number;
  valorReajuste: number;
  valorAditamento: number;
  valLoaProposta: number;
  valLdo: number;
  diferenca: number;
  percentual: number;
  situacao: "SUPERAVIT" | "DEFICIT" | "EQUILIBRIO";
}

type ColumnKey =
  | "secretaria"
  | "valLoaVigente"
  | "valorReajuste"
  | "valorAditamento"
  | "valLoaProposta"
  | "valLdo"
  | "diferenca"
  | "percentual";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  shortLabel: string;
  defaultVisible: boolean;
  align: "left" | "right" | "center";
}

const COLUMNS: ColumnDef[] = [
  { key: "secretaria", label: "Secretarias", shortLabel: "Secretaria", defaultVisible: true, align: "left" },
  { key: "valLoaVigente", label: "LOA Vigente", shortLabel: "Vigente", defaultVisible: false, align: "right" },
  { key: "valorReajuste", label: "Reajuste", shortLabel: "Reajuste", defaultVisible: false, align: "right" },
  { key: "valorAditamento", label: "Aditamento", shortLabel: "Aditamento", defaultVisible: false, align: "right" },
  {
    key: "valLoaProposta",
    label: "Valor LOA proposta (vigente + reajuste + aditamento)",
    shortLabel: "LOA Proposta",
    defaultVisible: true,
    align: "right",
  },
  { key: "valLdo", label: "Valor LDO", shortLabel: "LDO", defaultVisible: true, align: "right" },
  { key: "diferenca", label: "Diferença", shortLabel: "Diferença", defaultVisible: true, align: "right" },
  { key: "percentual", label: "% Variação", shortLabel: "% Var", defaultVisible: false, align: "center" },
];

export function SecretariasLdoComparativoCard({
  data,
  dataSource,
  selectedImportId,
}: {
  data?: DashboardData;
  dataSource?: "ficticio" | "real";
  selectedImportId?: string;
}) {
  const [items, setItems] = useState<ComparativoSecretariaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSituacao, setFilterSituacao] = useState<"TODAS" | "DEFICIT" | "SUPERAVIT">("TODAS");
  const [sortColumn, setSortColumn] = useState<ColumnKey>("valLoaProposta");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filtro de Colunas: visibilidade gerenciada
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    return Object.fromEntries(COLUMNS.map((col) => [col.key, col.defaultVisible])) as Record<ColumnKey, boolean>;
  });
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Fechar menu de colunas ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carregar dados comparativos. As atualizações em segundo plano (useLiveRefresh) não mostram o "Carregando".
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const requestIdRef = useRef(0);
  const loadComparativo = useCallback(async (silencioso = false) => {
    const requestId = ++requestIdRef.current;
    try {
      if (!silencioso) setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedImportId) {
        queryParams.set("importId", selectedImportId);
      }
      const url = `/api/orcamento/comparativo-secretarias${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (requestId === requestIdRef.current && json.items) {
          setItems(json.items);
          setAtualizadoEm(new Date());
        }
      }
    } catch (err) {
      console.warn("Falha ao carregar comparativo de secretarias:", err);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [selectedImportId]);

  useEffect(() => {
    loadComparativo();
  }, [dataSource, loadComparativo]);

  const refreshSilencioso = useCallback(() => { loadComparativo(true); }, [loadComparativo]);
  useLiveRefresh(refreshSilencioso);

  // Filtragem e ordenação
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Busca textual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => item.secretaria.toLowerCase().includes(term));
    }

    // Filtro por situação
    if (filterSituacao === "DEFICIT") {
      result = result.filter((item) => item.diferenca > 0);
    } else if (filterSituacao === "SUPERAVIT") {
      result = result.filter((item) => item.diferenca <= 0);
    }

    // Ordenação
    result.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB, "pt-BR")
          : valB.localeCompare(valA, "pt-BR");
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

    return result;
  }, [items, searchTerm, filterSituacao, sortColumn, sortDirection]);

  // Totais consolidados
  const totais = useMemo(() => {
    return filteredAndSortedItems.reduce(
      (acc, item) => ({
        valLoaVigente: acc.valLoaVigente + item.valLoaVigente,
        valorReajuste: acc.valorReajuste + item.valorReajuste,
        valLoaProposta: acc.valLoaProposta + item.valLoaProposta,
        valLdo: acc.valLdo + item.valLdo,
        diferenca: acc.diferenca + item.diferenca,
      }),
      { valLoaVigente: 0, valorReajuste: 0, valLoaProposta: 0, valLdo: 0, diferenca: 0 }
    );
  }, [filteredAndSortedItems]);

  const handleSort = (key: ColumnKey) => {
    if (sortColumn === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(key);
      setSortDirection("desc");
    }
  };

  const toggleColumnVisibility = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetColumns = () => {
    setVisibleColumns(
      Object.fromEntries(COLUMNS.map((col) => [col.key, col.defaultVisible])) as Record<ColumnKey, boolean>
    );
  };

  return (
    <section
      aria-labelledby="comparativo-secretarias-title"
      className="panel p-6 bg-surface border border-outline-variant/60 rounded-xl space-y-5 shadow-xs"
    >
      {/* Cabeçalho do Quadro */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">balance</span>
            <h3 id="comparativo-secretarias-title" className="text-xl font-headline font-bold text-on-surface">
              Quadro Comparativo LOA vs. LDO por Secretaria
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Confronto detalhado da dotação proposta para a LOA (vigente + reajustes) em relação ao teto e custo financeiro previsto na LDO.
          </p>
          {atualizadoEm && (
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400" aria-live="polite">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              Ao vivo · atualizado às {atualizadoEm.toLocaleTimeString("pt-BR")}
            </p>
          )}
        </div>

        {/* Badges de Resumo Global */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">LOA Proposta Total</span>
            <strong className="text-on-surface font-mono font-bold text-xs">{currency.format(totais.valLoaProposta)}</strong>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">LDO Total</span>
            <strong className="text-on-surface font-mono font-bold text-xs">{currency.format(totais.valLdo)}</strong>
          </div>

          <div
            className={`border px-3 py-1.5 rounded-lg text-xs ${
              totais.diferenca > 0
                ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
                : "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
            }`}
          >
            <span className="block text-[10px] uppercase font-bold">Diferença Geral</span>
            <strong className="font-mono font-bold text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">
                {totais.diferenca > 0 ? "arrow_upward" : "arrow_downward"}
              </span>
              {currency.format(totais.diferenca)}
            </strong>
          </div>
        </div>
      </div>

      {/* Barra de Ferramentas: Busca + Situação + Popover de Filtro de Colunas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Busca por Secretaria */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar secretaria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary placeholder:text-on-surface-variant/60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-xs text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Situação */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterSituacao("TODAS")}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                filterSituacao === "TODAS"
                  ? "bg-primary text-on-primary font-bold shadow-2xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Todas ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSituacao("DEFICIT")}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                filterSituacao === "DEFICIT"
                  ? "bg-rose-700 text-white font-bold shadow-2xs"
                  : "bg-surface-container-low text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              }`}
            >
              Acima da LDO ({items.filter((i) => i.diferenca > 0).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSituacao("SUPERAVIT")}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                filterSituacao === "SUPERAVIT"
                  ? "bg-emerald-700 text-white font-bold shadow-2xs"
                  : "bg-surface-container-low text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              Abaixo da LDO ({items.filter((i) => i.diferenca <= 0).length})
            </button>
          </div>
        </div>

        {/* Popover de Filtro de Colunas */}
        <div className="relative" ref={columnMenuRef}>
          <button
            type="button"
            onClick={() => setIsColumnMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors shadow-2xs"
            aria-expanded={isColumnMenuOpen}
          >
            <span className="material-symbols-outlined text-sm text-primary">view_column</span>
            <span>Filtro de Colunas</span>
            <span className="material-symbols-outlined text-xs">
              {isColumnMenuOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {isColumnMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-surface border border-outline-variant rounded-xl shadow-xl p-3 z-30 space-y-2 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-xs font-bold text-on-surface">Colunas Visíveis</span>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Restaurar
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
                {COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-container-low cursor-pointer text-xs select-none"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumnVisibility(col.key)}
                      disabled={col.key === "secretaria"}
                      className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span className={visibleColumns[col.key] ? "font-semibold text-on-surface" : "text-on-surface-variant"}>
                      {col.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela do Quadro Comparativo */}
      <div className="overflow-x-auto border border-outline-variant/60 rounded-xl">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider font-semibold">
              {COLUMNS.filter((c) => visibleColumns[c.key]).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`p-3 cursor-pointer select-none transition-colors hover:bg-surface-container ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"
                    }`}
                  >
                    <span>{col.label}</span>
                    {sortColumn === col.key ? (
                      <span className="material-symbols-outlined text-xs text-primary font-bold">
                        {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-xs opacity-30">unfold_more</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/30 text-on-surface">
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.filter((c) => visibleColumns[c.key]).length} className="p-8 text-center text-on-surface-variant">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span>Carregando dados comparativos das secretarias...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.filter((c) => visibleColumns[c.key]).length} className="p-8 text-center text-on-surface-variant">
                  Nenhuma secretaria encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const isDeficit = item.diferenca > 0;
                const isSuperavit = item.diferenca < 0;

                return (
                  <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                    {/* Secretarias */}
                    {visibleColumns.secretaria && (
                      <td className="p-3 font-semibold text-on-surface max-w-xs truncate" title={item.secretaria}>
                        {item.secretaria}
                      </td>
                    )}

                    {/* LOA Vigente */}
                    {visibleColumns.valLoaVigente && (
                      <td className="p-3 text-right font-mono tabular-nums text-on-surface-variant">
                        {currency.format(item.valLoaVigente)}
                      </td>
                    )}

                    {/* Reajuste */}
                    {visibleColumns.valorReajuste && (
                      <td className="p-3 text-right font-mono tabular-nums text-on-surface-variant">
                        {item.valorReajuste !== 0 ? (
                          <span className={item.valorReajuste > 0 ? "text-amber-700 font-semibold" : "text-emerald-700"}>
                            {currency.format(item.valorReajuste)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}

                    {/* Valor LOA proposta (vigente+Reajuste) */}
                    {visibleColumns.valLoaProposta && (
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-on-surface">
                        {currency.format(item.valLoaProposta)}
                      </td>
                    )}

                    {/* Aditamento */}
                    {visibleColumns.valorAditamento && (
                      <td className="p-3 text-right font-mono tabular-nums text-on-surface-variant">
                        {item.valorAditamento !== 0 ? currency.format(item.valorAditamento) : "—"}
                      </td>
                    )}

                    {/* Valor LDO */}
                    {visibleColumns.valLdo && (
                      <td className="p-3 text-right font-mono tabular-nums font-semibold text-on-surface">
                        {currency.format(item.valLdo)}
                      </td>
                    )}

                    {/* Diferença */}
                    {visibleColumns.diferenca && (
                      <td className="p-3 text-right font-mono tabular-nums font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${
                            isDeficit
                              ? "bg-rose-100 text-rose-900 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200"
                              : isSuperavit
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isDeficit ? "trending_up" : isSuperavit ? "trending_down" : "drag_handle"}
                          </span>
                          {currency.format(item.diferenca)}
                        </span>
                      </td>
                    )}

                    {/* % Variação */}
                    {visibleColumns.percentual && (
                      <td className="p-3 text-center font-mono text-xs text-on-surface-variant">
                        {item.percentual.toFixed(1)}%
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Linha de Total Consolidado */}
          {!loading && filteredAndSortedItems.length > 0 && (
            <tfoot>
              <tr className="bg-surface-container font-bold border-t-2 border-outline-variant text-on-surface">
                {visibleColumns.secretaria && (
                  <td className="p-3 uppercase tracking-wide text-xs">
                    Total Consolidado ({filteredAndSortedItems.length} secretarias)
                  </td>
                )}
                {visibleColumns.valLoaVigente && (
                  <td className="p-3 text-right font-mono tabular-nums">
                    {currency.format(totais.valLoaVigente)}
                  </td>
                )}
                {visibleColumns.valorReajuste && (
                  <td className="p-3 text-right font-mono tabular-nums">
                    {currency.format(totais.valorReajuste)}
                  </td>
                )}
                {visibleColumns.valLoaProposta && (
                  <td className="p-3 text-right font-mono tabular-nums text-sm text-primary">
                    {currency.format(totais.valLoaProposta)}
                  </td>
                )}
                {visibleColumns.valLdo && (
                  <td className="p-3 text-right font-mono tabular-nums text-sm">
                    {currency.format(totais.valLdo)}
                  </td>
                )}
                {visibleColumns.diferenca && (
                  <td className="p-3 text-right font-mono tabular-nums text-sm">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full ${
                        totais.diferenca > 0
                          ? "bg-rose-100 text-rose-900 border border-rose-300 font-bold"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold"
                      }`}
                    >
                      {currency.format(totais.diferenca)}
                    </span>
                  </td>
                )}
                {visibleColumns.percentual && (
                  <td className="p-3 text-center font-mono text-xs">
                    {totais.valLdo > 0 ? ((totais.valLoaProposta / totais.valLdo) * 100).toFixed(1) + "%" : "—"}
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
