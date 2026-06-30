"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currency, percent } from "@/lib/format";
import { getPresentationRecords, groupPresentation, PRESENTATION_SECRETARIATS, type PresentationRecord } from "@/lib/presentation-data";
import { getPrimaryPageLinks } from "@/lib/page-navigation";
import { useDataSource, DataSourceToggle } from "./data-source-toggle";
import type { DashboardData, BudgetRow } from "@/types/loa";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function cleanBudgetLabel(label: string) {
  return label
    .replace(/^\d{2}\.\d{2}\.\d{3}\.\d{2}\s*-\s*/i, "")
    .replace(/=$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function share(value: number, total: number) {
  return total ? percent.format(value / total) : "0%";
}

function Treemap({ items, total }: { items: { label: string; value: number }[]; total: number }) {
  const nodes = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, 6);

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
      if (list.length === 1) return [{ ...list[0], x, y, w, h }];

      const sum = list.reduce((acc, item) => acc + item.value, 0);
      const first = list[0];
      const ratio = sum > 0 ? first.value / sum : 0;

      if (w > h) {
        const firstNode = { ...first, x, y, w: w * ratio, h };
        return [firstNode, ...layout(list.slice(1), x + w * ratio, y, w * (1 - ratio), h)];
      }

      const firstNode = { ...first, x, y, w, h: h * ratio };
      return [firstNode, ...layout(list.slice(1), x, y + h * ratio, w, h * (1 - ratio))];
    }

    return layout(sorted, 0, 0, 100, 100);
  }, [items]);

  return (
    <div className="exec-treemap" aria-label="Mapa de valor por secretaria">
      {nodes.map((node, index) => (
        <div
          className="exec-treemap-node"
          key={node.label}
          style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${node.w}%`, height: `${node.h}%` }}
          title={`${cleanBudgetLabel(node.label)}: ${compactCurrency(node.value)} (${share(node.value, total)})`}
        >
          <div data-rank={index + 1}>
            <span>{cleanBudgetLabel(node.label)}</span>
            <strong>{compactCurrency(node.value)}</strong>
            <small>{share(node.value, total)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function NavIcon({ children }: { children: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

export function PresentationDashboard() {
  const [year, setYear] = useState<2026 | 2027>(2027);
  const [secretariat, setSecretariat] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataSource] = useDataSource();
  const [dbData, setDbData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (dataSource === "real" && !dbData) {
      fetch("/api/loa?all=true")
        .then((res) => res.json())
        .then((res) => setDbData(res))
        .catch(console.error);
    }
  }, [dataSource, dbData]);

  const realRecords = useMemo((): PresentationRecord[] => {
    if (!dbData?.records) return [];
    return dbData.records.map((record: BudgetRow) => {
      const isOperating = record.expenseNature.startsWith("3") || record.subelement === "33";
      let nature: PresentationRecord["nature"] = "Custeio";
      if (record.expenseNature.startsWith("3.1")) nature = "Pessoal";
      else if (record.expenseNature.startsWith("3.3")) nature = "Custeio";
      else if (record.expenseNature.startsWith("4.4")) nature = "Investimentos";
      else if (record.expenseNature.startsWith("4.6")) nature = "Amortização";
      else if (!isOperating) nature = "Investimentos";

      return {
        secretariat: record.organ,
        unit: record.budgetUnit,
        functionName: record.functionName,
        program: record.program,
        process: record.administrativeProcess,
        category: isOperating ? "operating" : "investment",
        nature,
        value: record.value,
      };
    });
  }, [dbData]);

  const getCurrentRecords = useMemo(() => {
    return (selectedYear: 2026 | 2027): PresentationRecord[] => {
      if (dataSource === "ficticio") return getPresentationRecords(selectedYear);
      if (selectedYear === 2027) return realRecords;
      return realRecords.map((record, index) => ({ ...record, value: Math.round(record.value * (0.88 + (index % 4) * 0.01)) }));
    };
  }, [dataSource, realRecords]);

  const summary = useMemo(() => {
    const records = getCurrentRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const total = records.reduce((sum, record) => sum + record.value, 0);
    const operating = records.filter((record) => record.category === "operating").reduce((sum, record) => sum + record.value, 0);
    const functions = groupPresentation(records, "functionName");
    const units = groupPresentation(records, "unit");
    const programs = groupPresentation(records, "program");
    const processes = groupPresentation(records, "process");
    const organs = groupPresentation(records, "secretariat");
    return {
      total,
      operating,
      investment: total - operating,
      functions,
      units,
      programs,
      processes,
      organs,
      totalRecords: records.length,
      secretariatCount: new Set(records.map((record) => record.secretariat)).size,
      unitCount: new Set(records.map((record) => record.unit)).size,
      programCount: new Set(records.map((record) => record.program)).size,
      processCount: new Set(records.map((record) => record.process)).size,
      natureTotals: records.reduce<Record<PresentationRecord["nature"], number>>(
        (acc, record) => {
          acc[record.nature] += record.value;
          return acc;
        },
        { Pessoal: 0, Custeio: 0, Investimentos: 0, Amortização: 0 },
      ),
    };
  }, [secretariat, year, getCurrentRecords]);

  const previousTotal = useMemo(() => {
    return getCurrentRecords(2026)
      .filter((record) => !secretariat || record.secretariat === secretariat)
      .reduce((sum, record) => sum + record.value, 0);
  }, [secretariat, getCurrentRecords]);

  const trend = previousTotal ? summary.total / previousTotal - 1 : 0;
  const topFiveShare = summary.total ? summary.organs.slice(0, 5).reduce((sum, item) => sum + item.value, 0) / summary.total : 0;
  const ownRevenue = summary.total * 0.41;
  const transfers = summary.total * 0.53;
  const capitalRevenue = Math.max(0, summary.total - ownRevenue - transfers);
  const investmentShare = summary.total ? summary.investment / summary.total : 0;
  const perCapita = summary.total / 723_500;
  const maxFunction = summary.functions[0]?.value ?? 1;
  const maxUnit = summary.units[0]?.value ?? 1;

  const areas = summary.functions.slice(0, 6);
  const topProgram = summary.programs[0];
  const topProcess = summary.processes[0];
  const topInvestment = summary.programs.find((program) => program.label.toLowerCase().includes("obra")) ?? summary.programs[1] ?? summary.programs[0];
  const primaryLinks = getPrimaryPageLinks("apresentacao");

  return (
    <div className="exec-shell">
      <a className="skip-link" href="#presentation-content">Pular para o conteúdo</a>

      <nav className="exec-topbar" aria-label="Navegação do painel executivo">
        <Link href="/" className="exec-brand-link" aria-label="Página inicial da Prefeitura de Osasco">
          <img src="/brasao.png" alt="Brasão da Prefeitura de Osasco" className="exec-brand-logo" />
        </Link>
        <div className="exec-topbar-links">
          {primaryLinks.map((link) => (
            <Link key={link.key} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="exec-topbar-actions">
          <button
            type="button"
            className="exec-sidebar-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <NavIcon>{sidebarCollapsed ? "menu_open" : "menu"}</NavIcon>
          </button>
          <div className="exec-search">
            <NavIcon>search</NavIcon>
            <input name="presentation-search" autoComplete="off" placeholder="Buscar dado…" aria-label="Buscar dado" />
          </div>
          <button type="button" aria-label="Notificações"><NavIcon>notifications</NavIcon></button>
          <button type="button" aria-label="Configurações"><NavIcon>settings</NavIcon></button>
          <div className="exec-avatar" aria-label="Gestor municipal">LOA</div>
        </div>
      </nav>

      <aside className={`exec-sidebar${sidebarCollapsed ? " collapsed" : ""}`} aria-label="Menu executivo">
        <nav className="exec-side-nav">
          <Link href="/" className="exec-side-link"><NavIcon>dashboard</NavIcon><span className="exec-link-label">Visão Geral</span></Link>
          <span className="exec-side-link active"><NavIcon>payments</NavIcon><span className="exec-link-label">Receitas</span></span>
          <span className="exec-side-link"><NavIcon>account_balance_wallet</NavIcon><span className="exec-link-label">Despesas</span></span>
          <div className="exec-side-group">
            <div className="exec-side-link">
              <NavIcon>corporate_fare</NavIcon>
              <span className="exec-link-label">Secretarias</span>
              <NavIcon>expand_more</NavIcon>
            </div>
            <div className="exec-side-search">
              <NavIcon>search</NavIcon>
              <input name="presentation-secretariat-search" autoComplete="off" placeholder="Filtrar…" aria-label="Filtrar secretarias" />
            </div>
            <select name="presentation-secretariat" value={secretariat} onChange={(event) => setSecretariat(event.target.value)} aria-label="Filtrar por secretaria">
              <option value="">Todas as Secretarias</option>
              {PRESENTATION_SECRETARIATS.map((item) => <option key={item} value={item}>{cleanBudgetLabel(item)}</option>)}
            </select>
          </div>
          <div className="exec-side-group">
            <div className="exec-side-link">
              <NavIcon>account_balance</NavIcon>
              <span className="exec-link-label">Unidades Orçamentárias</span>
              <NavIcon>expand_more</NavIcon>
            </div>
            <div className="exec-side-search">
              <NavIcon>search</NavIcon>
              <input name="presentation-unit-search" autoComplete="off" placeholder="Filtrar…" aria-label="Filtrar unidades orçamentárias" />
            </div>
            <div className="exec-side-list">
              {summary.units.slice(0, 3).map((unit) => <span key={unit.label}>{cleanBudgetLabel(unit.label)}</span>)}
            </div>
          </div>
          <span className="exec-side-link"><NavIcon>star</NavIcon><span className="exec-link-label">Prioridades</span></span>
          <span className="exec-side-link"><NavIcon>query_stats</NavIcon><span className="exec-link-label">Insights</span></span>
          <span className="exec-side-link"><NavIcon>chat</NavIcon><span className="exec-link-label">Pergunte ao Orçamento</span></span>
        </nav>

        <div className="exec-side-footer">
          <button type="button">
            <NavIcon>article</NavIcon>
            <span className="exec-link-label">Relatório Mensal</span>
          </button>
          <Link href="/transparente"><NavIcon>help</NavIcon><span className="exec-link-label">Suporte</span></Link>
          <Link href="/"><NavIcon>logout</NavIcon><span className="exec-link-label">Sair</span></Link>
        </div>
      </aside>

      <main className={`exec-main${sidebarCollapsed ? " collapsed" : ""}`} id="presentation-content">
        <header className="exec-header">
          <div>
            <div className="exec-title">Painel Executivo da LOA</div>
            <p>Sala de Situação do Prefeito — Visão Consolidada de Recursos</p>
          </div>
          <div className="exec-header-actions">
            <DataSourceToggle />
            <div className="exec-year-toggle" aria-label="Selecionar exercício">
              <NavIcon>calendar_month</NavIcon>
              <button className={year === 2027 ? "active" : ""} type="button" onClick={() => setYear(2027)}>LOA 2027</button>
              <button className={year === 2026 ? "active" : ""} type="button" onClick={() => setYear(2026)}>LOA 2026</button>
            </div>
            <button type="button">
              <NavIcon>filter_alt</NavIcon>
              Filtros
            </button>
            <button type="button" onClick={() => { setSecretariat(""); setYear(2027); }}>
              Atualizar Dados
            </button>
          </div>
        </header>

        <section className="exec-kpi-grid" aria-label="Panorama geral">
          <article className="exec-kpi-main">
            <NavIcon>account_balance</NavIcon>
            <p>Orçamento Total (LOA)</p>
            <strong>{compactCurrency(summary.total)}</strong>
            <span><NavIcon>trending_up</NavIcon>{trend >= 0 ? "+" : ""}{percent.format(trend)} vs Ano Anterior</span>
          </article>
          <article className="exec-kpi-card">
            <div><p>Receita vs Despesa</p><NavIcon>check_circle</NavIcon></div>
            <strong>Equilibrado</strong>
            <span>Superávit Projetado: R$ 12M</span>
            <div className="exec-track"><i style={{ width: "100%" }} /></div>
          </article>
          <article className="exec-kpi-card">
            <div><p>Investimento / Hab.</p><NavIcon>person_pin_circle</NavIcon></div>
            <strong>{currency.format(perCapita)}</strong>
            <span>População: 723.500 hab.</span>
            <div className="exec-segments"><i /><i /><i /><i className="muted" /></div>
          </article>
          <article className="exec-mini-grid">
            <div><span>Secretarias</span><strong>{summary.secretariatCount}</strong></div>
            <div><span>Programas</span><strong>{summary.programCount}</strong></div>
            <div><span>Ações</span><strong>{summary.unitCount}</strong></div>
            <div><span>Processos</span><strong>{summary.processCount}</strong></div>
          </article>
        </section>

        <section className="exec-money-grid" id="exec-alerts" aria-label="Receitas e despesas">
          <article className="exec-panel">
            <div className="exec-panel-head">
              <div><NavIcon>arrow_downward</NavIcon><strong>De onde vem o dinheiro</strong></div>
              <span>Fontes {year}</span>
            </div>
            <div className="exec-two-cards">
              <div className="success"><span>Receita própria</span><strong>{compactCurrency(ownRevenue)}</strong><small>IPTU, ISS, taxas e serviços</small></div>
              <div className="info"><span>Transferências</span><strong>{compactCurrency(transfers)}</strong><small>FPM, ICMS, SUS e FUNDEB</small></div>
            </div>
            <div className="exec-alert">
              <NavIcon>warning</NavIcon>
              <div>
                <strong>Alerta estratégico: dependência externa</strong>
                <p>Transferências representam {share(transfers, summary.total)} do orçamento. A leitura executiva recomenda acompanhar arrecadação própria.</p>
              </div>
            </div>
            <div className="exec-donut-row">
              <div className="exec-donut" style={{ background: `conic-gradient(#2563eb 0 ${share(ownRevenue, summary.total)}, #0f766e ${share(ownRevenue, summary.total)} ${share(ownRevenue + transfers, summary.total)}, #d1d5db 0)` }}>
                <strong>{share(ownRevenue, summary.total)}</strong>
              </div>
              <div className="exec-quote">
                <p>O município mantém {share(ownRevenue, summary.total)} de receita própria e concentra a decisão em prioridades de impacto.</p>
                <div><i className="own" />Própria <i className="transfer" />Transferências <i />Capital/outros {compactCurrency(capitalRevenue)}</div>
              </div>
            </div>
          </article>

          <article className="exec-panel">
            <div className="exec-panel-head danger">
              <div><NavIcon>arrow_upward</NavIcon><strong>Para onde vai o dinheiro</strong></div>
              <span>Aplicação {year}</span>
            </div>
            <div className="exec-expense-grid">
              <div><span>Pessoal</span><strong>{compactCurrency(summary.natureTotals.Pessoal)}</strong></div>
              <div><span>Custeio</span><strong>{compactCurrency(summary.natureTotals.Custeio)}</strong></div>
              <div><span>Dívida</span><strong>{compactCurrency(summary.natureTotals.Amortização)}</strong></div>
              <div className="featured"><span>Investimento</span><strong>{compactCurrency(summary.natureTotals.Investimentos)}</strong></div>
            </div>
            <div className="exec-investment-callout">
              <div><NavIcon>trending_up</NavIcon></div>
              <p>Índice de investimento</p>
              <strong>{percent.format(investmentShare)} <span>da Receita Líquida</span></strong>
            </div>
            <div className="exec-split">
              <p><span>Manutenção da máquina</span><strong>{share(summary.operating, summary.total)}</strong></p>
              <div><i style={{ width: `${summary.total ? (summary.operating / summary.total) * 100 : 0}%` }} /></div>
              <p><span>Obras e novos projetos</span><strong>{share(summary.investment, summary.total)}</strong></p>
              <div><i className="accent" style={{ width: `${investmentShare * 100}%` }} /></div>
            </div>
          </article>
        </section>

        <section className="exec-priorities" aria-label="Prioridades de governo">
          <div className="exec-section-title"><NavIcon>dashboard_customize</NavIcon>Prioridades de Governo</div>
          <div className="exec-priority-grid">
            <article className="exec-panel exec-treemap-panel">
              <div className="exec-panel-head">
                <div><strong>Alocação por Secretaria (Mapa de Valor)</strong></div>
                <span>{share(topFiveShare, 1)} no top 5</span>
              </div>
              <Treemap items={summary.organs} total={summary.total} />
              <p className="exec-note">As maiores secretarias ocupam espaço proporcional à participação na LOA filtrada.</p>
            </article>

            <div className="exec-ranking-stack">
              <article className="exec-panel">
                <div className="exec-panel-head compact">
                  <div><NavIcon>hotel_class</NavIcon><strong>Top Rankings {year}</strong></div>
                </div>
                <div className="exec-ranking-list">
                  <div><b>1</b><p><span>Maior programa</span><strong>{cleanBudgetLabel(topProgram?.label ?? "Não informado")}</strong></p></div>
                  <div><b>2</b><p><span>Maior processo</span><strong>{cleanBudgetLabel(topProcess?.label ?? "Não informado")}</strong></p></div>
                  <div><b>3</b><p><span>Maior investimento</span><strong>{cleanBudgetLabel(topInvestment?.label ?? "Não informado")}</strong></p></div>
                </div>
              </article>

              <article className="exec-summary-card">
                <NavIcon>insights</NavIcon>
                <strong>Resumo Executivo</strong>
                <div>
                  <p><span>Custeio</span><b>{share(summary.operating, summary.total)}</b></p>
                  <p><span>Investimento</span><b>{share(summary.investment, summary.total)}</b></p>
                  <p><span>Top 5</span><b>{percent.format(topFiveShare)}</b></p>
                  <p><span>Ponto crítico</span><b>{cleanBudgetLabel(summary.functions[0]?.label ?? "N/A")}</b></p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="exec-insights-grid" aria-label="Insights estratégicos">
          <article className="exec-panel exec-ai-panel">
            <div className="exec-panel-head compact">
              <div><NavIcon>auto_awesome</NavIcon><strong>O que merece atenção</strong></div>
            </div>
            <div className="exec-ai-list">
              <p><i />{cleanBudgetLabel(summary.organs[0]?.label ?? "A maior secretaria")} concentra <strong>{share(summary.organs[0]?.value ?? 0, summary.total)}</strong> do orçamento filtrado.</p>
              <p><i className="warn" />O maior programa é <strong>{cleanBudgetLabel(topProgram?.label ?? "não informado")}</strong>, com {compactCurrency(topProgram?.value ?? 0)}.</p>
              <p><i className="ok" />Investimentos somam <strong>{compactCurrency(summary.investment)}</strong>, o equivalente a {share(summary.investment, summary.total)} da LOA.</p>
              <p><i className="risk" />Acompanhar <strong>{cleanBudgetLabel(summary.functions[0]?.label ?? "função principal")}</strong> por representar o maior bloco funcional.</p>
            </div>
          </article>

          <article className="exec-panel exec-question-panel">
            <div className="exec-panel-head compact">
              <div><NavIcon>forum</NavIcon><strong>Pergunte ao Orçamento</strong></div>
            </div>
            <p>Acesso rápido aos dados consolidados para tomada de decisão imediata.</p>
            <div className="exec-question-list">
              {[
                "Quanto será investido em Saúde?",
                "Qual secretaria recebe mais recursos?",
                "Quanto será investido em obras?",
                "Quanto vai para Educação?",
              ].map((question) => (
                <button type="button" key={question}>{question}<NavIcon>arrow_forward</NavIcon></button>
              ))}
            </div>
            <div className="exec-question-input">
              <input name="presentation-question" autoComplete="off" placeholder="Digite sua pergunta…" aria-label="Digite sua pergunta" />
              <button type="button" aria-label="Enviar pergunta"><NavIcon>send</NavIcon></button>
            </div>
          </article>
        </section>

        <section className="exec-bottom-metrics" aria-label="Indicadores estratégicos">
          <div><span>Concentração orçamentária</span><strong>{percent.format(topFiveShare)}</strong><p>Top 5 secretarias</p></div>
          <div><span>Índice de investimento</span><strong>{share(summary.investment, summary.total)}</strong><p>Percentual da LOA</p></div>
          <div><span>Receita própria</span><strong>{share(ownRevenue, summary.total)}</strong><p>Capacidade de arrecadação direta</p></div>
          <div><span>Dependência externa</span><strong>{share(transfers, summary.total)}</strong><p>Participação de repasses</p></div>
        </section>

        <section className="exec-function-list" aria-label="Ranking por função">
          {areas.map((area) => (
            <div key={area.label}>
              <p><span>{area.label}</span><strong>{compactCurrency(area.value)}</strong></p>
              <div><i style={{ width: `${maxFunction ? (area.value / maxFunction) * 100 : 0}%` }} /></div>
            </div>
          ))}
          {summary.units.slice(0, 5).map((unit) => (
            <div key={unit.label}>
              <p><span>{cleanBudgetLabel(unit.label)}</span><strong>{compactCurrency(unit.value)}</strong></p>
              <div><i className="secondary" style={{ width: `${maxUnit ? (unit.value / maxUnit) * 100 : 0}%` }} /></div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
