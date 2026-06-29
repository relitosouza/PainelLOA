"use client";

import Link from "next/link";
import { DataSourceToggle } from "./data-source-toggle";
import { currency } from "@/lib/format";
import type { DashboardData } from "@/types/loa";

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatCompactMoney(value: number) {
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1).replace(".", ",")}B`;
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1).replace(".", ",")}M`;
  return currency.format(value);
}

function findGroupValue(items: { label: string; value: number }[], keywords: string[]) {
  return items.find((item) => keywords.some((keyword) => normalizeText(item.label).includes(normalizeText(keyword))))?.value ?? 0;
}

function findGroup(items: { label: string; value: number }[], keywords: string[]) {
  return items.find((item) => keywords.some((keyword) => normalizeText(item.label).includes(normalizeText(keyword)))) ?? null;
}

export function AnalyticDashboardLayout({ data }: { data: DashboardData }) {
  const totalVal = data.totals.loa;
  const operatingVal = data.spending.operating;
  const investmentVal = data.spending.investment;
  const expenseTotal = operatingVal + investmentVal;
  const isBalanced = totalVal >= expenseTotal;
  const population = 723500;

  const currentRevenue = totalVal * 0.896;
  const capitalRevenue = totalVal * 0.104;

  const organLeader = data.secretariatCeiling ?? data.groups.organ[0] ?? null;
  const topPrograms = data.groups.program.slice(0, 2);

  const healthValue = findGroupValue(data.groups.functionName, ["saude", "saúde"]);
  const educationValue = findGroupValue(data.groups.functionName, ["educacao", "educação"]);
  const infrastructureValue = findGroupValue(data.groups.functionName, ["obra", "infra"]);

  const perCapitaRows = [
    {
      label: "Saúde por Habitante",
      total: healthValue || totalVal * 0.24,
      perCapita: (healthValue || totalVal * 0.24) / population,
      status: "Adequado",
      tone: "green",
    },
    {
      label: "Educação por Habitante",
      total: educationValue || totalVal * 0.2,
      perCapita: (educationValue || totalVal * 0.2) / population,
      status: "Adequado",
      tone: "green",
    },
    {
      label: "Obras e Infraestrutura",
      total: infrastructureValue || totalVal * 0.08,
      perCapita: (infrastructureValue || totalVal * 0.08) / population,
      status: "Em Expansão",
      tone: "blue",
    },
  ];

  const expenseBlocks = [
    { label: "Pessoal e Encargos", value: expenseTotal * 0.36, share: 36 },
    { label: "Custeio (Manutenção)", value: expenseTotal * 0.43, share: 43 },
    { label: "Investimentos & Expansão", value: expenseTotal * 0.17, share: 17, highlight: true },
  ];

  const originBlocks = [
    { label: "Transferências", value: 53, tone: "bg-tertiary", text: "text-white" },
    { label: "Própria", value: 41, tone: "bg-blue-400", text: "text-white" },
    { label: "Outros", value: 6, tone: "bg-blue-200", text: "text-on-surface" },
  ];

  const topHealthFunction = findGroup(data.groups.functionName, ["saude", "saúde"]) ?? data.groups.functionName[0] ?? null;
  const topEducationFunction = findGroup(data.groups.functionName, ["educacao", "educação"]) ?? data.groups.functionName[1] ?? null;
  const topInfrastructureFunction = findGroup(data.groups.functionName, ["obra", "infra"]) ?? data.groups.functionName[2] ?? null;

  const exerciseYear = 2027;

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Visualização Analítica da LOA - Equilíbrio entre Receita e Despesa
          </h2>
          <p className="text-on-surface-variant mt-1">
            Gestão orçamentária integrada: análise de fontes e aplicações de recursos.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              Painel Analítico
            </Link>
            <Link
              href="/apresentacao"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">slideshow</span>
              Painel Executivo
            </Link>
            <Link
              href="/transparente"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              LOA Transparente
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-surface px-4 py-2 rounded-lg shadow-sm border border-outline-variant text-sm font-medium">
          <DataSourceToggle />
          <span className="flex items-center gap-2 border-l border-outline-variant/30 pl-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary">calendar_today</span>
            Exercício: {exerciseYear}
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="glass-card revenue-gradient p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-1">Receita Total</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{formatCompactMoney(totalVal)}</h3>
          </div>
          <span className="material-symbols-outlined absolute right-[-5px] bottom-[-5px] text-[60px] text-tertiary/10">account_balance_wallet</span>
        </article>
        <article className="glass-card expense-gradient p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">Despesa Total Fixada</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{formatCompactMoney(expenseTotal)}</h3>
          </div>
          <span className="material-symbols-outlined absolute right-[-5px] bottom-[-5px] text-[60px] text-orange-700/10">payments</span>
        </article>
        <article className="glass-card p-5 flex flex-col justify-center h-32 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Equilíbrio</p>
              <h3 className="text-lg font-headline font-bold text-on-surface">{isBalanced ? "Despesa = Receita" : "Despesa > Receita"}</h3>
            </div>
            <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
              {isBalanced ? "Equilibrado" : "Atenção"}
            </div>
          </div>
        </article>
        <article className="glass-card p-5 flex flex-col justify-center h-32 bg-primary/5">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">População Estimada</p>
            <h3 className="text-xl font-headline font-bold text-on-surface">723.500 Hab.</h3>
            <p className="text-xs text-on-surface-variant">Base para métricas per capita</p>
          </div>
        </article>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-tertiary">trending_up</span>
            <h3 className="text-xl font-headline font-bold text-on-surface">Análise da Receita Pública</h3>
          </div>

          <section className="glass-card p-6">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Detalhamento por Categoria</h4>
            <div className="space-y-4">
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Receita Corrente</span>
                  <span className="text-sm font-bold text-tertiary">{formatCompactMoney(currentRevenue)}</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5">
                  <div className="bg-tertiary h-1.5 rounded-full" style={{ width: `${totalVal > 0 ? (currentRevenue / totalVal) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Receita de Capital</span>
                  <span className="text-sm font-bold text-tertiary">{formatCompactMoney(capitalRevenue)}</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5">
                  <div className="bg-tertiary-container h-1.5 rounded-full" style={{ width: `${totalVal > 0 ? (capitalRevenue / totalVal) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h5 className="text-xs font-bold uppercase text-on-surface-variant mb-3">Distribuição por Origem</h5>
              <div className="flex h-10 rounded-lg overflow-hidden shadow-inner mb-4">
                {originBlocks.map((block) => (
                  <div key={block.label} className={`${block.tone} h-full flex items-center justify-center text-[10px] font-bold ${block.text}`} style={{ width: `${block.value}%` }}>
                    {block.value}%
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-medium text-on-surface-variant">
                {originBlocks.map((block) => (
                  <div key={block.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${block.tone}`} />
                    {block.label} ({formatCompactMoney(totalVal * (block.value / 100))})
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Métricas Per Capita (Receita)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Total / Habitante</p>
                <p className="text-xl font-bold text-on-surface">{currency.format(totalVal / population)}</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Própria / Habitante</p>
                <p className="text-xl font-bold text-tertiary">{currency.format((totalVal * 0.41) / population)}</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4 text-tertiary">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              <h4 className="text-sm font-bold uppercase">Insights de Receita</h4>
            </div>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
                <p className="text-sm text-on-surface-variant">A arrecadação própria atingiu 41%, demonstrando robustez fiscal municipal.</p>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
                <p className="text-sm text-on-surface-variant">Os grupos funcionais mais relevantes concentram a maior parcela dos recursos.</p>
              </li>
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-orange-600">trending_down</span>
            <h3 className="text-xl font-headline font-bold text-on-surface">Análise da Despesa Pública</h3>
          </div>

          <section className="glass-card p-6 border-t-4 border-t-orange-500">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Estrutura do Orçamento de Despesa</h4>
            <div className="space-y-4">
              {expenseBlocks.map((block) => (
                <div
                  key={block.label}
                  className={`bg-surface-container rounded-lg p-3 border border-outline-variant/30 flex justify-between items-center ${
                    block.highlight ? "ring-2 ring-orange-500/20" : ""
                  }`}
                >
                  <div>
                    <p className={`text-[10px] uppercase font-bold ${block.highlight ? "text-orange-700" : "text-on-surface-variant"}`}>{block.label}</p>
                    <p className={`text-lg font-bold ${block.highlight ? "text-orange-700" : "text-on-surface"}`}>
                      {formatCompactMoney(block.value)} <span className={`text-xs font-normal ml-2 ${block.highlight ? "text-orange-600" : "text-on-surface-variant"}`}>({block.share}%)</span>
                    </p>
                  </div>
                  {block.highlight ? (
                    <span className="material-symbols-outlined text-orange-600">rocket_launch</span>
                  ) : (
                    <div className="w-12 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${block.share}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-surface rounded border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Amortização Dívida</p>
                <p className="text-md font-bold text-on-surface">{formatCompactMoney(totalVal * 0.026)}</p>
              </div>
              <div className="p-3 bg-surface rounded border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Reserva Contingência</p>
                <p className="text-md font-bold text-on-surface">{formatCompactMoney(totalVal * 0.009)}</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Concentração e Rankings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-600">medical_services</span>
                  <div className="text-sm">
                    <p className="font-bold text-on-surface">{organLeader?.label || "Saúde"}</p>
                    <p className="text-xs text-on-surface-variant">Maior Órgão Executor</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-on-surface">{formatCompactMoney(organLeader?.value ?? 0)}</p>
                  <p className="text-[10px] text-orange-600 font-bold">{totalVal ? `${Math.round(((organLeader?.value ?? 0) / totalVal) * 100)}% do Total` : "0% do Total"}</p>
                </div>
              </div>
              <div className="p-3 border border-outline-variant/30 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-2">Top Programas e Ações</p>
                <div className="space-y-2">
                  {topPrograms.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm gap-4">
                      <span className="text-on-surface-variant truncate pr-4">{item.label}</span>
                      <span className="font-bold shrink-0">{formatCompactMoney(item.value)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-on-surface-variant italic">As maiores estruturas concentram a maior parte da despesa total.</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4 text-orange-600">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <h4 className="text-sm font-bold uppercase">Insights de Despesa (IA)</h4>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded text-sm text-on-surface-variant border-l-4 border-l-orange-400">
                Investimentos representam {expenseTotal ? `${Math.round((investmentVal / expenseTotal) * 100)}%` : "0%"} do orçamento, com maior peso nos projetos de expansão.
              </div>
              <div className="p-3 bg-surface-container rounded text-sm text-on-surface-variant">
                Identificadas {data.counts.actions} ações vinculadas ao plano, indicando boa granularidade de execução.
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="glass-card p-8">
        <div className="text-center mb-8">
          <h4 className="text-lg font-headline font-bold text-on-surface">Fluxo de Aplicação de Recursos</h4>
          <p className="text-sm text-on-surface-variant">Como a receita de {formatCompactMoney(totalVal)} é distribuída entre as principais naturezas de despesa.</p>
        </div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
          <div className="w-full md:w-48 p-6 bg-tertiary text-on-tertiary rounded-xl text-center shadow-lg z-10">
            <p className="text-[10px] uppercase font-bold opacity-80 mb-1">Receita Total</p>
            <p className="text-2xl font-extrabold">{formatCompactMoney(totalVal)}</p>
          </div>
          <div className="hidden md:block absolute left-48 right-48 top-1/2 -translate-y-1/2 h-40 opacity-20 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path className="text-tertiary" d="M0,50 C50,50 50,20 100,20" fill="none" stroke="currentColor" strokeWidth="2" />
              <path className="text-tertiary" d="M0,50 C50,50 50,50 100,50" fill="none" stroke="currentColor" strokeWidth="2" />
              <path className="text-tertiary" d="M0,50 C50,50 50,80 100,80" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-48">
            <div className="p-3 bg-surface border border-orange-200 rounded-lg shadow-sm text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Pessoal</p>
              <p className="font-bold text-on-surface">{formatCompactMoney(expenseTotal * 0.36)}</p>
            </div>
            <div className="p-3 bg-surface border border-orange-200 rounded-lg shadow-sm text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Custeio</p>
              <p className="font-bold text-on-surface">{formatCompactMoney(expenseTotal * 0.43)}</p>
            </div>
            <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg shadow-sm text-center">
              <p className="text-[10px] font-bold text-orange-800 uppercase">Investimentos</p>
              <p className="font-bold text-orange-800">{formatCompactMoney(expenseTotal * 0.17)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30">
          <h4 className="text-sm font-bold uppercase text-on-surface-variant">Indicadores de Despesa por Habitante</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-bold text-[10px] uppercase">
                <th className="px-6 py-3">Indicador</th>
                <th className="px-6 py-3">Valor Total</th>
                <th className="px-6 py-3">Valor por Habitante</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {perCapitaRows.map((row) => (
                <tr key={row.label}>
                  <td className="px-6 py-4 font-medium">{row.label}</td>
                  <td className="px-6 py-4">{formatCompactMoney(row.total)}</td>
                  <td className="px-6 py-4 font-bold">{currency.format(row.perCapita)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${row.tone === "green" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="glass-card p-5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Receita Corrente</p>
          <h4 className="text-lg font-headline font-bold text-on-surface">{formatCompactMoney(currentRevenue)}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{topHealthFunction?.label || "Maior função"}</p>
        </article>
        <article className="glass-card p-5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Educação</p>
          <h4 className="text-lg font-headline font-bold text-on-surface">{formatCompactMoney(educationValue || totalVal * 0.2)}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{topEducationFunction?.label || "Segundo maior eixo"}</p>
        </article>
        <article className="glass-card p-5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Obras e Infraestrutura</p>
          <h4 className="text-lg font-headline font-bold text-on-surface">{formatCompactMoney(infrastructureValue || totalVal * 0.08)}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{topInfrastructureFunction?.label || "Carteira estratégica"}</p>
        </article>
      </section>
    </div>
  );
}
