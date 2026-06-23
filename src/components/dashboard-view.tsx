"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart } from "./bar-chart";
import { DataTable } from "./data-table";
import { EMPTY_FILTERS, Filters, type FilterState } from "./filters";
import { SummaryCards } from "./summary-cards";
import { currency, integer, percent } from "@/lib/format";
import { FIELDS, type DashboardData, type FieldKey } from "@/types/loa";

const EMPTY_DATA: DashboardData = {
  hasData: false, records: [], pagination: { page: 1, pageSize: 20, total: 0, pages: 1 }, totals: { loa: 0, filtered: 0 }, spending: { operating: 0, investment: 0 },
  counts: { organs: 0, units: 0, functions: 0, programs: 0, actions: 0, processes: 0 },
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

function MetricCard({ label, value, note, primary }: { label: string; value: string; note: string; primary?: boolean }) {
  return <article className={`metric-card ${primary ? "primary" : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></article>;
}

function ExecutiveInsights({ data }: { data: DashboardData }) {
  const largestProcess = data.groups.administrativeProcess.find((item) => item.label.trim());
  const concentratedOrgan = data.groups.organ.find((item) => item.label.trim());
  const topProgram = data.groups.program.find((item) => item.label.trim());
  const operatingShare = data.totals.filtered ? data.spending.operating / data.totals.filtered : 0;
  const investmentShare = data.totals.filtered ? data.spending.investment / data.totals.filtered : 0;
  return <section className="insight-grid" aria-label="Perguntas executivas">
    <article className="insight-card"><span className="insight-number">01</span><h2>Onde estão os maiores contratos e processos?</h2><p className="insight-label">Maior processo administrativo</p><strong className="insight-value">{currency.format(largestProcess?.value ?? 0)}</strong><p className="insight-name">{largestProcess?.label || "Não informado"}</p></article>
    <article className="insight-card"><span className="insight-number">02</span><h2>Onde está concentrado o orçamento?</h2><p className="insight-label">Órgão com maior participação</p><strong className="insight-value">{currency.format(concentratedOrgan?.value ?? 0)}</strong><p className="insight-name">{concentratedOrgan?.label || "Não informado"}</p><span className="insight-share">{percent.format(data.totals.filtered ? (concentratedOrgan?.value ?? 0) / data.totals.filtered : 0)} do valor filtrado</span></article>
    <article className="insight-card"><span className="insight-number">03</span><h2>Quanto está reservado para custeio e investimento?</h2><div className="spending-values"><div><p className="insight-label">Custeio / correntes</p><strong>{currency.format(data.spending.operating)}</strong><span>{percent.format(operatingShare)}</span></div><div><p className="insight-label">Investimento / capital</p><strong>{currency.format(data.spending.investment)}</strong><span>{percent.format(investmentShare)}</span></div></div></article>
    <article className="insight-card"><span className="insight-number">04</span><h2>Quais programas consomem mais recursos?</h2><p className="insight-label">Programa com maior orçamento</p><strong className="insight-value">{currency.format(topProgram?.value ?? 0)}</strong><p className="insight-name">{topProgram?.label || "Não informado"}</p><span className="insight-share">{percent.format(data.totals.filtered ? (topProgram?.value ?? 0) / data.totals.filtered : 0)} do valor filtrado</span></article>
  </section>;
}

export function DashboardView({ view }: { view: string }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [options, setOptions] = useState(EMPTY_DATA.filterOptions);
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
        const response = await fetch(`/api/loa?${query}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        setData(result);
        setOptions((current) => Object.fromEntries(FIELDS.map((field) => [field, [...new Set([...filters[field], ...result.filterOptions[field], ...(!filters[field].length ? [] : current[field])])].sort((a, b) => a.localeCompare(b, "pt-BR"))])) as unknown as DashboardData["filterOptions"]);
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Falha ao carregar o painel.");
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
      {loading && !data.hasData ? <div className="loading"><div><div className="spinner" /><p>Carregando dados orçamentários...</p></div></div> : !data.hasData && !error ? <div className="empty-state"><div><div className="empty-icon">⇧</div><h2>Nenhum dado da LOA foi importado</h2><p>Acesse a aba Importação de Dados para carregar a planilha e começar a análise orçamentária.</p><Link className="button primary" href="/importacao">Ir para Importação de Dados</Link></div></div> : <>
        <Filters filters={filters} options={options} total={data.pagination.total} onChange={updateFilters} onClear={() => updateFilters(EMPTY_FILTERS)} />
        <section className="metric-grid" aria-label="Indicadores principais">
          <MetricCard primary label="Valor Total da LOA" value={currency.format(data.totals.loa)} note="Orçamento consolidado" />
          <MetricCard label="Valor Filtrado" value={currency.format(data.totals.filtered)} note={`${integer.format(data.pagination.total)} registros na seleção`} />
          <MetricCard label="Órgãos / Secretarias" value={integer.format(data.counts.organs)} note="Órgãos distintos" />
          <MetricCard label="Unidades Orçamentárias" value={integer.format(data.counts.units)} note="Unidades distintas" />
          <MetricCard label="Funções" value={integer.format(data.counts.functions)} note="Funções de governo" />
          <MetricCard label="Programas" value={integer.format(data.counts.programs)} note="Programas orçamentários" />
          <MetricCard label="Ações" value={integer.format(data.counts.actions)} note="Projetos e atividades" />
          <MetricCard label="Processos Administrativos" value={integer.format(data.counts.processes)} note="Processos vinculados" />
        </section>
        <ExecutiveInsights data={data} />
        <section className="charts-grid" aria-label="Gráficos orçamentários">
          <BarChart title="Orçamento por Função" subtitle="Distribuição funcional" data={data.groups.functionName} />
          <BarChart title="Orçamento por Subfunção" subtitle="Principais subfunções" data={data.groups.subfunction} />
          <BarChart title="Orçamento por Programa" subtitle="Ranking de programas" data={data.groups.program} />
          <BarChart title="Orçamento por Ação" subtitle="Ranking de ações" data={data.groups.action} />
          <BarChart title="Natureza da Despesa" subtitle="Composição da despesa" data={data.groups.expenseNature} />
          <BarChart title="Orçamento por Subelemento" subtitle="Itens mais relevantes" data={data.groups.subelement} />
        </section>
        <SummaryCards title="Resumo por Órgão / Secretaria" description="Teto e participação no orçamento consolidado" data={data.groups.organ} total={data.totals.loa} />
        <SummaryCards title="Resumo por Unidade Orçamentária" description="Principais unidades por valor orçamentário" data={data.groups.budgetUnit} total={data.totals.loa} />
        <DataTable rows={data.records} total={data.pagination.total} filteredValue={data.totals.filtered} page={data.pagination.page} pages={data.pagination.pages} search={filters.search} sort={sort} direction={direction} onSearch={(search) => updateFilters({ ...filters, search })} onSort={updateSort} onPage={setPage} />
      </>}
    </>
  );
}
