"use client";

import { useState } from "react";
import { DashboardView } from "./dashboard-view";
import { ImportView } from "./import-view";
import { PresentationDashboard } from "./presentation-dashboard";
import { SettingsView } from "./settings-view";
import { Sidebar } from "./sidebar";
import { EMPTY_FILTERS, type FilterState } from "./filters";
import { FIELDS } from "@/types/loa";

export function AppShell({ view }: { view: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [options, setOptions] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(FIELDS.map((field) => [field, []]))
  );

  if (view === "apresentacao") return <PresentationDashboard />;

  return (
    <div className="h-full flex overflow-hidden antialiased bg-background text-on-background font-body w-full">
      <a className="skip-link sr-only focus:not-sr-only" href="#main-content">
        Pular para o conteúdo
      </a>

      {/* Mobile TopNavBar */}
      <nav className="md:hidden bg-surface flex justify-between items-center w-full px-4 h-16 border-b border-outline-variant fixed top-0 z-50 shadow-sm">
        <div className="text-lg font-headline font-bold text-primary">LOA Orçamentária</div>
        <div className="flex gap-4 items-center">
          <button
            className="material-symbols-outlined text-primary cursor-pointer p-1 rounded hover:bg-surface-container"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Abrir menu"
          >
            menu
          </button>
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
        className={`loa-main flex-1 ${sidebarCollapsed ? "collapsed md:ml-[84px]" : "md:ml-[280px]"} mt-16 md:mt-0 h-full overflow-y-auto bg-surface-container-low p-4 md:p-8`}
      >
        <div className="content">
          {view === "importacao" ? (
            <ImportView />
          ) : view === "configuracoes" ? (
            <SettingsView />
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
          className="fixed inset-0 z-35 bg-black/40 md:hidden border-0 cursor-pointer"
        />
      )}
    </div>
  );
}
