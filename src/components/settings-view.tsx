"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NAVIGATION_SECTIONS, NAVIGATION_SETTINGS_STORAGE_KEY, PRIMARY_PAGE_LINKS, type NavigationSection, type PrimaryPageKey } from "@/lib/page-navigation";
import { UserManagementSection } from "./user-management-section";

export function SettingsView() {
  const [savedEditCount, setSavedEditCount] = useState(0);
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "restored">("idle");
  const [navigationSections, setNavigationSections] = useState<NavigationSection[]>(DEFAULT_NAVIGATION_SECTIONS);
  const [navigationSaved, setNavigationSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("painel_loa_custom_edits_v1");
      const parsed = saved ? JSON.parse(saved) as Record<string, number> : {};
      setSavedEditCount(Object.keys(parsed).length);
    } catch {
      setSavedEditCount(0);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAVIGATION_SETTINGS_STORAGE_KEY);
      if (saved) setNavigationSections(JSON.parse(saved) as NavigationSection[]);
    } catch {
      setNavigationSections(DEFAULT_NAVIGATION_SECTIONS);
    }
  }, []);

  const pageByKey = new Map(PRIMARY_PAGE_LINKS.map((page) => [page.key, page]));
  const toggleNavigationPage = (sectionKey: NavigationSection["key"], pageKey: PrimaryPageKey) => {
    setNavigationSections((current) => current.map((section) => section.key === sectionKey ? { ...section, pages: section.pages.includes(pageKey) ? section.pages.filter((key) => key !== pageKey) : [...section.pages, pageKey] } : section));
    setNavigationSaved(false);
  };
  const moveNavigationPage = (sectionKey: NavigationSection["key"], index: number, direction: -1 | 1) => {
    setNavigationSections((current) => current.map((section) => {
      if (section.key !== sectionKey) return section;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= section.pages.length) return section;
      const pages = [...section.pages];
      [pages[index], pages[nextIndex]] = [pages[nextIndex], pages[index]];
      return { ...section, pages };
    }));
    setNavigationSaved(false);
  };
  const saveNavigationSettings = () => {
    localStorage.setItem(NAVIGATION_SETTINGS_STORAGE_KEY, JSON.stringify(navigationSections));
    window.dispatchEvent(new Event("painel-loa-navigation-change"));
    setNavigationSaved(true);
  };
  const restoreNavigationDefaults = () => {
    setNavigationSections(DEFAULT_NAVIGATION_SECTIONS);
    localStorage.removeItem(NAVIGATION_SETTINGS_STORAGE_KEY);
    window.dispatchEvent(new Event("painel-loa-navigation-change"));
    setNavigationSaved(true);
  };

  const handleRestoreBudgetEdits = () => {
    if (!window.confirm("Deseja restaurar os valores originais da importação? As edições manuais e justificativas da Análise LOA serão removidas.")) {
      return;
    }

    localStorage.removeItem("painel_loa_custom_edits_v1");
    localStorage.removeItem("painel_loa_justifications_v1");
    setSavedEditCount(0);
    setRestoreStatus("restored");
  };

  return (
    <>
      <header className="page-heading border-b border-outline-variant/30 pb-4 mb-6">
        <div>
          <p className="eyebrow font-bold uppercase text-on-surface-variant tracking-wider text-[11px]">Administração</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Painel Administrativo - Configurações</h1>
          <p className="text-on-surface-variant mt-1">Identidade visual, usuários e parâmetros gerais do Visualizador da LOA.</p>
        </div>
      </header>

      {/* Seção de Gestão de Usuários & Secretarias */}
      <UserManagementSection />

      <section className="panel bg-surface p-6 mb-8" aria-labelledby="navigation-settings-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="eyebrow font-bold uppercase text-on-surface-variant tracking-wider text-[11px]">Personalização do sistema</p><h2 id="navigation-settings-title" className="text-lg font-bold text-on-surface mt-1">Páginas e seções do menu</h2><p className="text-xs text-on-surface-variant mt-1 max-w-2xl">Habilite ou desabilite páginas e altere a ordem em que elas aparecem no site. A configuração é salva neste navegador.</p></div>
          <div className="flex gap-2"><button type="button" onClick={restoreNavigationDefaults} className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant">Restaurar padrão</button><button type="button" onClick={saveNavigationSettings} className="brutalist-button brutalist-button-primary bg-tertiary text-on-tertiary hover:bg-tertiary-container font-semibold text-xs border-0">Salvar navegação</button></div>
        </div>
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">{navigationSections.map((section) => <div key={section.key} className="rounded-xl border border-outline-variant bg-surface-container-low p-4"><h3 className="font-bold text-sm text-on-surface">{section.label}</h3><p className="text-[11px] text-on-surface-variant mt-1 mb-3">Ordem e visibilidade das páginas</p><div className="space-y-2">{section.pages.map((pageKey, index) => { const page = pageByKey.get(pageKey); if (!page) return null; return <div key={page.key} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface p-2"><span className="material-symbols-outlined text-[18px] text-primary">{page.icon}</span><span className="min-w-0 flex-1 text-xs font-semibold text-on-surface truncate">{page.label}</span><button type="button" onClick={() => moveNavigationPage(section.key, index, -1)} disabled={index === 0} aria-label={`Mover ${page.label} para cima`} className="rounded p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"><span className="material-symbols-outlined text-[17px]">arrow_upward</span></button><button type="button" onClick={() => moveNavigationPage(section.key, index, 1)} disabled={index === section.pages.length - 1} aria-label={`Mover ${page.label} para baixo`} className="rounded p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"><span className="material-symbols-outlined text-[17px]">arrow_downward</span></button><button type="button" role="switch" aria-checked={true} onClick={() => toggleNavigationPage(section.key, page.key)} aria-label={`Desabilitar ${page.label}`} className="rounded p-1 text-emerald-700 hover:bg-emerald-50"><span className="material-symbols-outlined text-[19px]">visibility</span></button></div>; })}{section.pages.length === 0 && <p className="rounded-lg border border-dashed border-outline-variant p-3 text-xs text-on-surface-variant">Nenhuma página ativa nesta seção.</p>}</div><div className="mt-4 border-t border-outline-variant/60 pt-3"><p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2">Adicionar página</p><div className="flex flex-wrap gap-1.5">{PRIMARY_PAGE_LINKS.filter((page) => !section.pages.includes(page.key)).map((page) => <button key={page.key} type="button" onClick={() => toggleNavigationPage(section.key, page.key)} className="rounded-full border border-outline-variant bg-surface px-2 py-1 text-[10px] font-semibold text-on-surface-variant hover:border-primary hover:text-primary">+ {page.label}</button>)}</div></div></div>)}</div>
        {navigationSaved && <p role="status" className="mt-4 text-xs font-semibold text-emerald-700">Configuração de navegação salva.</p>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visual Identity Section */}
        <section className="lg:col-span-8 panel p-6 bg-surface">
          <h2 className="text-md font-bold text-on-surface mb-2">Identidade da Prefeitura</h2>
          <p className="text-xs text-on-surface-variant mb-6">Configure o Brasão Oficial e a paleta de cores corporativa do município.</p>

          <div className="space-y-6">
            {/* Coat of Arms Upload */}
            <div className="border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm bg-surface">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border border-outline-variant bg-surface-container flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant rounded-lg">
                  Brasão
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Logotipo / Brasão Municipal</h3>
                  <p className="text-xs text-on-surface-variant">Formatos aceitos: SVG ou PNG de alta resolução.</p>
                </div>
              </div>
              <button className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs shrink-0 border border-outline-variant">
                Enviar Arquivo
              </button>
            </div>

            {/* Colors Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-outline-variant rounded-xl p-4 bg-surface shadow-sm">
                <label className="text-xs font-bold text-on-surface tracking-wider block mb-2">Cor Principal</label>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 border border-outline-variant rounded" style={{ backgroundColor: "#181c22" }} />
                  <input type="text" defaultValue="#181c22" className="brutalist-input text-xs py-1.5 font-mono" />
                </div>
              </div>
              <div className="border border-outline-variant rounded-xl p-4 bg-surface shadow-sm">
                <label className="text-xs font-bold text-on-surface tracking-wider block mb-2">Cor de Destaque (Accent)</label>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 border border-outline-variant rounded" style={{ backgroundColor: "#005ab4" }} />
                  <input type="text" defaultValue="#005ab4" className="brutalist-input text-xs py-1.5 font-mono" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant">
                Restaurar Padrão
              </button>
              <button className="brutalist-button brutalist-button-primary bg-tertiary text-on-tertiary hover:bg-tertiary-container font-semibold text-xs border-0">
                Salvar Alterações
              </button>
            </div>
          </div>
        </section>

        {/* Database Status Panel */}
        <aside className="lg:col-span-4 panel bg-surface-bright p-6">
          <h2 className="text-md font-bold text-on-surface mb-4">Status do Painel</h2>
          
          <div className="space-y-4">
            <div className="border border-outline-variant p-3 bg-surface flex justify-between items-center text-xs rounded-xl shadow-sm">
              <span className="font-semibold text-on-surface">Conexão BD</span>
              <span className="font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">Ativo</span>
            </div>
            
            <div className="border border-outline-variant p-3 bg-surface flex justify-between items-center text-xs rounded-xl shadow-sm">
              <span className="font-semibold text-on-surface">Último Sync</span>
              <span className="font-mono font-semibold text-on-surface-variant">30/06/2026 10:24</span>
            </div>

            <div className="border border-outline-variant p-3 bg-surface flex justify-between items-center text-xs rounded-xl shadow-sm">
              <span className="font-semibold text-on-surface">Versão API</span>
              <span className="font-mono font-semibold text-on-surface-variant">v1.2.0</span>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 panel p-6 bg-surface border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">restore</span>
            </div>
            <div>
              <h2 className="text-md font-bold text-on-surface">Restauração da Análise LOA</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Use este local para desfazer alterações feitas manualmente no Detalhamento Analítico Editável.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
              <p className="text-xs font-bold text-on-surface mb-2">O que será restaurado</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Valores LOA editados nas linhas da análise e justificativas salvas para esses ajustes.
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
              <p className="text-xs font-bold text-on-surface mb-2">Alterações salvas neste navegador</p>
              <p className="text-xl font-bold text-on-surface">{savedEditCount} <span className="text-xs font-normal text-on-surface-variant">linhas editadas</span></p>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant mt-4">
            A importação original permanece intacta. Esta ação remove somente os ajustes manuais registrados no painel.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={handleRestoreBudgetEdits}
              disabled={savedEditCount === 0}
              className="brutalist-button bg-amber-100 text-amber-900 hover:bg-amber-200 font-semibold text-xs border border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">restore</span>
              Restaurar valores originais
            </button>
            {restoreStatus === "restored" && (
              <span className="text-xs font-semibold text-green-700">Valores e justificativas restaurados.</span>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
