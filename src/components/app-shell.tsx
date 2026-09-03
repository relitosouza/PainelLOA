"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardView } from "./dashboard-view";
import { ImportView } from "./import-view";
import { PresentationDashboard } from "./presentation-dashboard";
import { SettingsView } from "./settings-view";
import { Sidebar } from "./sidebar";
import { ReceitaArrecadadaView } from "./receita-arrecadada-view";
import { ExpenseDetailView } from "./expense-detail-view";
import { AnaliseLoaView } from "./analise-loa-view";
import { ElaboracaoLoaView } from "./elaboracao-loa-view";
import { AssistenteLoaPage } from "./assistente-loa-page";
import { UserProfileMenu } from "./user-profile-menu";
import { EMPTY_FILTERS, type FilterState } from "./filters";
import { FIELDS } from "@/types/loa";
import { getNavigationSections, NAVIGATION_SETTINGS_STORAGE_KEY, type NavigationSection } from "@/lib/page-navigation";
import { getActiveUser, setActiveUser } from "@/lib/user-session";

export function AppShell({ view }: { view: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [options, setOptions] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(FIELDS.map((field) => [field, []]))
  );
  const [navigationSections, setNavigationSections] = useState<NavigationSection[]>(getNavigationSections());
  const [checkingAuth, setCheckingAuth] = useState(true);
  const sidebarExpanded = isDesktop ? !sidebarCollapsed : mobileOpen;
  const sidebarId = "primary-sidebar";

  useEffect(() => {
    // Validar se o usuário está logado
    const user = getActiveUser();
    if (!user) {
      // Tentar validar via API /api/auth/me
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setActiveUser(data.user);
            setCheckingAuth(false);
          } else {
            window.location.href = "/login";
          }
        })
        .catch(() => {
          window.location.href = "/login";
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    const loadNavigation = () => {
      try {
        const saved = localStorage.getItem(NAVIGATION_SETTINGS_STORAGE_KEY);
        if (saved) setNavigationSections(JSON.parse(saved) as NavigationSection[]);
      } catch {
        setNavigationSections(getNavigationSections());
      }
    };
    loadNavigation();
    window.addEventListener("painel-loa-navigation-change", loadNavigation);
    return () => window.removeEventListener("painel-loa-navigation-change", loadNavigation);
  }, []);

  const enabledNavigationKeys = new Set(navigationSections.flatMap((section) => section.pages));

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-surface-container-low p-6 font-body">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-semibold text-on-surface-variant">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (view === "apresentacao") return <PresentationDashboard />;

  return (
    <div className="h-full flex overflow-hidden antialiased bg-background text-on-background font-body w-full">
      <a className="skip-link sr-only focus:not-sr-only" href="#main-content">
        Pular para o conteúdo
      </a>

      {/* TopNavBar */}
      <nav className="bg-surface flex justify-between items-center w-full px-4 h-16 border-b border-outline-variant fixed top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="material-symbols-outlined text-primary cursor-pointer p-2 rounded-xl hover:bg-surface-container transition-colors"
            onClick={() => {
              if (isDesktop) {
                setMobileOpen(false);
                setSidebarCollapsed((value) => !value);
              } else {
                setMobileOpen((value) => !value);
              }
            }}
            aria-label={sidebarExpanded ? "Fechar menu lateral" : "Abrir menu lateral"}
            aria-controls={sidebarId}
            aria-expanded={sidebarExpanded}
          >
            {sidebarCollapsed ? "menu" : "menu_open"}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <Image
              src="/brasao.png"
              alt="Brasão de Osasco"
              width={36}
              height={36}
              className="h-9 w-auto object-contain"
            />
            <div className="text-lg font-headline font-bold text-primary hidden sm:block">
              {view === "dashboard" ? "Visão Analítica" : view === "transparente" ? "Orçamento Transparente" : view === "elaboracao-loa" ? "Elaboração da LOA" : view === "assistente-loa" ? "Assistente LOA" : "LOA Orçamentária"}
            </div>
          </div>
          <div className="hidden md:flex gap-6 font-headline text-sm font-semibold tracking-wide ml-4">
            {enabledNavigationKeys.has("apresentacao") && <Link className="text-on-surface-variant hover:text-primary transition-colors pb-1" href="/apresentacao">Painel Executivo</Link>}
            {enabledNavigationKeys.has("transparente") && <Link className={`pb-1 transition-colors ${view === "transparente" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant hover:text-primary"}`} href="/transparente">Orçamento Transparente</Link>}
            {enabledNavigationKeys.has("assistente-loa") && <Link className={`pb-1 transition-colors ${view === "assistente-loa" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant hover:text-primary"}`} href="/assistente-loa">Assistente LOA</Link>}
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <UserProfileMenu />
        </div>
      </nav>

      {/* SideNavBar */}
      <Sidebar
        id={sidebarId}
        isDesktop={isDesktop}
        view={view}
        filters={filters}
        setFilters={setFilters}
        options={options}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Canvas */}
      <main
        id="main-content"
        className={`loa-main flex-1 transition-[margin-left] duration-300 ease-out ${sidebarCollapsed ? "collapsed md:ml-0" : "md:ml-[280px]"} mt-16 h-full overflow-y-auto bg-surface-container-low p-4 md:p-8`}
      >
        <div className="content">
          {view === "assistente-loa" ? (
            <AssistenteLoaPage />
          ) : view === "importacao" ? (
            <ImportView />
          ) : view === "configuracoes" ? (
            <SettingsView />
          ) : view === "receitas" ? (
            <ReceitaArrecadadaView />
          ) : view === "despesas" ? (
            <ExpenseDetailView />
          ) : view === "analise-loa" ? (
            <AnaliseLoaView />
          ) : view === "elaboracao-loa" ? (
            <ElaboracaoLoaView />
          ) : (
            <DashboardView
              view={view}
              filters={filters}
              setFilters={setFilters}
              setOptions={setOptions}
            />
          )}
        </div>
      </main>

      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-35 border-0 cursor-pointer bg-black/40 transition-opacity duration-200 ease-out md:hidden motion-reduce:transition-none"
        />
      )}
    </div>
  );
}
