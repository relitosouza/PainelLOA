"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardView } from "./dashboard-view";
import { ImportView } from "./import-view";
import { PresentationDashboard } from "./presentation-dashboard";
import { SettingsView } from "./settings-view";
import { Sidebar } from "./sidebar";
import { RevenueDetailView } from "./revenue-detail-view";
import { ExpenseDetailView } from "./expense-detail-view";
import { EMPTY_FILTERS, type FilterState } from "./filters";
import { FIELDS } from "@/types/loa";

export function AppShell({ view }: { view: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [options, setOptions] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(FIELDS.map((field) => [field, []]))
  );
  const sidebarExpanded = isDesktop ? !sidebarCollapsed : mobileOpen;
  const sidebarId = "primary-sidebar";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

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
            <img
              src="/brasao.png"
              alt="Brasão de Osasco"
              className="h-9 w-auto object-contain"
            />
            <div className="text-lg font-headline font-bold text-primary hidden sm:block">
              {view === "dashboard" ? "Visão Analítica" : view === "transparente" ? "LOA Transparente" : "LOA Orçamentária"}
            </div>
          </div>
          <div className="hidden md:flex gap-6 font-headline text-sm font-semibold tracking-wide ml-4">
            <Link
              className="text-on-surface-variant hover:text-primary transition-colors pb-1"
              href="/apresentacao"
            >
              Painel Executivo
            </Link>
            <Link
              className={`pb-1 transition-colors ${
                view === "transparente"
                  ? "text-primary border-b-2 border-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              href="/transparente"
            >
              LOA Transparente
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <span className="material-symbols-outlined text-primary">notifications</span>
          <img
            alt="User profile"
            className="w-8 h-8 rounded-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBDE1_mK6eZnevHIDNtgh5q3IUhCSThIhS8ajWhcpFEWZ6p4rME6G5piJ1vBNDa7l7igIUmmU0CrPBMTqJebycoX6lBIkHw5Jb49wW6sfW8Va3A0O3X__PywcPv5dII7JtvB_AaP3LALiJRMWqdFyIHz1oJ-wUjrfArWRvC0H1rYqff38KRYi7dZy-VTLQeHEADdDj8-hi7Q8Rfb2j9O57KadrXyvRqCyeLEgNZy0t-BiJe20UdvdFxw"
          />
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
          {view === "importacao" ? (
            <ImportView />
          ) : view === "configuracoes" ? (
            <SettingsView />
          ) : view === "receitas" ? (
            <RevenueDetailView />
          ) : view === "despesas" ? (
            <ExpenseDetailView />
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
