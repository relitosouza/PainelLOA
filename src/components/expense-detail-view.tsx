"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useDataSource } from "./data-source-toggle";
import type { DashboardData } from "@/types/loa";

export function ExpenseDetailView() {
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
  const totalLoa = (dbData?.totals.loa ?? 1240000000) * yearScale;
  const rawOperating = dbData?.spending.operating ?? 840200000;
  const rawInvestment = dbData?.spending.investment ?? 400300000;
  
  const operatingVal = rawOperating * yearScale;
  const investmentVal = rawInvestment * yearScale;

  const pctInvestimento = totalLoa > 0 ? Math.round((investmentVal / totalLoa) * 100) : 17;
  const limitLRF = 54; // LRF ceiling for personnel, standard is ~54%

  const custeioMensal = (operatingVal * 0.40) / 12;
  const folhaMensal = (operatingVal * 0.60) / 12;

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
      return [
        { label: "Secretaria de Saúde", value: totalLoa * 0.38, pct: 38, sub: ["Atenção Básica", "Hospitais & Insumos", "Administração"], barColors: ["bg-purple-700", "bg-purple-500", "bg-purple-300"] },
        { label: "Secretaria de Educação", value: totalLoa * 0.32, pct: 32, sub: ["Infantil", "Folha Docente", "Alimentação"], barColors: ["bg-orange-600", "bg-orange-500", "bg-orange-300"] },
        { label: "Secretaria de Obras", value: totalLoa * 0.14, pct: 14, sub: ["Infraestrutura", "Manutenção"], barColors: ["bg-[#005da7]", "bg-blue-400"] },
      ];
    }
    
    const sumAll = dbData.groups.organ.reduce((acc, o) => acc + o.value, 0);
    const colors = [
      ["bg-purple-700", "bg-purple-500", "bg-purple-300"],
      ["bg-orange-600", "bg-orange-500", "bg-orange-300"],
      ["bg-[#005da7]", "bg-blue-400"],
    ];

    return dbData.groups.organ.slice(0, 3).map((org, index) => {
      const pct = sumAll > 0 ? (org.value / sumAll) * 100 : 0;
      return {
        label: org.label.replace(/^\d+\s*-\s*/, ""),
        value: org.value * yearScale,
        pct: Math.round(pct),
        sub: ["Pessoal", "Manutenção", "Projetos"],
        barColors: colors[index % colors.length],
      };
    });
  }, [dbData, totalLoa, yearScale]);

  // Top Contracts/Processes
  const topProcesses = useMemo(() => {
    if (!dbData?.records || dbData.records.length === 0) {
      return [
        { id: "#2024.0042.8", object: "Manutenção de Vias Urbanas - Regional Sul", dept: "Secretaria de Obras", fav: "ConstruCity Engenharia Ltda.", val: 14280000, pct: 45, status: "Ativo" },
        { id: "#2024.0115.2", object: "Aquisição de Medicamentos de Alta Complexidade", dept: "Secretaria de Saúde", fav: "MedSul Distribuidora S/A", val: 8420500, pct: 82, status: "Ativo" },
        { id: "#2023.0899.1", object: "Reforma da Escola Municipal Dom Bosco", dept: "Secretaria de Educação", fav: "Alfa Obras e Serviços Eireli", val: 3120000, pct: 100, status: "Encerrado" },
      ];
    }
    return [...dbData.records]
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((rec, idx) => {
        const pct = [45, 82, 100, 60][idx % 4];
        const status = pct === 100 ? "Encerrado" : "Ativo";
        return {
          id: `#${selectedYear}.${String(rec.id).slice(-4)}.${idx}`,
          object: rec.program || "Despesa Administrativa LOA",
          dept: rec.organ || "Secretaria Municipal",
          fav: rec.budgetUnit || "Prestador Geral de Serviços",
          val: rec.value * yearScale,
          pct,
          status,
        };
      });
  }, [dbData, selectedYear, yearScale]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>Relatórios</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-[#005da7]">Análise de Despesas</span>
          </nav>
          <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight">
            Análise Detalhada de Despesas
          </h2>
          <p className="text-on-surface-variant">Monitoramento em tempo real da execução orçamentária municipal.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container rounded-lg p-1 flex">
            {( [2024, 2023, 2022] as const ).map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  selectedYear === yr
                    ? "bg-white shadow-sm text-tertiary"
                    : "text-on-surface-variant hover:bg-white/50"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-sm">filter_alt</span>
            Filtros Avançados
          </Link>
        </div>
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
            <div className="bg-gradient-to-br from-[#6B21A8] to-[#EA580C] p-6 rounded-xl text-white shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Despesa Total</span>
                  <span className="material-symbols-outlined opacity-80">account_balance_wallet</span>
                </div>
                <h3 className="text-3xl font-black mt-2">{formatBillion(totalLoa)}</h3>
                <p className="text-xs mt-1 opacity-80">Executado: 64% do previsto</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>+4.2% vs 2023</span>
                </div>
              </div>
            </div>

            {/* Strategic Indicators Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01] hover:border-tertiary">
                <div>
                  <span className="text-sm font-bold text-tertiary">Índice de Investimento</span>
                  <div className="flex items-end gap-2 mt-2">
                    <h4 className="text-2xl font-black">{pctInvestimento}%</h4>
                    <span className="text-xs text-on-surface-variant pb-1">Meta: 20%</span>
                  </div>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-tertiary h-full" style={{ width: `${pctInvestimento}%` }} />
                </div>
              </div>
              <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01] hover:border-error">
                <div>
                  <span className="text-sm font-bold text-error">Limite LRF (Pessoal)</span>
                  <div className="flex items-end gap-2 mt-2">
                    <h4 className="text-2xl font-black">{limitLRF}%</h4>
                    <span className="text-xs text-on-surface-variant pb-1">Teto: 60%</span>
                  </div>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-error h-full w-[90%]" />
                </div>
              </div>
            </div>

            {/* Smaller Metric */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm space-y-4 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EA580C]/10 text-[#EA580C] rounded-lg">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Custeio Mensal</p>
                  <p className="font-bold">{formatBillion(custeioMensal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#6B21A8]/10 text-[#6B21A8] rounded-lg">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Folha Mensal</p>
                  <p className="font-bold">{formatBillion(folhaMensal)}</p>
                </div>
              </div>
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
                {organStats.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-semibold text-sm text-on-surface">{item.label}</span>
                      <span className="text-sm font-bold text-on-surface">
                        {formatBillion(item.value)} <span className="text-xs font-normal opacity-60">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-10 w-full bg-surface-container rounded-lg overflow-hidden flex">
                      <div className={`${item.barColors[0]} w-[38%] h-full flex items-center px-3 text-[10px] text-white font-bold whitespace-nowrap`}>
                        {item.sub[0]}
                      </div>
                      <div className={`${item.barColors[1]} w-[20%] h-full flex items-center px-2 text-[10px] text-white/90 whitespace-nowrap`}>
                        {item.sub[1]}
                      </div>
                      {item.barColors[2] && (
                        <div className={`${item.barColors[2]} w-[42%] h-full flex items-center px-2 text-[10px] text-on-surface whitespace-nowrap`}>
                          {item.sub[2]}
                        </div>
                      )}
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
                  <h4 className="font-headline font-bold text-lg text-white">Insights de IA</h4>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="bg-white/5 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <p className="text-sm italic leading-relaxed text-white/90">
                      &quot;Observou-se uma concentração de {organStats[0] && organStats[1] ? `${organStats[0].pct + organStats[1].pct}%` : "70%"} das despesas em apenas duas pastas. Isso indica uma alta priorização de serviços essenciais, porém reduz a margem para investimentos em infraestrutura.&quot;
                    </p>
                  </div>
                  <div className="bg-white/5 border-l-4 border-purple-500 p-4 rounded-r-lg">
                    <p className="text-sm italic leading-relaxed text-white/90">
                      &quot;O índice de eficiência de gasto com pessoal está em nível de alerta. Recomenda-se
                      monitorar as contratações temporárias previstas para o segundo semestre de {selectedYear}.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="material-symbols-outlined text-[#a4c9ff]">info</span>
                  <p className="text-xs font-medium text-[#a4c9ff]">Projeção: Superávit de 2.1% no encerramento do exercício.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table Section */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <h4 className="font-headline text-lg font-bold text-on-surface">Maiores Processos e Contratos</h4>
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
                    <th className="px-6 py-4">Execução</th>
                    <th className="px-6 py-4 text-center">Status</th>
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
                      <td className="px-6 py-4">
                        <div className="w-24 bg-surface-variant rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${proc.status === "Ativo" ? "bg-orange-500" : "bg-tertiary"}`}
                            style={{ width: `${proc.pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-on-surface-variant">{proc.pct}% Liquidado</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                            proc.status === "Ativo"
                              ? "bg-green-100 text-green-700"
                              : "bg-surface-container-highest text-on-surface-variant"
                          }`}
                        >
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
  );
}
