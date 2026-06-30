"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDataSource } from "@/components/data-source-toggle";
import type { DashboardData } from "@/types/loa";

export default function ReceitasPage() {
  const [dataSource] = useDataSource();
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<2024 | 2023 | 2022>(2024);

  useEffect(() => {
    setLoading(true);
    fetch("/api/loa?all=true")
      .then((res) => res.json())
      .then((res) => {
        setDbData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [dataSource]);

  // Year scaling multiplier
  const yearScale = selectedYear === 2024 ? 1.0 : selectedYear === 2023 ? 0.88 : 0.76;

  // Dynamic calculations based on LOA data or fallbacks
  const totalLoa = (dbData?.totals.loa ?? 1240500000) * yearScale;
  const ownRevenue = totalLoa * 0.34;
  const transfers = totalLoa * 0.53;
  const capitalRevenue = totalLoa * 0.13;

  // Correntes vs Capital breakdown
  const rawOperating = dbData?.spending.operating ?? 0;
  const rawInvestment = dbData?.spending.investment ?? 0;
  const totalRaw = rawOperating + rawInvestment;
  const pctCorrente = totalRaw > 0 ? Math.round((rawOperating / totalRaw) * 100) : 87;
  const pctCapital = 100 - pctCorrente;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const sources = [
    { label: "FPM - Fundo Particip. Municípios", type: "Transferência União", pct: 23, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "ICMS - Cota Parte Estadual", type: "Transferência Estado", pct: 17, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "ISS - Serviços", type: "Própria", pct: 15, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "IPTU - Territorial Urbano", type: "Própria", pct: 12, color: "bg-green-50 text-green-700 border-green-200" },
    { label: "FUNDEB", type: "Vinc. Educação", pct: 10, color: "bg-blue-50 text-blue-700 border-blue-200" },
  ];

  return (
    <div className="bg-[#fcf9f8] text-[#1b1b1c] min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-6 py-3 border-b border-[#c1c6d5] bg-[#fcf9f8] dark:bg-[#303030]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-headline font-black text-[#1b1b1c] dark:text-[#f3f0ef] tracking-tight">
            Sala de Situação
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 font-body text-sm font-medium">
          <Link className="text-[#414753] dark:text-[#c1c6d5] hover:text-[#5a5c5c] transition-colors" href="/transparente">
            Portal Transparência
          </Link>
          <Link className="text-[#5a5c5c] dark:text-[#c6c6c7] font-bold border-b-2 border-[#5a5c5c] pb-1" href="/apresentacao">
            Painel Estratégico
          </Link>
          <Link className="text-[#414753] dark:text-[#c1c6d5] hover:text-[#5a5c5c] transition-colors" href="/">
            Visão Analítica
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#414753] hover:text-[#5a5c5c] cursor-pointer transition-colors">
            notifications
          </span>
          <span className="material-symbols-outlined text-[#414753] hover:text-[#5a5c5c] cursor-pointer transition-colors">
            settings
          </span>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#f0eded] border border-[#c1c6d5]">
            <img
              className="w-full h-full object-cover"
              alt="Government manager portrait"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNcgBVDsJQmVFyYLS3pMdlLWwljWpcsWYTYS92EqmaCajGI6AfhaKvA-dva1V7a5nQwEdb4slm6DrYb63kslSISRIVXprgeiB6tRHWQSNPU0whtl-0RFJp9nxL2jMhTXHzZLYi8l1vWgfW9lQ22V7XxotiwF6eLlbBFUdktGiK9R_S-1jDiPWaVv9kuss7jg1Gj5ZHNz-RB_iiLm8wkb8GzokD1mE3iy682FbTLH8orxScLOm2EUuj0pqKfQMQjSb74AUVN7RLjDrc"
            />
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="flex flex-col h-screen fixed left-0 top-0 border-r border-[#c1c6d5] pt-20 pb-6 px-4 bg-white w-64 hidden md:flex">
        <div className="flex flex-col items-center mb-8 px-2">
          <div className="w-12 h-12 bg-[#eae7e7] rounded-lg flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[#005da7] text-3xl">account_balance</span>
          </div>
          <h2 className="text-sm font-headline font-bold text-[#1b1b1c] text-center">Prefeitura Municipal</h2>
          <p className="text-xs text-[#414753]">Gestão 2021-2024</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/apresentacao"
          >
            <span className="material-symbols-outlined">dashboard</span> Visão Geral
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 bg-[#2976c7]/15 text-[#005da7] rounded-lg font-bold transition-all font-body text-sm border-l-4 border-[#005da7]"
            href="/receitas"
          >
            <span className="material-symbols-outlined">payments</span> Receitas
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/apresentacao"
          >
            <span className="material-symbols-outlined">account_balance_wallet</span> Despesas
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/apresentacao"
          >
            <span className="material-symbols-outlined">star</span> Prioridades
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/apresentacao"
          >
            <span className="material-symbols-outlined">query_stats</span> Insights
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/apresentacao"
          >
            <span className="material-symbols-outlined">chat</span> Pergunte ao Orçamento
          </Link>
        </nav>
        <div className="mt-auto pt-4 space-y-1">
          <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#005da7] hover:bg-[#004883] text-white rounded-lg font-bold transition-opacity mb-4 cursor-pointer text-sm">
            <span className="material-symbols-outlined text-sm">download</span> Relatório Mensal
          </button>
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/transparente"
          >
            <span className="material-symbols-outlined">help</span> Suporte
          </Link>
          <Link
            className="flex items-center gap-3 px-3 py-2 text-[#414753] hover:bg-[#e5e2e1] rounded-lg transition-all font-body text-sm"
            href="/"
          >
            <span className="material-symbols-outlined">logout</span> Sair
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-24 px-6 pb-12 min-h-screen bg-[#fcf9f8]">
        {/* Header & Action Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-black text-[#1b1b1c] tracking-tight">
              Análise Detalhada de Receitas
            </h1>
            <p className="text-[#414753] mt-1">Acompanhamento em tempo real da arrecadação e transferências.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#eae7e7] p-1 rounded-lg">
            {( [2024, 2023, 2022] as const ).map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${
                  selectedYear === yr
                    ? "bg-white shadow-sm text-[#005da7]"
                    : "text-[#414753] hover:bg-[#e5e2e1]"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Data Loading state */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mx-auto mb-4 border-4 border-[#005da7] border-t-transparent rounded-full w-8 h-8 animate-spin" />
              <p className="text-[#414753] font-medium">Carregando dados da LOA...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Revenue */}
              <div className="bg-white border border-[#c1c6d5] p-6 rounded-xl flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01] hover:border-[#005da7]">
                <div className="flex justify-between items-start">
                  <span className="p-2 bg-[#d4e3ff] text-[#005da7] rounded-lg material-symbols-outlined">
                    account_balance
                  </span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+4.2%</span>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-[#414753] uppercase tracking-wider font-semibold">Receita Total</p>
                  <h3 className="text-2xl font-headline font-black text-[#1b1b1c]">{formatMoney(totalLoa)}</h3>
                </div>
              </div>

              {/* Own Revenue */}
              <div className="bg-white border border-[#c1c6d5] p-6 rounded-xl shadow-sm transition-all hover:scale-[1.01] hover:border-[#005da7]">
                <div className="flex justify-between items-start">
                  <span className="p-2 bg-green-100 text-green-800 rounded-lg material-symbols-outlined">
                    home_work
                  </span>
                  <span className="text-xs font-bold text-[#414753] bg-[#eae7e7] px-2 py-0.5 rounded-full">
                    IPTU, ISS, Taxas
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-[#414753] uppercase tracking-wider font-semibold">Receita Própria</p>
                  <h3 className="text-2xl font-headline font-black text-[#1b1b1c]">{formatMoney(ownRevenue)}</h3>
                  <div className="w-full bg-[#f0eded] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-green-600 h-full w-[34%]" />
                  </div>
                </div>
              </div>

              {/* Transfers */}
              <div className="bg-white border border-[#c1c6d5] p-6 rounded-xl shadow-sm transition-all hover:scale-[1.01] hover:border-[#005da7]">
                <div className="flex justify-between items-start">
                  <span className="p-2 bg-blue-100 text-blue-800 rounded-lg material-symbols-outlined">
                    move_to_inbox
                  </span>
                  <span className="text-xs font-bold text-[#414753] bg-[#eae7e7] px-2 py-0.5 rounded-full">
                    FPM, ICMS, SUS
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-[#414753] uppercase tracking-wider font-semibold">Transferências</p>
                  <h3 className="text-2xl font-headline font-black text-[#1b1b1c]">{formatMoney(transfers)}</h3>
                  <div className="w-full bg-[#f0eded] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-blue-600 h-full w-[53%]" />
                  </div>
                </div>
              </div>

              {/* Capital Revenue */}
              <div className="bg-white border border-[#c1c6d5] p-6 rounded-xl shadow-sm transition-all hover:scale-[1.01] hover:border-[#005da7]">
                <div className="flex justify-between items-start">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-lg material-symbols-outlined">
                    trending_up
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Alienação/Op. Créd.
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-[#414753] uppercase tracking-wider font-semibold">Receita de Capital</p>
                  <h3 className="text-2xl font-headline font-black text-[#1b1b1c]">{formatMoney(capitalRevenue)}</h3>
                </div>
              </div>
            </div>

            {/* Alert & Core Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Alert Section */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-[#ba1a1a] p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      warning
                    </span>
                    <h4 className="font-bold text-[#93000a] dark:text-red-300">Alerta de Vulnerabilidade</h4>
                  </div>
                  <p className="text-[#414753] text-sm leading-relaxed mb-4">
                    A <span className="font-bold">Dependência de Transferências (53%)</span> está acima da média
                    histórica de 48%. Isso indica que a gestão municipal é sensível a flutuações de repasses externos
                    (FPM/ICMS).
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-[#ba1a1a]">53%</span>
                    <span className="text-xs text-[#ba1a1a] font-medium mb-1">da receita total</span>
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white border border-[#c1c6d5] p-6 rounded-xl flex-1 relative overflow-hidden shadow-sm">
                  <h4 className="font-bold text-[#1b1b1c] mb-6">Receita Corrente vs Capital</h4>
                  <div className="flex items-center justify-center py-8">
                    <div className="relative w-40 h-40">
                      {/* Dynamic SVG Pie Chart */}
                      <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="4" />
                        <circle
                          cx="18"
                          cy="18"
                          fill="transparent"
                          r="16"
                          stroke="#005da7"
                          strokeDasharray={`${pctCorrente} 100`}
                          strokeWidth="4"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          fill="transparent"
                          r="16"
                          stroke="#2e7d32"
                          strokeDasharray={`${pctCapital} 100`}
                          strokeDashoffset={`-${pctCorrente}`}
                          strokeWidth="4"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black">{selectedYear === 2024 ? "100%" : `${Math.round(yearScale * 100)}%`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#005da7]" /> Correntes
                      </span>
                      <span className="font-bold">{pctCorrente}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#2e7d32]" /> Capital
                      </span>
                      <span className="font-bold">{pctCapital}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Table Section */}
              <div className="lg:col-span-2 bg-white border border-[#c1c6d5] rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="p-6 border-b border-[#c1c6d5] flex justify-between items-center">
                  <h4 className="font-bold text-[#1b1b1c]">Principais Fontes de Receita</h4>
                  <Link href="/" className="text-[#005da7] hover:text-[#004883] text-sm font-bold flex items-center gap-1 hover:underline">
                    Ver Detalhado <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-[#f6f3f2]">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#414753]">Fonte</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#414753]">Tipo</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#414753] text-right">
                          Valor Realizado
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#414753] text-right">
                          Participação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c1c6d5]">
                      {sources.map((src) => {
                        const val = totalLoa * (src.pct / 100);
                        return (
                          <tr key={src.label} className="hover:bg-[#f6f3f2] transition-colors">
                            <td className="px-6 py-4 font-medium text-[#1b1b1c] text-sm">{src.label}</td>
                            <td className="px-6 py-4 text-sm text-[#414753]">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${src.color}`}>
                                {src.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-[#1b1b1c] text-sm">
                              {formatMoney(val)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`text-sm font-bold ${
                                  src.type === "Própria" ? "text-green-600" : "text-[#005da7]"
                                }`}
                              >
                                {src.pct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* IA Insights Section */}
            <section className="bg-[#303030] text-[#f3f0ef] rounded-2xl overflow-hidden shadow-xl mb-8">
              <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="p-2 bg-[#005da7] rounded-lg material-symbols-outlined text-white">
                      psychology
                    </span>
                    <h2 className="text-2xl font-headline font-bold">Insights Inteligentes da Sala</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-1 bg-[#005da7] rounded-full" />
                      <div>
                        <p className="font-bold text-lg mb-1 text-white">Crescimento Acima da Inflação</p>
                        <p className="text-[#e5e2e1]/80 text-sm leading-relaxed">
                          A arrecadação de ISS superou o IPCA acumulado em 2.4% este semestre, impulsionada pelo setor
                          de serviços tecnológicos no polo industrial norte.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-1 bg-green-500 rounded-full" />
                      <div>
                        <p className="font-bold text-lg mb-1 text-white">Otimização de Créditos</p>
                        <p className="text-[#e5e2e1]/80 text-sm leading-relaxed">
                          O novo programa de refinanciamento (REFIS) projeta uma entrada de R$ 12M extras para o
                          próximo trimestre, reduzindo o estoque de dívida ativa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-80 h-64 relative rounded-xl overflow-hidden border border-white/10 group shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="Abstract financial data flows"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQJIBwRHVQrO3jK83ot_kWkKT9hrtR2m0SruKrKFJt0z_-fYAB4UDJtfsk07LTFBs4l_aZYT687FthxbF7USVqV0byj1fi2d2V7Ovd5k56glm_sdtgQwnXyTNYQNWNOIRgYcazcvGhPTsfOW-z4A-dO3qYnrIuRq3igYF8P6MevEPKQFz-iB21G9Woftbpedkl5Lk2JyXvsI8lqZct97p69VdbZjXDIkeM3JfFmdf0rOPoU1f9Rm6QEyfg0rmZLDoSEw-suHK7swMw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#303030] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] uppercase tracking-widest font-black opacity-50">
                      Visual Data Engine
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#f0eded] border-t border-[#c1c6d5] flex justify-around items-center py-3 px-4 z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#414753]">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Geral</span>
        </Link>
        <Link href="/receitas" className="flex flex-col items-center gap-1 text-[#005da7]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            payments
          </span>
          <span className="text-[10px] font-bold">Receitas</span>
        </Link>
        <Link href="/apresentacao" className="flex flex-col items-center gap-1 text-[#414753]">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-bold">Despesas</span>
        </Link>
        <Link href="/apresentacao" className="flex flex-col items-center gap-1 text-[#414753]">
          <span className="material-symbols-outlined">query_stats</span>
          <span className="text-[10px] font-bold">IA</span>
        </Link>
      </nav>
    </div>
  );
}
