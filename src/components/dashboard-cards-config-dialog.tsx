"use client";

import { useState, useEffect, useRef } from "react";

export interface AnalyticDashboardLayoutConfig {
  sectionsOrder: string[];
  topCardsOrder: string[];
  visibility: Record<string, boolean>;
}

export const DEFAULT_ANALYTIC_DASHBOARD_LAYOUT_CONFIG: AnalyticDashboardLayoutConfig = {
  sectionsOrder: [
    "top-kpis",
    "analises-combinadas",
    "filtros",
    "classificacao-despesa",
    "menu-secretarias",
    "composicao-analise",
    "pergunte-orcamento",
    "fluxo-recursos",
    "despesa-habitante",
    "destaques-finais",
  ],
  topCardsOrder: [
    "card-ldo",
    "card-loa",
    "card-correntes",
    "card-investimentos",
    "card-conformidade",
  ],
  visibility: {
    // Seções
    "top-kpis": true,
    "analises-combinadas": true,
    "filtros": true,
    "classificacao-despesa": true,
    "menu-secretarias": true,
    "composicao-analise": true,
    "pergunte-orcamento": true,
    "fluxo-recursos": true,
    "despesa-habitante": true,
    "destaques-finais": true,
    // Top Cards
    "card-ldo": true,
    "card-loa": true,
    "card-correntes": true,
    "card-investimentos": true,
    "card-conformidade": true,
  },
};

export const ANALYTIC_SECTIONS_METADATA: Record<string, { label: string; icon: string; description: string }> = {
  "top-kpis": {
    label: "Cards Principais de Despesa e Conformidade",
    icon: "grid_view",
    description: "Visão rápida com Despesa LDO, Despesa LOA, Correntes, Investimentos e Conformidade.",
  },
  "analises-combinadas": {
    label: "Análises Combinadas & Alertas",
    icon: "insights",
    description: "Comparativo entre receitas, despesas, equilíbrio fiscal e alertas automáticos.",
  },
  "filtros": {
    label: "Filtros Orçamentários",
    icon: "tune",
    description: "Seleção por órgão, unidade, função, subfunção, programa, ação e vínculos.",
  },
  "classificacao-despesa": {
    label: "Classificação da Despesa (Gráficos)",
    icon: "bar_chart",
    description: "Gráficos de categoria, grupo, modalidade, econômica e subelementos.",
  },
  "menu-secretarias": {
    label: "Estrutura por Secretarias & Órgãos",
    icon: "account_balance",
    description: "Navegação e detalhamento dos valores distribuídos por secretaria.",
  },
  "composicao-analise": {
    label: "Composição Econômica & Estrutura de Despesa",
    icon: "pie_chart",
    description: "Detalhamento por categorias, per capita, estrutura e rankings setoriais.",
  },
  "pergunte-orcamento": {
    label: "Assistente Inteligente (Pergunte ao Orçamento)",
    icon: "help_outline",
    description: "Perguntas rápidas inteligentes e consulta em linguagem natural.",
  },
  "fluxo-recursos": {
    label: "Fluxo de Aplicação de Recursos",
    icon: "sync_alt",
    description: "Diagrama de distribuição do valor importado para pessoal, custeio e investimentos.",
  },
  "despesa-habitante": {
    label: "Indicadores de Despesa por Habitante",
    icon: "people",
    description: "Tabela comparativa per capita por função orçamentária.",
  },
  "destaques-finais": {
    label: "Destaques Setoriais (Saúde, Educação, Infraestrutura)",
    icon: "featured_seasonal_and_gifts",
    description: "Cards inferiores com destaques das maiores carteiras de execução.",
  },
};

export const ANALYTIC_TOP_CARDS_METADATA: Record<string, { label: string; icon: string; description: string }> = {
  "card-ldo": {
    label: "Despesa LDO (2027)",
    icon: "gavel",
    description: "Valor total previsto e quantidade de registros da LDO.",
  },
  "card-loa": {
    label: "Despesa LOA (2027)",
    icon: "account_balance_wallet",
    description: "Valor total fixado na LOA e registros consolidados.",
  },
  "card-correntes": {
    label: "Despesas Correntes / Total",
    icon: "payments",
    description: "Valores alocados para pessoal e custeio operacional.",
  },
  "card-investimentos": {
    label: "Investimentos (LOA)",
    icon: "engineering",
    description: "Recursos destinados a obras e expansão patrimonial.",
  },
  "card-conformidade": {
    label: "Conformidade LOA",
    icon: "verified",
    description: "Percentual de cobertura e alertas de consistência cadastral.",
  },
};

interface DashboardCardsConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnalyticDashboardLayoutConfig;
  onSaveConfig: (newConfig: AnalyticDashboardLayoutConfig) => void;
  onResetConfig: () => void;
}

export function DashboardCardsConfigDialog({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetConfig,
}: DashboardCardsConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<"sections" | "topCards">("sections");
  const [localConfig, setLocalConfig] = useState<AnalyticDashboardLayoutConfig>(config);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

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
        [id]: prev.visibility[id] === undefined ? false : !prev.visibility[id],
      },
    }));
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_ANALYTIC_DASHBOARD_LAYOUT_CONFIG);
    onResetConfig();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-cards-config-title"
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
              <h3 id="dashboard-cards-config-title" className="text-base font-headline font-bold text-on-surface">
                Personalização da Visão Analítica
              </h3>
              <p className="text-xs text-on-surface-variant">
                Reordene ou oculte seções e cards do painel principal
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

        {/* Tabs de Navegação */}
        <div className="px-6 border-b border-outline-variant flex gap-4 bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "sections"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">view_agenda</span>
            Seções do Painel ({localConfig.sectionsOrder.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topCards")}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "topCards"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            Cards Principais de Topo ({localConfig.topCardsOrder.length})
          </button>
        </div>

        {/* Body com Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "sections" ? (
            <div className="space-y-3">
              <p className="text-xs text-on-surface-variant mb-2">
                Marque para exibir/ocultar ou use as setas para alterar a ordem visual das seções na página:
              </p>
              <div className="space-y-2">
                {localConfig.sectionsOrder.map((sectionId, index) => {
                  const meta = ANALYTIC_SECTIONS_METADATA[sectionId] || {
                    label: sectionId,
                    icon: "view_agenda",
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
            <div className="space-y-3">
              <p className="text-xs text-on-surface-variant mb-2">
                Configure a visibilidade e ordem dos 5 indicadores principais no topo da página:
              </p>
              <div className="space-y-2">
                {localConfig.topCardsOrder.map((cardId, index) => {
                  const meta = ANALYTIC_TOP_CARDS_METADATA[cardId] || {
                    label: cardId,
                    icon: "bar_chart",
                    description: "",
                  };
                  const isVisible = localConfig.visibility[cardId] !== false;

                  return (
                    <div
                      key={cardId}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isVisible
                          ? "bg-surface border-outline-variant shadow-sm"
                          : "bg-surface-container/30 border-dashed border-outline-variant/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          id={`topcard-${cardId}`}
                          checked={isVisible}
                          onChange={() => toggleVisibility(cardId)}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0"
                        />
                        <div className="p-2 rounded-lg bg-surface-container text-primary shrink-0">
                          <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <label
                            htmlFor={`topcard-${cardId}`}
                            className="text-xs font-bold text-on-surface cursor-pointer block truncate"
                          >
                            {meta.label}
                          </label>
                          <p className="text-[11px] text-on-surface-variant truncate">{meta.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              topCardsOrder: moveItem(prev.topCardsOrder, index, "up"),
                            }))
                          }
                          title="Mover para a esquerda"
                          className="p-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          disabled={index === localConfig.topCardsOrder.length - 1}
                          onClick={() =>
                            setLocalConfig((prev) => ({
                              ...prev,
                              topCardsOrder: moveItem(prev.topCardsOrder, index, "down"),
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            Restaurar Padrão
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              Salvar Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
