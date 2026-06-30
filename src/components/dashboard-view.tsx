"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart } from "./bar-chart";
import { DataTable } from "./data-table";
import { AnalyticDashboardLayout } from "./analytic-dashboard-layout";
import { type FilterState } from "./filters";
import { SummaryCards } from "./summary-cards";
import { currency, integer } from "@/lib/format";
import { getSecretariatDemoRecords } from "@/lib/secretariat-data";
import { FIELDS, type DashboardData, type FieldKey } from "@/types/loa";
import { useDataSource, DataSourceToggle } from "./data-source-toggle";

const EMPTY_DATA: DashboardData = {
  hasData: false, records: [], pagination: { page: 1, pageSize: 20, total: 0, pages: 1 }, totals: { loa: 0, filtered: 0 }, spending: { operating: 0, investment: 0 },
  secretariatCeiling: null,
  counts: { organs: 0, units: 0, functions: 0, programs: 0, actions: 0, processes: 0, newProjects: 0 },
  groups: Object.fromEntries(FIELDS.map((field) => [field, []])) as unknown as DashboardData["groups"],
  filterOptions: Object.fromEntries(FIELDS.map((field) => [field, []])) as unknown as DashboardData["filterOptions"],
};

const VIEW_TITLES: Record<string, [string, string]> = {
  dashboard: ["Dashboard LOA", "Visão consolidada da Lei Orçamentária Anual"],
  orgaos: ["Órgãos / Secretarias", "Participação e teto orçamentário por órgão municipal"],
  unidades: ["Unidades Orçamentárias", "Distribuição dos recursos pelas unidades executoras"],
  funcoes: ["Funções", "Análise do orçamento por função de governo"],
  subfuncoes: ["Subfunções", "Detalhamento funcional da despesa pública"],
  programas: ["Programas", "Ranking e composição dos programas orçamentários"],
  acoes: ["Ações", "Recursos previstos para projetos e atividades"],
  natureza: ["Natureza da Despesa", "Composição econômica e classificação das despesas"],
  processos: ["Processos Administrativos", "Rastreabilidade dos processos vinculados à LOA"],
  relatorios: ["Relatórios da LOA", "Consulte, filtre e exporte informações orçamentárias"],
};

function buildQuery(filters: FilterState, page: number, sort: string, direction: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: "20", sort, direction });
  for (const field of FIELDS) filters[field].forEach((value) => params.append(field, value));
  if (filters.min) params.set("min", filters.min.replace(/\./g, "").replace(",", "."));
  if (filters.max) params.set("max", filters.max.replace(/\./g, "").replace(",", "."));
  if (filters.search) params.set("search", filters.search);
  return params;
}

type MetricTone = "navy" | "amber" | "blue" | "teal" | "green" | "steel" | "coral";

function MetricCard({ label, value, note, primary, tone = "green", cycling, className }: { label: string; value: string; note: string; primary?: boolean; tone?: MetricTone; cycling?: boolean; className?: string }) {
  return <article className={`metric-card tone-${tone} ${primary ? "primary" : ""} ${className ?? ""}`}><div className="metric-label">{label}</div><div key={`${value}-${note}`} className={cycling ? "metric-content cycling" : "metric-content"}><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div></article>;
}

function buildDemoDashboardData(): DashboardData {
  const demoRecords = getSecretariatDemoRecords(2027);
  const loa = demoRecords.reduce((sum, record) => sum + record.value, 0);
  const organGroups = [...new Map(demoRecords.map((record) => [record.secretariat, demoRecords.filter((item) => item.secretariat === record.secretariat).reduce((sum, item) => sum + item.value, 0)])).entries()]
    .map(([label, value]) => ({ label, value, count: demoRecords.filter((record) => record.secretariat === label).length }))
    .sort((a, b) => b.value - a.value);
  const grouped = (field: "unit" | "functionName" | "program" | "process" | "category" | "expenseNature") => [...new Map(demoRecords.map((record) => [record[field], demoRecords.filter((item) => item[field] === record[field]).reduce((sum, item) => sum + item.value, 0)])).entries()]
    .map(([label, value]) => ({ label, value, count: demoRecords.filter((record) => record[field] === label).length }))
    .sort((a, b) => b.value - a.value);
  const rows = demoRecords.map((record, index) => ({ id: String(index + 1), organ: record.secretariat, budgetUnit: record.unit, functionName: record.functionName, subfunction: record.functionName, program: record.program, action: record.process, expenseNature: record.expenseNature, subelement: record.category === "operating" ? "33" : "51", administrativeProcess: record.process, value: record.value }));
  return {
    hasData: true,
    records: rows,
    pagination: { page: 1, pageSize: 20, total: rows.length, pages: 1 },
    totals: { loa, filtered: loa },
    secretariatCeiling: organGroups[0] ?? null,
    spending: {
      operating: demoRecords.filter((record) => record.category === "operating").reduce((sum, record) => sum + record.value, 0),
      investment: demoRecords.filter((record) => record.category === "investment").reduce((sum, record) => sum + record.value, 0),
    },
    counts: {
      organs: organGroups.length,
      units: new Set(demoRecords.map((record) => record.unit)).size,
      functions: new Set(demoRecords.map((record) => record.functionName)).size,
      programs: new Set(demoRecords.map((record) => record.program)).size,
      actions: new Set(demoRecords.map((record) => record.process)).size,
      processes: new Set(demoRecords.map((record) => record.process)).size,
      newProjects: 12,
    },
    groups: {
      organ: organGroups,
      budgetUnit: grouped("unit"),
      functionName: grouped("functionName"),
      subfunction: grouped("functionName"),
      program: grouped("program"),
      action: grouped("process"),
      expenseNature: grouped("expenseNature"),
      subelement: grouped("category"),
      administrativeProcess: grouped("process"),
    },
    filterOptions: {
      organ: [...new Set(demoRecords.map((record) => record.secretariat))],
      budgetUnit: [...new Set(demoRecords.map((record) => record.unit))],
      functionName: [...new Set(demoRecords.map((record) => record.functionName))],
      subfunction: [...new Set(demoRecords.map((record) => record.functionName))],
      program: [...new Set(demoRecords.map((record) => record.program))],
      action: [...new Set(demoRecords.map((record) => record.process))],
      expenseNature: [...new Set(demoRecords.map((record) => record.expenseNature))],
      subelement: ["33", "51"],
      administrativeProcess: [...new Set(demoRecords.map((record) => record.process))],
    },
  };
}



export function DashboardView({
  view,
  filters,
  setFilters,
  setOptions,
}: {
  view: string;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}) {
  const [dataSource] = useDataSource();
  const [data, setData] = useState(EMPTY_DATA);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("value");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = useMemo(() => buildQuery(filters, page, sort, direction).toString(), [filters, page, sort, direction]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true); setError("");
        if (dataSource === "ficticio") {
          const demoData = buildDemoDashboardData();
          setData(demoData);
          setOptions(demoData.filterOptions);
          setLoading(false);
          return;
        }
        const response = await fetch(`/api/loa?${query}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        setData(result);
        setOptions((current) => Object.fromEntries(FIELDS.map((field) => [field, [...new Set([...filters[field], ...result.filterOptions[field], ...(!filters[field].length ? [] : current[field])])].sort((a, b) => a.localeCompare(b, "pt-BR"))])) as unknown as DashboardData["filterOptions"]);
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          const demoData = buildDemoDashboardData();
          setError(reason instanceof Error ? reason.message : "Falha ao carregar o painel.");
          setData(demoData);
          setOptions(demoData.filterOptions);
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, filters, dataSource, setOptions]);

  function updateFilters(next: FilterState) { setFilters(next); setPage(1); }
  function updateSort(field: FieldKey | "value") { if (sort === field) setDirection((value) => value === "asc" ? "desc" : "asc"); else { setSort(field); setDirection("asc"); } setPage(1); }
  const [title, subtitle] = VIEW_TITLES[view] ?? VIEW_TITLES.dashboard;

  const formatBillion = (val: number) => {
    if (val >= 1e9) {
      return `R$ ${(val / 1e9).toFixed(1).replace(".", ",")} Bi`;
    }
    if (val >= 1e6) {
      return `R$ ${(val / 1e6).toFixed(1).replace(".", ",")} Mi`;
    }
    return `R$ ${val.toLocaleString("pt-BR")}`;
  };

  const totalVal = data.totals.loa;
  const operatingVal = data.spending.operating;
  const investmentVal = data.spending.investment;
  const isBalanced = totalVal >= (operatingVal + investmentVal);

  if (view === "dashboard") {
    return (
      <>
        {error && <div className="alert animate-fade-in" role="alert">{error} Verifique a variÃ¡vel DATABASE_URL e se o PostgreSQL estÃ¡ disponÃ­vel.</div>}

        {loading && !data.hasData ? (
          <div className="loading flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-on-surface-variant font-medium">Carregando dados orÃ§amentÃ¡rios...</p>
            </div>
          </div>
        ) : (
          <AnalyticDashboardLayout data={data} />
        )}
      </>
    );
  }

  return (
    <>
      {error && <div className="alert animate-fade-in" role="alert">{error} Verifique a variável DATABASE_URL e se o PostgreSQL está disponível.</div>}
      
      {loading && !data.hasData ? (
        <div className="loading flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-on-surface-variant font-medium">Carregando dados orçamentários...</p>
          </div>
        </div>
      ) : (
        <>
          {view === "dashboard" ? (
            <div className="animate-fade-in">
              <header className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
                    Visualização Analítica da LOA
                  </h2>
                  <p className="text-on-surface-variant mt-1">
                    Visão abrangente e detalhada do balanço orçamentário da LOA
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-4 bg-surface px-4 py-2 rounded-lg shadow-sm border border-outline-variant text-sm font-medium">
                  <DataSourceToggle />
                  <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary">calendar_today</span>
                    Exercício: 2027
                  </div>
                </div>
              </header>

              <div className="flex flex-col gap-6">
                {/* 1. Executive Overview */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card revenue-gradient p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                      <p className="text-sm font-medium text-on-surface-variant mb-1">Receita Total</p>
                      <h3 className="text-3xl font-headline font-bold text-tertiary">
                        {formatBillion(totalVal)}
                      </h3>
                    </div>
                    <span
                      className="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-[80px] text-tertiary/10 rotate-12"
                      style={{ userSelect: "none" }}
                    >
                      trending_up
                    </span>
                  </div>

                  <div className="glass-card expense-gradient p-5 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="z-10">
                      <p className="text-sm font-medium text-on-surface-variant mb-1">Despesa Total</p>
                      <h3 className="text-3xl font-headline font-bold text-purple-700">
                        {formatBillion(operatingVal + investmentVal)}
                      </h3>
                    </div>
                    <span
                      className="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-[80px] text-purple-700/10 -rotate-12"
                      style={{ userSelect: "none" }}
                    >
                      trending_down
                    </span>
                  </div>

                  <div
                    className={`glass-card p-5 flex flex-col justify-center h-32 border-l-4 ${
                      isBalanced ? "border-l-green-500" : "border-l-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-on-surface-variant mb-1">Balanço Orçamentário</p>
                        <h3 className="text-xl font-headline font-bold text-on-surface">
                          {isBalanced ? "Superavitário / Equilibrado" : "Déficit Orçamentário"}
                        </h3>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isBalanced ? "bg-green-100" : "bg-red-100"
                      }`}>
                        <span className={`material-symbols-outlined ${
                          isBalanced ? "text-green-600" : "text-red-600"
                        }`}>
                          balance
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Main Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (Larger) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* 2. Revenue Breakdown Section */}
                    <section className="glass-card p-6">
                      <h4 className="text-lg font-headline font-semibold text-on-surface mb-4">
                        Detalhamento de Receitas
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type */}
                        <div className="space-y-4">
                          <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Receita Corrente</span>
                              <span className="text-sm font-bold text-tertiary">
                                {formatBillion(operatingVal)}
                              </span>
                            </div>
                            <div className="w-full bg-surface-variant rounded-full h-2">
                              <div
                                className="bg-tertiary h-2 rounded-full transition-all duration-500"
                                style={{ width: `${totalVal > 0 ? Math.round((operatingVal / totalVal) * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Receita de Capital</span>
                              <span className="text-sm font-bold text-tertiary">
                                {formatBillion(investmentVal)}
                              </span>
                            </div>
                            <div className="w-full bg-surface-variant rounded-full h-2">
                              <div
                                className="bg-tertiary-container h-2 rounded-full transition-all duration-500"
                                style={{ width: `${totalVal > 0 ? Math.round((investmentVal / totalVal) * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Source Breakdown visual */}
                        <div className="flex flex-col justify-center">
                          <h5 className="text-xs font-semibold uppercase text-on-surface-variant mb-3">
                            Distribuição de Origem
                          </h5>
                          <div className="flex h-8 rounded-lg overflow-hidden shadow-inner mb-3">
                            <div
                              className="bg-tertiary h-full flex items-center justify-center text-xs text-white font-medium"
                              style={{ width: "53%" }}
                              title="Transferências Correntes"
                            >
                              53%
                            </div>
                            <div
                              className="bg-blue-400 h-full flex items-center justify-center text-xs text-white font-medium"
                              style={{ width: "41%" }}
                              title="Receitas Próprias"
                            >
                              41%
                            </div>
                            <div
                              className="bg-blue-200 h-full flex items-center justify-center text-xs text-gray-700 font-medium"
                              style={{ width: "6%" }}
                              title="Outras Receitas"
                            >
                              6%
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-on-surface-variant flex-wrap gap-2">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-tertiary" />
                              Transf. ({formatBillion(totalVal * 0.53)})
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                              Próprias ({formatBillion(totalVal * 0.41)})
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-200" />
                              Outras ({formatBillion(totalVal * 0.06)})
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 7. Integration 'Origin vs Destination' */}
                    <section className="glass-card p-6 h-64 flex flex-col relative overflow-hidden">
                      <h4 className="text-lg font-headline font-semibold text-on-surface mb-2">
                        Fluxo de Origem para Destino
                      </h4>
                      <p className="text-sm text-on-surface-variant mb-4">
                        Como as fontes primárias de recursos financiam as principais funções de despesa.
                      </p>
                      <div className="flex-1 w-full bg-surface-container rounded-lg border border-outline-variant/30 flex items-center justify-center relative">
                        <div className="flex w-full justify-between px-8 z-10">
                          <div className="space-y-4 w-1/3">
                            <div className="bg-blue-100 text-blue-800 text-xs font-bold p-2 rounded text-center border border-blue-200">
                              ICMS (Estadual)
                            </div>
                            <div className="bg-blue-100 text-blue-800 text-xs font-bold p-2 rounded text-center border border-blue-200">
                              ISS (Municipal)
                            </div>
                          </div>
                          <div className="flex flex-col justify-center w-1/3 opacity-30 px-4">
                            <svg className="w-full h-24" preserveAspectRatio="none" viewBox="0 0 100 100">
                              <path
                                className="text-blue-500"
                                d="M0,20 C50,20 50,20 100,20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                className="text-purple-500"
                                d="M0,80 C50,80 50,80 100,80"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                className="text-gray-400"
                                d="M0,20 C50,20 50,80 100,80"
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray="4,4"
                                strokeWidth="1"
                              />
                            </svg>
                          </div>
                          <div className="space-y-4 w-1/3">
                            <div className="bg-purple-100 text-purple-800 text-xs font-bold p-2 rounded text-center border border-purple-200">
                              Saúde (SUS)
                            </div>
                            <div className="bg-purple-100 text-purple-800 text-xs font-bold p-2 rounded text-center border border-purple-200">
                              Educação (FUNDEB)
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column (Smaller) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* 5. Risk & Performance */}
                    <section className="glass-card p-5 border-t-4 border-t-error">
                      <div className="flex items-center gap-2 mb-3 text-error">
                        <span className="material-symbols-outlined">warning</span>
                        <h4 className="font-headline font-semibold">Fatores de Risco</h4>
                      </div>
                      <ul className="space-y-3 p-0 list-none">
                        <li className="bg-error-container/50 text-on-surface p-3 rounded-md text-sm border border-error/20 flex flex-col">
                          <span className="font-bold text-error font-headline">Alta Dependência de Transferências</span>
                          <span className="text-xs opacity-80 mt-1">
                            53% da receita total depende de transferências de outros entes.
                          </span>
                        </li>
                        <li className="bg-orange-100 text-on-surface p-3 rounded-md text-sm border border-orange-200 flex flex-col">
                          <span className="font-bold text-orange-700 font-headline">Concentração de Receitas</span>
                          <span className="text-xs opacity-80 mt-1">
                            As 3 principais fontes respondem por 72% do total arrecadado.
                          </span>
                        </li>
                      </ul>
                    </section>

                    {/* 8. Automated Insights */}
                    <section className="glass-card p-5 bg-surface-bright">
                      <div className="flex items-center gap-2 mb-3 text-tertiary">
                        <span className="material-symbols-outlined">lightbulb</span>
                        <h4 className="font-headline font-semibold text-on-surface">Insights de IA</h4>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                        A arrecadação própria municipal situa-se em <strong>41%</strong>. O ICMS continua a ser a principal fonte singular de recursos. A receita total da LOA demonstra um crescimento de <strong>6,2%</strong> em relação ao exercício fiscal anterior.
                      </p>
                    </section>

                    {/* 4. Per Capita Indicators */}
                    <section className="glass-card p-5">
                      <h4 className="text-sm font-headline font-semibold text-on-surface mb-4">
                        Indicadores Per Capita (760k hab.)
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface p-3 rounded border border-outline-variant/30 text-center">
                          <p className="text-[10px] uppercase text-on-surface-variant mb-1">Total / Hab.</p>
                          <p className="font-bold text-sm text-on-surface">
                            {currency.format(totalVal / 760000)}
                          </p>
                        </div>
                        <div className="bg-surface p-3 rounded border border-outline-variant/30 text-center">
                          <p className="text-[10px] uppercase text-on-surface-variant mb-1">Própria / Hab.</p>
                          <p className="font-bold text-sm text-blue-600">
                            {currency.format((totalVal * 0.41) / 760000)}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* 3. Revenue Sources Highlight (Bottom Row) */}
                <section className="glass-card p-6">
                  <h4 className="text-lg font-headline font-semibold text-on-surface mb-4">
                    Principais Fontes de Receita
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                        ICMS
                      </span>
                      <span className="text-xl font-bold text-tertiary">
                        {formatBillion(totalVal * 0.207)}
                      </span>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                        ISS
                      </span>
                      <span className="text-xl font-bold text-tertiary">
                        {formatBillion(totalVal * 0.190)}
                      </span>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                        FUNDEB
                      </span>
                      <span className="text-xl font-bold text-tertiary">
                        {formatBillion(totalVal * 0.124)}
                      </span>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                        IPTU
                      </span>
                      <span className="text-xl font-bold text-tertiary">
                        {formatBillion(totalVal * 0.100)}
                      </span>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm">
                      <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">
                        FPM
                      </span>
                      <span className="text-xl font-bold text-tertiary">
                        {formatBillion(totalVal * 0.083)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <header className="page-heading flex justify-between items-center">
                <div>
                  <p className="eyebrow font-medium">Visão Analítica da LOA</p>
                  <h1>{title}</h1>
                  <p>{subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <DataSourceToggle />
                  <span className="updated border-l border-outline-variant/30 pl-4">Valores em reais · atualização automática</span>
                </div>
              </header>

              {!error && !data.hasData && (
                <div className="empty-state">
                  <div>
                    <div className="empty-icon">⇧</div>
                    <h2>Nenhum dado da LOA foi importado</h2>
                    <p>
                      Acesse a aba Importação de Dados para carregar a planilha e começar a análise
                      orçamentária.
                    </p>
                    <Link className="button primary" href="/importacao">
                      Ir para Importação de Dados
                    </Link>
                  </div>
                </div>
              )}

              <section className="metric-grid mt-6" aria-label="Indicadores principais">
                <MetricCard
                  primary
                  tone="navy"
                  label="Valor Total da LOA"
                  value={currency.format(data.totals.loa)}
                  note="Orçamento consolidado"
                />
                <MetricCard
                  tone="green"
                  label="Valor Filtrado"
                  value={currency.format(data.totals.filtered)}
                  note={`${integer.format(data.pagination.total)} registros na seleção`}
                />
                <MetricCard
                  tone="teal"
                  label="Órgãos / Secretarias"
                  value={integer.format(data.counts.organs)}
                  note="Órgãos distintos"
                />
                <MetricCard
                  tone="blue"
                  label="Unidades Orçamentárias"
                  value={integer.format(data.counts.units)}
                  note="Unidades distintas"
                />
                <MetricCard
                  tone="steel"
                  label="Funções"
                  value={integer.format(data.counts.functions)}
                  note="Funções de governo"
                />
                <MetricCard
                  tone="amber"
                  label="Programas"
                  value={integer.format(data.counts.programs)}
                  note="Programas orçamentários"
                />
                <MetricCard
                  tone="coral"
                  label="Ações"
                  value={integer.format(data.counts.actions)}
                  note="Projetos e atividades"
                />
                <MetricCard
                  tone="navy"
                  label="Processos Administrativos"
                  value={integer.format(data.counts.processes)}
                  note="Processos vinculados"
                />
                <MetricCard
                  tone="green"
                  label="Novos Projetos"
                  value={integer.format(data.counts.newProjects)}
                  note="Projetos em planejamento"
                />
              </section>

              <section className="charts-grid mt-6" aria-label="Gráficos orçamentários">
                <BarChart
                  changeable
                  title="Orçamento por Função"
                  subtitle="Distribuição funcional"
                  data={data.groups.functionName}
                />
                <BarChart
                  changeable
                  title="Orçamento por Subfunção"
                  subtitle="Principais subfunções"
                  data={data.groups.subfunction}
                />
                <BarChart
                  changeable
                  title="Orçamento por Programa"
                  subtitle="Ranking de programas"
                  data={data.groups.program}
                />
                <BarChart
                  changeable
                  title="Orçamento por Ação"
                  subtitle="Ranking de ações"
                  data={data.groups.action}
                />
                <BarChart
                  changeable
                  title="Natureza da Despesa"
                  subtitle="Composição da despesa"
                  data={data.groups.expenseNature}
                />
                <BarChart
                  title="Orçamento por Subelemento"
                  subtitle="Itens mais relevantes"
                  data={data.groups.subelement}
                />
              </section>

              <div className="mt-6">
                <SummaryCards
                  title="Resumo por Órgão / Secretaria"
                  description="Teto e participação no orçamento consolidado"
                  data={data.groups.organ}
                  total={data.totals.loa}
                />
              </div>

              <div className="mt-6">
                <SummaryCards
                  title="Resumo por Unidade Orçamentária"
                  description="Principais unidades por valor orçamentário"
                  data={data.groups.budgetUnit}
                  total={data.totals.loa}
                />
              </div>

              <div className="mt-6">
                <DataTable
                  rows={data.records}
                  total={data.pagination.total}
                  filteredValue={data.totals.filtered}
                  page={data.pagination.page}
                  pages={data.pagination.pages}
                  search={filters.search}
                  sort={sort}
                  direction={direction}
                  onSearch={(search) => updateFilters({ ...filters, search })}
                  onSort={updateSort}
                  onPage={setPage}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
