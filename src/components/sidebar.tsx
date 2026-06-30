"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FieldKey } from "@/types/loa";
import type { FilterState } from "./filters";
import { getPrimaryPageLinks } from "@/lib/page-navigation";

export function Sidebar({
  view,
  filters,
  setFilters,
  options,
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
}: {
  view: string;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  options: Record<string, string[]>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  // Local state for text and number inputs to avoid layout latency
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localMin, setLocalMin] = useState(filters.min);
  const [localMax, setLocalMax] = useState(filters.max);

  // Synchronize local states if filters are cleared/changed from outside
  useEffect(() => {
    setLocalSearch(filters.search);
    setLocalMin(filters.min);
    setLocalMax(filters.max);
  }, [filters.search, filters.min, filters.max]);

  const updateSelectFilter = (field: FieldKey, value: string) => {
    setFilters({
      ...filters,
      [field]: value ? [value] : [],
    });
  };

  const applyFilters = () => {
    setFilters({
      ...filters,
      search: localSearch,
      min: localMin,
      max: localMax,
    });
  };

  const clearFilters = () => {
    setFilters({
      organ: [],
      budgetUnit: [],
      functionName: [],
      subfunction: [],
      program: [],
      action: [],
      expenseNature: [],
      subelement: [],
      administrativeProcess: [],
      min: "",
      max: "",
      search: "",
    });
    setLocalSearch("");
    setLocalMin("");
    setLocalMax("");
  };

  const primaryLinks = getPrimaryPageLinks(view);

  return (
    <aside
      className={`loa-sidebar fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-primary-container text-on-primary-container shrink-0 w-[280px] h-screen transition-transform duration-300 md:translate-x-0 ${
        collapsed ? "collapsed" : ""
      } ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Navegação principal"
    >
      {/* Header */}
      <div className="brand p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-on-primary-container rounded-lg flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-primary-container text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-headline font-bold text-sm leading-tight text-on-primary-fixed whitespace-nowrap" aria-label="Gestão Orçamentária">
              Gestão Orçamentária
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <span className="material-symbols-outlined text-[20px]">{collapsed ? "menu_open" : "menu"}</span>
          </button>
          <button
            onClick={clearFilters}
            className="sidebar-action"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            <span className="sidebar-label">Limpar Filtros</span>
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {primaryLinks.map((link) => {
          const isActive = !["importacao", "relatorios", "configuracoes"].includes(view) && view === link.key;
          return (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
              >
                {link.icon}
              </span>
              <span className="sidebar-label">{link.label}</span>
            </Link>
          );
        })}
        <Link
          href="/importacao"
          onClick={() => setMobileOpen(false)}
          aria-current={view === "importacao" ? "page" : undefined}
          className={`nav-link ${view === "importacao" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">upload_file</span>
          <span className="sidebar-label">Importação da LOA</span>
        </Link>
        <Link
          href="/relatorios"
          onClick={() => setMobileOpen(false)}
          aria-current={view === "relatorios" ? "page" : undefined}
          className={`nav-link ${view === "relatorios" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">assessment</span>
          <span className="sidebar-label">Reports</span>
        </Link>

        {/* Filters Header (only show when Dashboard/Reports views are active and we have options) */}
        {(view === "dashboard" || view === "relatorios" || !["importacao", "configuracoes"].includes(view)) && (
          <>
            <div className="nav-section pt-6 pb-2 px-4">
              <p className="text-xs font-semibold text-on-primary-container/50 uppercase tracking-wider">
                Filtros
              </p>
            </div>

            <div className="nav-section px-4 space-y-4 pb-8">
              {/* Órgão */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Órgão</label>
                <select
                  value={filters.organ[0] || ""}
                  onChange={(e) => updateSelectFilter("organ", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todos os Órgãos</option>
                  {(options.organ ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidade */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Unidade</label>
                <select
                  value={filters.budgetUnit[0] || ""}
                  onChange={(e) => updateSelectFilter("budgetUnit", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todas as Unidades</option>
                  {(options.budgetUnit ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Função */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Função</label>
                <select
                  value={filters.functionName[0] || ""}
                  onChange={(e) => updateSelectFilter("functionName", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todas as Funções</option>
                  {(options.functionName ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subfunção */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Subfunção</label>
                <select
                  value={filters.subfunction[0] || ""}
                  onChange={(e) => updateSelectFilter("subfunction", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todas as Subfunções</option>
                  {(options.subfunction ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Programa */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Programa</label>
                <select
                  value={filters.program[0] || ""}
                  onChange={(e) => updateSelectFilter("program", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todos os Programas</option>
                  {(options.program ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ação */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Ação</label>
                <select
                  value={filters.action[0] || ""}
                  onChange={(e) => updateSelectFilter("action", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todas as Ações</option>
                  {(options.action ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Natureza da Despesa */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Natureza da Despesa</label>
                <select
                  value={filters.expenseNature[0] || ""}
                  onChange={(e) => updateSelectFilter("expenseNature", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todas as Naturezas</option>
                  {(options.expenseNature ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subelemento */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Subelemento</label>
                <select
                  value={filters.subelement[0] || ""}
                  onChange={(e) => updateSelectFilter("subelement", e.target.value)}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container appearance-none focus:outline-none focus:ring-1 focus:ring-secondary-fixed [&>option]:bg-neutral-800 [&>option]:text-white"
                >
                  <option value="">Todos os Subelementos</option>
                  {(options.subelement ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Processo (Busca de texto) */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Processo</label>
                <input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container placeholder:text-on-primary-container/30 focus:outline-none focus:ring-1 focus:ring-secondary-fixed"
                  placeholder="Número do Processo"
                  type="text"
                />
              </div>

              {/* Faixa de Valor */}
              <div className="space-y-1">
                <label className="text-xs text-on-primary-container/80 font-medium">Faixa de Valor</label>
                <div className="flex gap-2">
                  <input
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    className="w-1/2 bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container placeholder:text-on-primary-container/30 focus:outline-none focus:ring-1 focus:ring-secondary-fixed"
                    placeholder="Min"
                    type="number"
                  />
                  <input
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    className="w-1/2 bg-surface-container/10 border border-outline-variant/30 text-sm rounded-md py-1.5 px-2 text-on-primary-container placeholder:text-on-primary-container/30 focus:outline-none focus:ring-1 focus:ring-secondary-fixed"
                    placeholder="Max"
                    type="number"
                  />
                </div>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-surface/20 hover:bg-surface/30 text-xs py-2 rounded-md transition-colors mt-2 text-on-primary-container font-medium cursor-pointer border-0"
              >
                Aplicar Filtros
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Footer Links */}
      <div className="sidebar-footer p-4 border-t border-outline-variant/20 space-y-1">
        <Link
          href="/configuracoes"
          onClick={() => setMobileOpen(false)}
          aria-current={view === "configuracoes" ? "page" : undefined}
          className={`nav-link ${view === "configuracoes" ? "active" : ""}`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="sidebar-label">Configurações</span>
        </Link>
        <a
          className="nav-link cursor-pointer"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert("Suporte: Portal de Transparência LOA v1.0");
          }}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="sidebar-label">Help Center</span>
        </a>
      </div>
    </aside>
  );
}
