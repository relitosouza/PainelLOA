"use client";

import { useState, useEffect, useRef } from "react";

export interface CardConfigItem {
  id: string;
  label: string;
  category: "kpi_receita" | "kpi_despesa" | "section";
  visible: boolean;
  description?: string;
}

export interface AnaliseLoaLayoutConfig {
  sectionsOrder: string[]; // IDs das seções principais em ordem
  receitaKpisOrder: string[]; // IDs dos KPIs de receita em ordem
  despesaKpisOrder: string[]; // IDs dos KPIs de despesa em ordem
  visibility: Record<string, boolean>; // Mapa id -> boolean
}

export const DEFAULT_LAYOUT_CONFIG: AnaliseLoaLayoutConfig = {
  sectionsOrder: [
    "painel-receita",
    "painel-despesa",
    "filtros-avancados",
    "estrutura-hierarquica",
    "detalhamento-analitico",
    "subelementos-iniciativas",
    "banco-projetos",
  ],
  receitaKpisOrder: [
    "rec-ldo",
    "rec-loa",
    "rec-diff",
    "rec-exec",
    "rec-maior",
    "rec-fontes",
  ],
  despesaKpisOrder: [
    "desp-ldo",
    "desp-loa",
    "desp-diff",
    "desp-expectativa",
    "desp-exec",
    "desp-naturezas",
  ],
  visibility: {
    // Seções
    "painel-receita": true,
    "painel-despesa": true,
    "filtros-avancados": true,
    "estrutura-hierarquica": true,
    "detalhamento-analitico": true,
    "subelementos-iniciativas": true,
    "banco-projetos": true,
    // KPIs Receita
    "rec-ldo": true,
    "rec-loa": true,
    "rec-diff": true,
    "rec-exec": true,
    "rec-maior": true,
    "rec-fontes": true,
    // KPIs Despesa
    "desp-ldo": true,
    "desp-loa": true,
    "desp-diff": true,
    "desp-expectativa": true,
    "desp-exec": true,
    "desp-naturezas": true,
  },
};

export const SECTION_METADATA: Record<string, { label: string; icon: string; description: string }> = {
  "painel-receita": {
    label: "Painel da Receita Orçamentária",
    icon: "account_balance_wallet",
    description: "Camada de cards indicadores de Receita (LDO, LOA, Diferença, Fontes).",
  },
  "painel-despesa": {
    label: "Painel da Despesa Orçamentária",
    icon: "payments",
    description: "Camada de cards indicadores de Despesa (LDO, LOA, Diferença, Naturezas).",
  },
  "filtros-avancados": {
    label: "Filtros Avançados Orçamentários",
    icon: "tune",
    description: "Barra de busca e filtros combinados de Secretaria, Ação, Natureza, etc.",
  },
  "estrutura-hierarquica": {
    label: "Estrutura Hierárquica (Pivot)",
    icon: "account_tree",
    description: "Navegação em árvore da distribuição orçamentária por órgão/programa.",
  },
  "detalhamento-analitico": {
    label: "Detalhamento Analítico Editável",
    icon: "table_chart",
    description: "Tabela principal com edição em linha de valores da LOA e exportações.",
  },
  "subelementos-iniciativas": {
    label: "Sub-elementos & Iniciativas Estratégicas",
    icon: "stars",
    description: "Painéis lado a lado com detalhamento de subelementos e iniciativas PLDO.",
  },
  "banco-projetos": {
    label: "Banco de Projetos",
    icon: "folder_special",
    description: "Card com a lista de projetos e alocação na peça orçamentária.",
  },
};

export const KPI_METADATA: Record<string, { label: string; tag: string; description: string }> = {
  // Receita
  "rec-ldo": { label: "Valor Previsto LDO", tag: "Receita", description: "Receita Planejada na LDO" },
  "rec-loa": { label: "Valor Previsto LOA", tag: "Receita", description: "Receita Fixada na LOA" },
  "rec-diff": { label: "Diferença (LOA - LDO)", tag: "Receita", description: "Variação de Receita apurada" },
  "rec-exec": { label: "Execução Planejamento", tag: "Receita", description: "% Transformado em LOA" },
  "rec-maior": { label: "Maior Arrecadação LDO", tag: "Receita", description: "Principal fonte de arrecadação" },
  "rec-fontes": { label: "Total Fontes / Vínculos", tag: "Receita", description: "Contagem de fontes de recurso" },
  // Despesa
  "desp-ldo": { label: "Valor Previsto LDO", tag: "Despesa", description: "Despesa Planejada na LDO" },
  "desp-loa": { label: "Valor Previsto LOA", tag: "Despesa", description: "Despesa Fixada na LOA" },
  "desp-diff": { label: "Diferença (LOA - LDO)", tag: "Despesa", description: "Excesso ou Redução de despesa" },
  "desp-expectativa": { label: "Valor Expectativa LOA", tag: "Despesa", description: "Expectativa LOA Fixada" },
  "desp-exec": { label: "Execução Planejamento", tag: "Despesa", description: "% Executado da despesa" },
  "desp-naturezas": { label: "Total de Naturezas", tag: "Despesa", description: "Classificações econômicas" },
};

interface AnaliseLoaCardsConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnaliseLoaLayoutConfig;
  onSaveConfig: (newConfig: AnaliseLoaLayoutConfig) => void;
  onResetConfig: () => void;
}

export function AnaliseLoaCardsConfigDialog({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetConfig,
}: AnaliseLoaCardsConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<"sections" | "kpis">("sections");
  const [localConfig, setLocalConfig] = useState<AnaliseLoaLayoutConfig>(config);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled])")?.focus();
      });
    }
    return () => {
      triggerRef.current?.focus();
      triggerRef.current = null;
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  // Helpers para mover item na lista
  const moveItem = (list: string[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return list;
    const newList = [...list];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);
    return newList;
  };

  const toggleVisibility = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [id]: !prev.visibility[id],
      },
    }));
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_LAYOUT_CONFIG);
    onResetConfig();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cards-config-title"
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-2xl bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-primary">
            <span className="material-symbols-outlined text-2xl">dashboard_customize</span>
            <div>
              <h3 id="cards-config-title" className="text-base font-headline font-bold text-on-surface">
                Personalização de Layout & Cards
              </h3>
              <p className="text-xs text-on-surface-variant">
                Reordene ou oculte/remova seções e indicadores da Análise LOA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar diálogo de configuração"
            className="min-h-10 min-w-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant px-6 bg-surface-container/20">
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "sections"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">view_agenda</span>
            Seções Principais da Página ({localConfig.sectionsOrder.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kpis")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "kpis"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            Cards de Indicadores (KPIs) (12)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "sections" ? (
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-on-surface flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">info</span>
                <span>
                  Use as setas para alterar a <strong>ordem vertical</strong> em que as seções aparecem na tela, ou desmarque a caixa para <strong>ocultar</strong> a seção.
                </span>
              </div>

              <div className="space-y-2">
                {localConfig.sectionsOrder.map((sectionId, index) => {
                  const meta = SECTION_METADATA[sectionId] || {
                    label: sectionId,
                    icon: "widgets",
                    description: "",
                  };
                  const isVisible = localConfig.visibility[sectionId] !== false;

                  return (
                    <div
                      key={sectionId}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isVisible
                          ? "bg-surface border-outline-variant shadow-sm"
                          : "bg-surface-container/30 border-dashed border-outline-variant/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          id={`section-${sectionId}`}
                          checked={isVisible}
                          onChange={() => toggleVisibility(sectionId)}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0"
                        />
                        <div className="p-2 rounded-lg bg-surface-container text-primary shrink-0">
                          <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <label
                            htmlFor={`section-${sectionId}`}
                            className="text-xs font-bold text-on-surface cursor-pointer block truncate"
                          >
                            {meta.label}
                          </label>
                          <p className="text-[11px] text-on-surface-variant truncate">{meta.description}</p>
                        </div>
                      </div>

                      {/* Controles de ordenação */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              sectionsOrder: moveItem(prev.sectionsOrder, index, "up"),
                            }))
                          }
                          title="Mover para cima"
                          className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          disabled={index === localConfig.sectionsOrder.length - 1}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              sectionsOrder: moveItem(prev.sectionsOrder, index, "down"),
                            }))
                          }
                          title="Mover para baixo"
                          className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs de Receita */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                  Cards de Indicadores de Receita
                </h4>
                <div className="space-y-1.5">
                  {localConfig.receitaKpisOrder.map((kpiId, index) => {
                    const meta = KPI_METADATA[kpiId] || { label: kpiId, tag: "Receita", description: "" };
                    const isVisible = localConfig.visibility[kpiId] !== false;

                    return (
                      <div
                        key={kpiId}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isVisible
                            ? "bg-surface border-outline-variant shadow-sm"
                            : "bg-surface-container/30 border-dashed border-outline-variant/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            id={`kpi-${kpiId}`}
                            checked={isVisible}
                            onChange={() => toggleVisibility(kpiId)}
                            className="rounded border-outline-variant text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                          />
                          <div className="min-w-0">
                            <label
                              htmlFor={`kpi-${kpiId}`}
                              className="text-xs font-bold text-on-surface cursor-pointer block truncate"
                            >
                              {meta.label}
                            </label>
                            <p className="text-[10px] text-on-surface-variant truncate">{meta.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() =>
                              setLocalConfig((prev) => ({
                                ...prev,
                                receitaKpisOrder: moveItem(prev.receitaKpisOrder, index, "up"),
                              }))
                            }
                            title="Mover para a esquerda"
                            className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === localConfig.receitaKpisOrder.length - 1}
                            onClick={() =>
                              setLocalConfig((prev) => ({
                                ...prev,
                                receitaKpisOrder: moveItem(prev.receitaKpisOrder, index, "down"),
                              }))
                            }
                            title="Mover para a direita"
                            className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_downward</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KPIs de Despesa */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Cards de Indicadores de Despesa
                </h4>
                <div className="space-y-1.5">
                  {localConfig.despesaKpisOrder.map((kpiId, index) => {
                    const meta = KPI_METADATA[kpiId] || { label: kpiId, tag: "Despesa", description: "" };
                    const isVisible = localConfig.visibility[kpiId] !== false;

                    return (
                      <div
                        key={kpiId}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isVisible
                            ? "bg-surface border-outline-variant shadow-sm"
                            : "bg-surface-container/30 border-dashed border-outline-variant/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            id={`kpi-${kpiId}`}
                            checked={isVisible}
                            onChange={() => toggleVisibility(kpiId)}
                            className="rounded border-outline-variant text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                          />
                          <div className="min-w-0">
                            <label
                              htmlFor={`kpi-${kpiId}`}
                              className="text-xs font-bold text-on-surface cursor-pointer block truncate"
                            >
                              {meta.label}
                            </label>
                            <p className="text-[10px] text-on-surface-variant truncate">{meta.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() =>
                              setLocalConfig((prev) => ({
                                ...prev,
                                despesaKpisOrder: moveItem(prev.despesaKpisOrder, index, "up"),
                              }))
                            }
                            title="Mover para a esquerda"
                            className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            disabled={index === localConfig.despesaKpisOrder.length - 1}
                            onClick={() =>
                              setLocalConfig((prev) => ({
                                ...prev,
                                despesaKpisOrder: moveItem(prev.despesaKpisOrder, index, "down"),
                              }))
                            }
                            title="Mover para a direita"
                            className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_downward</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 px-6 py-4 border-t border-outline-variant bg-surface-container/50 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-11 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Restaurar Padrão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2 text-xs font-semibold rounded-xl bg-surface border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-11 px-5 py-2 text-xs font-bold rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">check</span>
              Aplicar Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
