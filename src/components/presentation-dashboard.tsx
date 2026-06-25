"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { currency, percent } from "@/lib/format";
import { getPresentationRecords, groupPresentation, PRESENTATION_SECRETARIATS } from "@/lib/presentation-data";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Treemap({ items, total }: { items: { label: string; value: number }[]; total: number }) {
  const nodes = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    
    type TreemapNode = {
      label: string;
      value: number;
      x: number;
      y: number;
      w: number;
      h: number;
    };

    function layout(list: { label: string; value: number }[], x: number, y: number, w: number, h: number): TreemapNode[] {
      if (list.length === 0) return [];
      if (list.length === 1) {
        return [{ ...list[0], x, y, w, h }];
      }

      const sum = list.reduce((s, item) => s + item.value, 0);
      const first = list[0];
      const f = sum > 0 ? first.value / sum : 0;

      if (w > h) {
        const firstNode = { ...first, x, y, w: w * f, h };
        const rest = layout(list.slice(1), x + w * f, y, w * (1 - f), h);
        return [firstNode, ...rest];
      } else {
        const firstNode = { ...first, x, y, w, h: h * f };
        const rest = layout(list.slice(1), x, y + h * f, w, h * (1 - f));
        return [firstNode, ...rest];
      }
    }

    return layout(sorted, 0, 0, 100, 100);
  }, [items]);

  const colors = [
    "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    "linear-gradient(135deg, #0d9488, #14b8a6)",
    "linear-gradient(135deg, #b45309, #f59e0b)",
    "linear-gradient(135deg, #15803d, #22c55e)",
    "linear-gradient(135deg, #475569, #64748b)",
    "linear-gradient(135deg, #be123c, #f43f5e)",
    "linear-gradient(135deg, #6d28d9, #8b5cf6)",
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: 350, background: "var(--background)", borderRadius: 12, overflow: "hidden" }}>
      {nodes.map((node, index) => {
        const color = colors[index % colors.length];
        const isVerySmall = node.w < 12 || node.h < 12;
        const isExtremelySmall = node.w < 6 || node.h < 6;
        
        return (
          <div
            key={node.label}
            style={{
              position: "absolute",
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.w}%`,
              height: `${node.h}%`,
              padding: 4,
              boxSizing: "border-box",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: color,
                borderRadius: 8,
                padding: "12px 10px",
                boxSizing: "border-box",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                boxShadow: "inset 0 1px 3px rgba(255,255,255,0.2)",
              }}
              title={`${node.label}: ${compactCurrency(node.value)} (${percent.format(total ? node.value / total : 0)})`}
            >
              {!isExtremelySmall && (
                <>
                  <span style={{ fontSize: isVerySmall ? 10 : 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.2 }}>
                    {node.label}
                  </span>
                  {!isVerySmall && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: 4 }}>
                      <strong style={{ fontSize: 15, fontWeight: 800 }}>{compactCurrency(node.value)}</strong>
                      <span style={{ fontSize: 10, opacity: 0.85 }}>{percent.format(total ? node.value / total : 0)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
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
    const organs = groupPresentation(records, "secretariat");
    const topFunctions = functions.slice(0, 3);
    const others = Math.max(0, total - topFunctions.reduce((sum, item) => sum + item.value, 0));
    const totalRecords = records.length;
    return { total, operating, investment: total - operating, functions, units, programs, processes, organs, donutValues: [...topFunctions.map((item) => item.value), others], totalRecords };
  }, [secretariat, year]);

  const previousTotal = useMemo(() => getPresentationRecords(2026).filter((record) => !secretariat || record.secretariat === secretariat).reduce((sum, record) => sum + record.value, 0), [secretariat]);
  const trend = previousTotal ? summary.total / previousTotal - 1 : 0;
  const topFunctionTotal = summary.functions.slice(0, 4).reduce((sum, item) => sum + item.value, 0);
  const remainingFunctions = Math.max(0, summary.total - topFunctionTotal);
  const concentration = [...summary.functions.slice(0, 4), ...(remainingFunctions ? [{ label: "Demais funções", value: remainingFunctions }] : [])];
  const maxUnit = summary.units[0]?.value ?? 1;

  const areas = useMemo(() => {
    const records = getPresentationRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const getAreaValue = (func: string) => {
      return records
        .filter((r) => r.functionName.toLowerCase() === func.toLowerCase())
        .reduce((sum, r) => sum + r.value, 0);
    };
    
    return [
      { label: "Saúde", value: getAreaValue("Saúde") },
      { label: "Educação", value: getAreaValue("Educação") },
      { label: "Segurança", value: getAreaValue("Segurança") },
      { label: "Habitação", value: getAreaValue("Habitação") },
      { label: "Transporte", value: getAreaValue("Transporte") },
      { label: "Assistência Social", value: getAreaValue("Assistência Social") },
      { label: "Cultura", value: getAreaValue("Cultura") },
    ].sort((a, b) => b.value - a.value);
  }, [secretariat, year]);

  const programGrowth = useMemo(() => {
    const filtered2027 = getPresentationRecords(2027).filter((r) => !secretariat || r.secretariat === secretariat);
    const filtered2026 = getPresentationRecords(2026).filter((r) => !secretariat || r.secretariat === secretariat);
    
    const prog2027 = groupPresentation(filtered2027, "program");
    const prog2026 = groupPresentation(filtered2026, "program");
    
    return prog2027.map((p27) => {
      const p26 = prog2026.find((x) => x.label === p27.label);
      const val26 = p26 ? p26.value : 0;
      const diff = p27.value - val26;
      const percentGrowth = val26 ? (diff / val26) : 0;
      return { label: p27.label, current: p27.value, diff, percentGrowth };
    }).sort((a, b) => b.percentGrowth - a.percentGrowth);
  }, [secretariat]);

  const topInvestmentProgram = useMemo(() => {
    const records = getPresentationRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const investmentRecords = records.filter((r) => r.category === "investment");
    const grouped = groupPresentation(investmentRecords, "program");
    return grouped[0] || null;
  }, [secretariat, year]);

  const topOperatingProgram = useMemo(() => {
    const records = getPresentationRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const operatingRecords = records.filter((r) => r.category === "operating");
    const grouped = groupPresentation(operatingRecords, "program");
    return grouped[0] || null;
  }, [secretariat, year]);

  const deliveries = useMemo(() => {
    const records = getPresentationRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const getDeliveryValue = (proc: string) => {
      return records
        .filter((r) => r.process.toLowerCase() === proc.toLowerCase())
        .reduce((sum, r) => sum + r.value, 0);
    };
    
    return [
      { label: "Construção de UBS", value: getDeliveryValue("Construção de UBS") },
      { label: "Pavimentação", value: getDeliveryValue("Pavimentação") },
      { label: "Merenda Escolar", value: getDeliveryValue("Merenda Escolar") },
      { label: "Transporte Escolar", value: getDeliveryValue("Transporte Escolar") },
      { label: "Iluminação Pública", value: getDeliveryValue("Iluminação Pública") },
    ].sort((a, b) => b.value - a.value);
  }, [secretariat, year]);


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
          <article className="presentation-card presentation-concentration">
            <h2>Onde está concentrado o dinheiro do município?</h2>
            <div>
              {concentration.map((item, index) => {
                const barColors = ["#1e3a8a", "#0d9488", "#b45309", "#15803d", "#475569"];
                const color = barColors[index % barColors.length];
                return (
                  <div className="presentation-mini-bar" key={item.label}>
                    <p>
                      <span style={{ color: color, fontWeight: 700 }}>{item.label}</span>
                      <strong>{percent.format(summary.total ? item.value / summary.total : 0)}</strong>
                    </p>
                    <div>
                      <span style={{ width: `${summary.total ? (item.value / summary.total) * 100 : 0}%`, background: color, opacity: 1 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="insight-grid" aria-label="Perguntas executivas">
          <article className="insight-card">
            <span className="insight-number">01</span>
            <h2>Onde estão os maiores contratos e processos?</h2>
            <p className="insight-label">Maior processo administrativo</p>
            <strong className="insight-value">{currency.format(summary.processes[0]?.value ?? 0)}</strong>
            <p className="insight-name">{summary.processes[0]?.label || "Não informado"}</p>
          </article>
          <article className="insight-card">
            <span className="insight-number">02</span>
            <h2>Onde está concentrado o orçamento?</h2>
            <p className="insight-label">Órgão com maior participação</p>
            <strong className="insight-value">{currency.format(summary.organs[0]?.value ?? 0)}</strong>
            <p className="insight-name">{summary.organs[0]?.label || "Não informado"}</p>
            <span className="insight-share">{percent.format(summary.total ? (summary.organs[0]?.value ?? 0) / summary.total : 0)} do valor filtrado</span>
          </article>
          <article className="insight-card">
            <span className="insight-number">03</span>
            <h2>Quanto está reservado para custeio e investimento?</h2>
            <div className="spending-values">
              <div>
                <p className="insight-label">Custeio / correntes</p>
                <strong>{currency.format(summary.operating)}</strong>
                <span>{percent.format(summary.total ? summary.operating / summary.total : 0)}</span>
              </div>
              <div>
                <p className="insight-label">Investimento / capital</p>
                <strong>{currency.format(summary.investment)}</strong>
                <span>{percent.format(summary.total ? summary.investment / summary.total : 0)}</span>
              </div>
            </div>
          </article>
          <article className="insight-card" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
            <span className="insight-number">04</span>
            <h2>O que a LOA Financia</h2>
            <p className="insight-label" style={{ marginBottom: 12 }}>A LOA {year} financiará:</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--navy)", lineHeight: 1.4 }}>
                <span style={{ color: "var(--green)", fontWeight: 800 }}>✔</span>
                <span><strong>154</strong> programas públicos</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--navy)", lineHeight: 1.4 }}>
                <span style={{ color: "var(--green)", fontWeight: 800 }}>✔</span>
                <span><strong>382</strong> ações governamentais</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--navy)", lineHeight: 1.4 }}>
                <span style={{ color: "var(--green)", fontWeight: 800 }}>✔</span>
                <span><strong>24</strong> secretarias municipais</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--navy)", lineHeight: 1.4 }}>
                <span style={{ color: "var(--green)", fontWeight: 800 }}>✔</span>
                <span>mais de <strong>1.200</strong> processos administrativos</span>
              </li>
            </ul>
          </article>
        </section>

        {/* NEW: Quais áreas, programas e entregas */}
        <section className="presentation-strategy-grid" aria-label="Perguntas estratégicas">
          <article className="presentation-card">
            <h2>Quais áreas da cidade são prioridade?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {areas.map((area, index) => (
                <div key={area.label} className="presentation-mini-bar">
                  <p style={{ display: "flex", justifyContent: "space-between", margin: 0, fontSize: 13 }}>
                    <span>{area.label}</span>
                    <strong>{compactCurrency(area.value)}</strong>
                  </p>
                  <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
                    <span style={{ 
                      display: "block",
                      height: "100%",
                      background: "var(--blue)",
                      width: `${summary.total ? (area.value / summary.total) * 100 : 0}%`,
                      opacity: 1 - index * 0.1
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="presentation-card">
            <h2>Quais programas são estratégicos para o governo?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              <div>
                <p className="insight-label" style={{ margin: 0 }}>Maior Programa</p>
                <strong style={{ fontSize: 18, color: "var(--navy)" }}>{compactCurrency(summary.programs[0]?.value ?? 0)}</strong>
                <p className="insight-name" style={{ margin: "2px 0 0", fontSize: 13 }}>{summary.programs[0]?.label || "Não informado"}</p>
              </div>
              <div>
                <p className="insight-label" style={{ margin: 0 }}>Maior Crescimento (2026 → 2027)</p>
                <strong style={{ fontSize: 18, color: "var(--navy)" }}>
                  {compactCurrency(programGrowth[0]?.current ?? 0)} 
                  <span style={{ fontSize: 13, color: "var(--green-dark)", marginLeft: 6 }}>
                    (+{percent.format(programGrowth[0]?.percentGrowth ?? 0)})
                  </span>
                </strong>
                <p className="insight-name" style={{ margin: "2px 0 0", fontSize: 13 }}>{programGrowth[0]?.label || "Não informado"}</p>
              </div>
              <div>
                <p className="insight-label" style={{ margin: 0 }}>Maior Investimento</p>
                <strong style={{ fontSize: 18, color: "var(--navy)" }}>{compactCurrency(topInvestmentProgram?.value ?? 0)}</strong>
                <p className="insight-name" style={{ margin: "2px 0 0", fontSize: 13 }}>{topInvestmentProgram?.label || "Não informado"}</p>
              </div>
              <div>
                <p className="insight-label" style={{ margin: 0 }}>Maior Custeio</p>
                <strong style={{ fontSize: 18, color: "var(--navy)" }}>{compactCurrency(topOperatingProgram?.value ?? 0)}</strong>
                <p className="insight-name" style={{ margin: "2px 0 0", fontSize: 13 }}>{topOperatingProgram?.label || "Não informado"}</p>
              </div>
            </div>
          </article>
          <article className="presentation-card">
            <h2>Quais entregas o governo pretende realizar?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
              {deliveries.map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "var(--navy)", display: "block" }}>{item.label}</strong>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Processo finalístico</span>
                  </div>
                  <strong style={{ fontSize: 16, color: "var(--blue)" }}>{compactCurrency(item.value)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="presentation-charts">
          <article className="presentation-card presentation-treemap-card">
            <div className="presentation-card-head" style={{ marginBottom: 16 }}>
              <div>
                <p>Mapa de Concentração</p>
                <h2>Distribuição por Órgão (Treemap)</h2>
              </div>
              <span>{year}</span>
            </div>
            <Treemap items={summary.organs} total={summary.total} />
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, margin: "12px 0 0" }}>
              Cada Secretaria ocupa um espaço proporcional ao seu orçamento na LOA.
            </p>
          </article>
          <article className="presentation-card presentation-units"><div className="presentation-card-head"><div><p>Ranking executivo</p><h2>Top Unidades por Valor</h2></div><Link href="/unidades">Ver tudo →</Link></div><div className="presentation-unit-list">{summary.units.slice(0, 5).map((item, index) => <div key={item.label}><p><span>{item.label}</span><strong>{compactCurrency(item.value)}</strong></p><div><span style={{ width: `${(item.value / maxUnit) * 100}%`, opacity: 1 - index * .13 }} /></div></div>)}</div></article>
        </section>
      </main>
    </div>
  );
}
