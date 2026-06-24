"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { percent } from "@/lib/format";
import { getPresentationRecords, groupPresentation, PRESENTATION_SECRETARIATS } from "@/lib/presentation-data";

const CHART_COLORS = ["#1978e5", "#5a9bea", "#91bced", "#d8e4ef"];

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function createDonutBackground(values: number[], total: number) {
  let cursor = 0;
  const segments = values.map((value, index) => {
    const start = cursor;
    cursor += total ? (value / total) * 100 : 0;
    return `${CHART_COLORS[index]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${segments.join(", ")})`;
}

export function PresentationDashboard() {
  const [year, setYear] = useState<2026 | 2027>(2027);
  const [secretariat, setSecretariat] = useState("");
  const summary = useMemo(() => {
    const records = getPresentationRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const total = records.reduce((sum, record) => sum + record.value, 0);
    const operating = records.filter((record) => record.category === "operating").reduce((sum, record) => sum + record.value, 0);
    const functions = groupPresentation(records, "functionName");
    const units = groupPresentation(records, "unit");
    const programs = groupPresentation(records, "program");
    const processes = groupPresentation(records, "process");
    const topFunctions = functions.slice(0, 3);
    const others = Math.max(0, total - topFunctions.reduce((sum, item) => sum + item.value, 0));
    const totalRecords = records.length;
    return { total, operating, investment: total - operating, functions, units, programs, processes, donutValues: [...topFunctions.map((item) => item.value), others], totalRecords };
  }, [secretariat, year]);

  const previousTotal = useMemo(() => getPresentationRecords(2026).filter((record) => !secretariat || record.secretariat === secretariat).reduce((sum, record) => sum + record.value, 0), [secretariat]);
  const trend = previousTotal ? summary.total / previousTotal - 1 : 0;
  const topFunctionTotal = summary.functions.slice(0, 4).reduce((sum, item) => sum + item.value, 0);
  const remainingFunctions = Math.max(0, summary.total - topFunctionTotal);
  const concentration = [...summary.functions.slice(0, 4), ...(remainingFunctions ? [{ label: "Demais funções", value: remainingFunctions }] : [])];
  const donutLegend = [...summary.functions.slice(0, 3), { label: "Outros", value: summary.donutValues[3] }];
  const maxUnit = summary.units[0]?.value ?? 1;
  const maxProcess = summary.processes[0]?.value ?? 1;

  return (
    <div className="presentation-shell">
      <a className="skip-link" href="#presentation-content">Pular para o conteúdo</a>
      <aside className="presentation-sidebar" aria-label="Filtros da apresentação">
        <div className="presentation-brand"><div><span>LOA</span><small>Painel Executivo</small></div><Link href="/" title="Voltar ao sistema" aria-label="Voltar ao sistema">←</Link></div>
        <div className="presentation-sidebar-body">
          <nav className="presentation-nav"><span className="active"><b aria-hidden="true">▦</b> Dashboard Executivo</span><Link href="/"><b aria-hidden="true">◫</b> Painel Analítico</Link><Link href="/relatorios"><b aria-hidden="true">▥</b> Relatórios</Link></nav>
          <section className="presentation-filters">
            <div className="presentation-filter-title"><span>Filtros</span><button onClick={() => { setSecretariat(""); setYear(2027); }}>Limpar</button></div>
            <label htmlFor="presentation-secretariat">Secretaria</label>
            <select id="presentation-secretariat" value={secretariat} onChange={(event) => setSecretariat(event.target.value)}><option value="">Todas as Secretarias</option>{PRESENTATION_SECRETARIATS.map((item) => <option key={item}>{item}</option>)}</select>
            <fieldset><legend>Exercício</legend><div className="presentation-years"><button aria-pressed={year === 2027} className={year === 2027 ? "active" : ""} onClick={() => setYear(2027)}>2027</button><button aria-pressed={year === 2026} className={year === 2026 ? "active" : ""} onClick={() => setYear(2026)}>2026</button></div></fieldset>
          </section>
          <div className="presentation-context"><span>Apresentando</span><strong>{secretariat || "Visão consolidada do Município"}</strong><small>Exercício {year} · Dados demonstrativos</small></div>
        </div>
        <div className="presentation-sidebar-footer"><div>AP</div><p><strong>Modo Apresentação</strong><span>Visão executiva</span></p></div>
      </aside>

      <main className="presentation-main" id="presentation-content">
        <header className="presentation-header"><div><p>Painel de decisão</p><h1>Dashboard Executivo da LOA</h1><span>Visão sintética do orçamento municipal e dos programas prioritários.</span></div><div className="presentation-header-actions"><span>Exercício {year}</span><button onClick={() => void document.documentElement.requestFullscreen?.()}>⛶ Tela cheia</button></div></header>

        <section className="presentation-hero-grid" aria-label="Indicadores executivos">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <article className="presentation-total-card"><p>Valor Total da LOA</p><strong>{compactCurrency(summary.total)}</strong><span>{year === 2027 ? `${trend >= 0 ? "+" : ""}${percent.format(trend)} em relação a 2026` : "Base demonstrativa do exercício 2026"}</span></article>
            <Link href="/transparente" className="presentation-card presentation-transparency-card" style={{ textDecoration: "none" }}>
              <p>Portal de Transparência</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>LOA Transparente</h2>
                <span style={{ fontSize: 20, color: "var(--blue)" }}>↗</span>
              </div>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Acesse o portal da transparência pública para os cidadãos.
              </p>
            </Link>
          </div>
          <article className="presentation-card presentation-concentration"><h2>Onde está concentrado o dinheiro do município?</h2><div>{concentration.map((item, index) => <div className="presentation-mini-bar" key={item.label}><p><span>{item.label}</span><strong>{percent.format(summary.total ? item.value / summary.total : 0)}</strong></p><div><span style={{ width: `${summary.total ? (item.value / summary.total) * 100 : 0}%`, opacity: 1 - index * .14 }} /></div></div>)}</div></article>
        </section>

        <section className="presentation-charts">
          <article className="presentation-card presentation-donut-card"><div className="presentation-card-head"><div><p>Composição</p><h2>Distribuição Orçamentária</h2></div><span>{year}</span></div><div className="presentation-donut" style={{ background: createDonutBackground(summary.donutValues, summary.total) }}><div><small>Total</small><strong>{compactCurrency(summary.total)}</strong></div></div><div className="presentation-legend">{donutLegend.map((item, index) => <div key={item.label}><i style={{ background: CHART_COLORS[index] }} /><p><strong>{item.label}</strong><span>{percent.format(summary.total ? item.value / summary.total : 0)} do total</span></p></div>)}</div></article>
          <article className="presentation-card presentation-units"><div className="presentation-card-head"><div><p>Ranking executivo</p><h2>Top Unidades por Valor</h2></div><Link href="/unidades">Ver tudo →</Link></div><div className="presentation-unit-list">{summary.units.slice(0, 5).map((item, index) => <div key={item.label}><p><span>{item.label}</span><strong>{compactCurrency(item.value)}</strong></p><div><span style={{ width: `${(item.value / maxUnit) * 100}%`, opacity: 1 - index * .13 }} /></div></div>)}</div></article>
        </section>

        <section className="presentation-questions" aria-label="Perguntas executivas">
          <article className="presentation-card"><h2>Onde estão os maiores contratos e processos?</h2><div className="presentation-ranked-list">{summary.processes.slice(0, 3).map((item, index) => <div key={item.label}><p><span>{item.label}</span><strong>{compactCurrency(item.value)}</strong></p><div><span style={{ width: `${(item.value / maxProcess) * 100}%`, opacity: 1 - index * .2 }} /></div></div>)}</div></article>
          <article className="presentation-card"><h2>Onde está concentrado o orçamento?</h2><div className="presentation-highlight"><span>Principal função</span><strong>{summary.functions[0]?.label ?? "—"}</strong><b>{percent.format(summary.total ? (summary.functions[0]?.value ?? 0) / summary.total : 0)}</b></div><div className="presentation-share-track"><span style={{ width: `${summary.total ? ((summary.functions[0]?.value ?? 0) / summary.total) * 100 : 0}%` }} /></div></article>
          <article className="presentation-card"><h2>Quanto está reservado para custeio e investimento?</h2><div className="presentation-split"><div><p><span>Custeio</span><strong>{compactCurrency(summary.operating)}</strong></p><div><span style={{ width: `${summary.total ? (summary.operating / summary.total) * 100 : 0}%` }} /></div></div><div><p><span>Investimento</span><strong>{compactCurrency(summary.investment)}</strong></p><div><span style={{ width: `${summary.total ? (summary.investment / summary.total) * 100 : 0}%` }} /></div></div></div></article>
          <article className="presentation-card"><h2>Quais programas consomem mais recursos?</h2><ol className="presentation-programs">{summary.programs.slice(0, 3).map((item, index) => <li key={item.label}><b>{index + 1}</b><span>{item.label}</span><strong>{compactCurrency(item.value)}</strong></li>)}</ol></article>
        </section>
      </main>
    </div>
  );
}
