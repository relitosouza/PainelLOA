"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart } from "./bar-chart";
import { DataTable } from "./data-table";
import { EMPTY_FILTERS, Filters, type FilterState } from "./filters";
import { SummaryCards } from "./summary-cards";
import { currency, integer, percent } from "@/lib/format";
import { getSecretariatDemoRecords } from "@/lib/secretariat-data";
import { FIELDS, type DashboardData, type FieldKey } from "@/types/loa";

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

function MetricCard({ label, value, note, primary, tone = "green", cycling }: { label: string; value: string; note: string; primary?: boolean; tone?: MetricTone; cycling?: boolean }) {
  return <article className={`metric-card tone-${tone} ${primary ? "primary" : ""}`}><div className="metric-label">{label}</div><div key={`${value}-${note}`} className={cycling ? "metric-content cycling" : "metric-content"}><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div></article>;
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



export function DashboardView({ view }: { view: string }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [options, setOptions] = useState(EMPTY_DATA.filterOptions);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("value");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [secretariatIndex, setSecretariatIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = useMemo(() => buildQuery(filters, page, sort, direction).toString(), [filters, page, sort, direction]);
  const displayedSecretariats = useMemo(() => {
    if (!filters.organ.length) return data.groups.organ;
    const selected = new Set(filters.organ);
    return data.groups.organ.filter((item) => selected.has(item.label));
  }, [data.groups.organ, filters.organ]);
  const displayedSecretariat = displayedSecretariats[secretariatIndex % Math.max(displayedSecretariats.length, 1)] ?? (filters.organ.length ? null : data.secretariatCeiling);

  useEffect(() => {
    if (displayedSecretariats.length < 2) return;
    const interval = window.setInterval(() => setSecretariatIndex((current) => current + 1), 3200);
    return () => window.clearInterval(interval);
  }, [displayedSecretariats.length]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true); setError("");
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
  }, [query, filters]);

  function updateFilters(next: FilterState) { setFilters(next); setPage(1); }
  function updateSort(field: FieldKey | "value") { if (sort === field) setDirection((value) => value === "asc" ? "desc" : "asc"); else { setSort(field); setDirection("asc"); } setPage(1); }
  const [title, subtitle] = VIEW_TITLES[view] ?? VIEW_TITLES.dashboard;

  return (
    <>
      <header className="page-heading"><div><p className="eyebrow">Painel Executivo de Análise Orçamentária</p><h1>{title}</h1><p>{subtitle}</p></div><span className="updated">Valores em reais · atualização automática</span></header>
      {error && <div className="alert" role="alert">{error} Verifique a variável DATABASE_URL e se o PostgreSQL está disponível.</div>}
      {loading && !data.hasData ? <div className="loading"><div><div className="spinner" /><p>Carregando dados orçamentários...</p></div></div> : <>
        {view === "dashboard" && <section className="metric-grid budget-overview" aria-label="Visão geral do orçamento">
          <MetricCard primary tone="navy" label="Valor Total do Orçamento" value={currency.format(data.totals.loa)} note="Soma do orçamento de todas as secretarias" />
          <MetricCard primary tone="amber" cycling={displayedSecretariats.length > 1} label="Valor Teto por Secretaria" value={currency.format(displayedSecretariat?.value ?? 0)} note={displayedSecretariat?.label || "Selecione uma secretaria"} />
        </section>}
        {!error && !data.hasData && <div className="empty-state"><div><div className="empty-icon">⇧</div><h2>Nenhum dado da LOA foi importado</h2><p>Acesse a aba Importação de Dados para carregar a planilha e começar a análise orçamentária.</p><Link className="button primary" href="/importacao">Ir para Importação de Dados</Link></div></div>}
        <Filters filters={filters} options={options} total={data.pagination.total} onChange={updateFilters} onClear={() => updateFilters(EMPTY_FILTERS)} />
        <section className="metric-grid" aria-label="Indicadores principais">
          {view !== "dashboard" && <MetricCard primary tone="navy" label="Valor Total da LOA" value={currency.format(data.totals.loa)} note="Orçamento consolidado" />}
          <MetricCard tone="green" label="Valor Filtrado" value={currency.format(data.totals.filtered)} note={`${integer.format(data.pagination.total)} registros na seleção`} />
          <MetricCard tone="teal" label="Órgãos / Secretarias" value={integer.format(data.counts.organs)} note="Órgãos distintos" />
          <MetricCard tone="blue" label="Unidades Orçamentárias" value={integer.format(data.counts.units)} note="Unidades distintas" />
          <MetricCard tone="steel" label="Funções" value={integer.format(data.counts.functions)} note="Funções de governo" />
          <MetricCard tone="amber" label="Programas" value={integer.format(data.counts.programs)} note="Programas orçamentários" />
          <MetricCard tone="coral" label="Ações" value={integer.format(data.counts.actions)} note="Projetos e atividades" />
          <MetricCard tone="navy" label="Processos Administrativos" value={integer.format(data.counts.processes)} note="Processos vinculados" />
          <MetricCard tone="green" label="Novos Projetos" value={integer.format(data.counts.newProjects)} note="Projetos em planejamento" />
        </section>

        <section className="charts-grid" aria-label="Gráficos orçamentários">
          <BarChart changeable title="Orçamento por Função" subtitle="Distribuição funcional" data={data.groups.functionName} />
          <BarChart changeable title="Orçamento por Subfunção" subtitle="Principais subfunções" data={data.groups.subfunction} />
          <BarChart changeable title="Orçamento por Programa" subtitle="Ranking de programas" data={data.groups.program} />
          <BarChart changeable title="Orçamento por Ação" subtitle="Ranking de ações" data={data.groups.action} />
          <BarChart changeable title="Natureza da Despesa" subtitle="Composição da despesa" data={data.groups.expenseNature} />
          <BarChart title="Orçamento por Subelemento" subtitle="Itens mais relevantes" data={data.groups.subelement} />
        </section>
        <SummaryCards title="Resumo por Órgão / Secretaria" description="Teto e participação no orçamento consolidado" data={data.groups.organ} total={data.totals.loa} />
        <SummaryCards title="Resumo por Unidade Orçamentária" description="Principais unidades por valor orçamentário" data={data.groups.budgetUnit} total={data.totals.loa} />
        <DataTable rows={data.records} total={data.pagination.total} filteredValue={data.totals.filtered} page={data.pagination.page} pages={data.pagination.pages} search={filters.search} sort={sort} direction={direction} onSearch={(search) => updateFilters({ ...filters, search })} onSort={updateSort} onPage={setPage} />
      </>}
    </>
  );
}
