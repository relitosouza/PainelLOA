"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { DashboardData } from "@/types/loa";

export function ExpenseDetailView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as "loa" | "execucao") || "loa";
  const [activeTab, setActiveTab] = useState<"loa" | "execucao">(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab") as "loa" | "execucao";
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const exerciseYear = 2027;

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
  }, []);

  const totalLoa = dbData?.totals.loa ?? 0;
  const operatingVal = dbData?.spending.operating ?? 0;
  const investmentVal = dbData?.spending.investment ?? 0;
  const unclassifiedVal = Math.max(0, totalLoa - operatingVal - investmentVal);

  const pctInvestimento = totalLoa > 0 ? (investmentVal / totalLoa) * 100 : 0;

  const formatBillion = (val: number) => {
    if (val >= 1e9) {
      return `R$ ${(val / 1e9).toFixed(2).replace(".", ",")} Bi`;
    }
    return `R$ ${Math.round(val / 1e6).toLocaleString("pt-BR")} Mi`;
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Top Secretariats allocation
  const organStats = useMemo(() => {
    if (!dbData?.groups.organ || dbData.groups.organ.length === 0) {
      return [];
    }
    
    const sumAll = dbData.groups.organ.reduce((acc, o) => acc + o.value, 0);

    return dbData.groups.organ.slice(0, 5).map((org) => {
      const pct = sumAll > 0 ? (org.value / sumAll) * 100 : 0;
      return {
        label: org.label.replace(/^\d+\s*-\s*/, ""),
        value: org.value,
        pct,
      };
    });
  }, [dbData, exerciseYear]);

  // Top Contracts/Processes
  const topProcesses = useMemo(() => {
    if (!dbData?.records || dbData.records.length === 0) {
      return [];
    }
    return [...dbData.records]
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((rec, idx) => {
        return {
          id: `#${exerciseYear}.${String(rec.id).slice(-4)}.${idx}`,
          object: rec.program || "Despesa Administrativa LOA",
          dept: rec.organ || "Secretaria Municipal",
          fav: rec.budgetUnit || "Unidade orçamentária não informada",
          val: rec.value,
          status: "Previsto",
        };
      });
  }, [dbData, exerciseYear]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Painel de Despesas Municipais */}
      <header className="border-b border-outline-variant/30 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            DESPESAS MUNICIPAIS
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Painel de Despesas Municipais</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Acompanhe as despesas previstas na LOA e a análise da execução financeira municipal.
          </p>
        </div>

        {/* Abas Principais de Despesas */}
        <div className="flex gap-2 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("loa")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "loa"
                ? "border-primary text-primary bg-surface-container font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">subtitles</span>
            <span>Despesas LOA</span>
          </button>

          <button
            onClick={() => setActiveTab("execucao")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "execucao"
                ? "border-primary text-primary bg-surface-container font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            <span>Análise de Despesa Executada</span>
          </button>
        </div>
      </header>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === "execucao" ? (
        <div className="bg-surface border border-outline-variant rounded-xl p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary">analytics</span>
          <h3 className="text-lg font-bold text-on-surface">Análise de Despesa Executada</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Acompanhamento da execução orçamentária e financeira de empenhos, liquidações e pagamentos efetivados no município.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-semibold text-on-surface-variant">Empenhado</span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-semibold text-on-surface-variant">Liquidado</span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-semibold text-on-surface-variant">Pago</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-surface border border-outline-variant p-4 rounded-xl">
            <div className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-bold text-tertiary">
              Exercício {exerciseYear}
            </div>
            <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-sm">filter_alt</span>
              Filtros Avançados
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="spinner mx-auto mb-4 border-4 border-[#005da7] border-t-transparent rounded-full w-8 h-8 animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando dados da LOA...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Summary Cards & Strategic Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Main Total */}
            <div className="bg-[#4c1d95] p-6 rounded-xl text-white flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Despesa Total</span>
                  <span className="material-symbols-outlined opacity-80">account_balance_wallet</span>
                </div>
                <h3 className="text-3xl font-black mt-2">{formatBillion(totalLoa)}</h3>
                <p className="text-xs mt-1 opacity-80">Valor previsto na importação selecionada</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>Exercício {exerciseYear} · dados reais</span>
                </div>
              </div>
            </div>

            {/* Strategic Indicators Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01] hover:border-tertiary">
                <div>
                  <span className="text-sm font-bold text-tertiary">Participação de Capital</span>
                  <div className="flex items-end gap-2 mt-2">
                    <h4 className="text-2xl font-black">{pctInvestimento.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</h4>
                    <span className="text-xs text-on-surface-variant pb-1">{formatBillion(investmentVal)}</span>
                  </div>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-tertiary h-full" style={{ width: `${Math.min(100, pctInvestimento)}%` }} />
                </div>
              </div>
              <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between">
                <div>
                  <span className="text-sm font-bold text-on-surface">LRF — Despesa com Pessoal</span>
                  <h4 className="mt-2 text-xl font-black text-on-surface">Não calculado</h4>
                  <p className="mt-1 text-xs text-on-surface-variant">Os dados de despesa com pessoal ainda não foram importados.</p>
                </div>
                <span className="mt-4 w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Aguardando base da LRF</span>
              </div>
            </div>

            {/* Smaller Metric */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm space-y-4 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EA580C]/10 text-[#EA580C] rounded-lg">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Despesas Correntes</p>
                  <p className="font-bold">{formatBillion(operatingVal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#6B21A8]/10 text-[#6B21A8] rounded-lg">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Despesas de Capital</p>
                  <p className="font-bold">{formatBillion(investmentVal)}</p>
                </div>
              </div>
              {unclassifiedVal > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">Sem natureza classificada</p>
                    <p className="font-bold">{formatBillion(unclassifiedVal)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visual Section: Allocation & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Allocation Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="font-headline text-lg font-bold text-on-surface">Alocação por Secretaria</h4>
                  <p className="text-sm text-on-surface-variant">Secretarias com maiores volumes de gastos</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-surface-container rounded-md text-on-surface-variant cursor-pointer">
                    <span className="material-symbols-outlined">bar_chart</span>
                  </button>
                  <button className="p-2 bg-surface-container rounded-md text-tertiary cursor-pointer">
                    <span className="material-symbols-outlined">dashboard_customize</span>
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                {organStats.map((item, index) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-semibold text-sm text-on-surface">{item.label}</span>
                      <span className="text-sm font-bold text-on-surface">
                        {formatBillion(item.value)} <span className="text-xs font-normal opacity-60">({item.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)</span>
                      </span>
                    </div>
                    <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden" aria-label={`${item.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`}>
                      <div
                        className={`h-full ${["bg-purple-700", "bg-orange-600", "bg-[#005da7]", "bg-teal-600", "bg-slate-600"][index]}`}
                        style={{ width: `${Math.min(100, item.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IA Insights Column */}
            <div className="bg-inverse-surface text-white rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-white">auto_awesome</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-tertiary-fixed">auto_awesome</span>
                  <h4 className="font-headline font-bold text-lg text-white">Leituras da Base 2027</h4>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="bg-white/5 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <p className="text-sm italic leading-relaxed text-white/90">
                      &quot;As duas maiores secretarias concentram {organStats[0] && organStats[1] ? `${(organStats[0].pct + organStats[1].pct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "0%"} do valor previsto na importação de 2027.&quot;
                    </p>
                  </div>
                  <div className="bg-white/5 border-l-4 border-purple-500 p-4 rounded-r-lg">
                    <p className="text-sm italic leading-relaxed text-white/90">
                      &quot;O indicador da LRF não pode ser calculado porque a base importada ainda não contém os dados completos de despesa com pessoal. O painel será atualizado após essa importação.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="material-symbols-outlined text-[#a4c9ff]">info</span>
                  <p className="text-xs font-medium text-[#a4c9ff]">Os valores apresentados correspondem à previsão orçamentária importada para 2027, não à execução ou liquidação da despesa.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table Section */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <h4 className="font-headline text-lg font-bold text-on-surface">Maiores Dotações e Processos</h4>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                    search
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-lg border-none text-sm"
                    placeholder="Filtrar processos..."
                    type="text"
                  />
                </div>
                <Link href="/" className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-sm font-medium transition-all text-on-surface">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">ID Processo</th>
                    <th className="px-6 py-4">Objeto / Contrato</th>
                    <th className="px-6 py-4">Favorecido</th>
                    <th className="px-6 py-4 text-right">Valor Total</th>
                    <th className="px-6 py-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-outline-variant">
                  {topProcesses.map((proc) => (
                    <tr key={proc.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-tertiary">{proc.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-on-surface truncate max-w-[250px]">{proc.object}</p>
                        <p className="text-xs text-on-surface-variant">{proc.dept}</p>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{proc.fav}</td>
                      <td className="px-6 py-4 text-right font-bold text-on-surface">{formatMoney(proc.val)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-blue-800">
                          {proc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant">
              <p>Mostrando {topProcesses.length} de {dbData?.counts.processes ?? 1452} processos cadastrados</p>
              <div className="flex gap-2">
                <button className="p-1.5 bg-white border border-outline-variant rounded hover:bg-surface-container transition-all cursor-pointer">
                  Anterior
                </button>
                <button className="p-1.5 bg-white border border-outline-variant rounded hover:bg-surface-container transition-all cursor-pointer">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
        </div>
      )}
    </div>
  );
}
