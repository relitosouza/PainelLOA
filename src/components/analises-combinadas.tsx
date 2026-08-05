"use client";

import { useEffect, useState } from "react";
import { currency } from "@/lib/format";

type BaseStatusType = "DISPONIVEL" | "PARCIAL" | "INDISPONIVEL";

interface StatusBases {
  loaDespesas: { existe: boolean; count: number; status: BaseStatusType };
  ldoReceitas: { existe: boolean; count: number; status: BaseStatusType };
  loaReceitas: { existe: boolean; count: number; status: BaseStatusType };
  receitaArrecadada: { existe: boolean; count: number; status: BaseStatusType };
}

interface TotaisBases {
  totalDespesaLoa: number;
  totalReceitaLdo: number;
  totalLoaReceitas: number;
  totalReceitaArrecadada: number;
  qtdAnosArrecadacao: number;
}

interface TableRow {
  vinculo: string;
  descricao: string;
  valorReceita: number;
  valorDespesa: number;
  diferenca: number;
  situacao: string;
  totalArrecadado?: number;
}

export function AnalisesCombinadasSection() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<number | null>(1); // Botão 1 selecionado por padrão
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusBases, setStatusBases] = useState<StatusBases>({
    loaDespesas: { existe: true, count: 100, status: "DISPONIVEL" },
    ldoReceitas: { existe: true, count: 50, status: "DISPONIVEL" },
    loaReceitas: { existe: false, count: 0, status: "INDISPONIVEL" },
    receitaArrecadada: { existe: true, count: 1500, status: "DISPONIVEL" },
  });

  const [totais, setTotais] = useState<TotaisBases>({
    totalDespesaLoa: 0,
    totalReceitaLdo: 0,
    totalLoaReceitas: 0,
    totalReceitaArrecadada: 0,
    qtdAnosArrecadacao: 1,
  });

  const [tabelas, setTabelas] = useState<{
    botao1: TableRow[];
    botao4: TableRow[];
  }>({
    botao1: [],
    botao4: [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/analises-combinadas");
        if (!res.ok) throw new Error("Falha ao carregar dados das Análises Combinadas.");
        const json = await res.json();
        if (json.statusBases) setStatusBases(json.statusBases);
        if (json.totais) setTotais(json.totais);
        if (json.tabelas) setTabelas(json.tabelas);
      } catch (err) {
        console.warn("Usando estado fallback para Análises Combinadas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Determinar status de disponibilidade dos 5 botões
  const getButtonAvailability = (id: number) => {
    switch (id) {
      case 1: // Despesa LOA x Receita LDO
        if (!statusBases.loaDespesas.existe || !statusBases.ldoReceitas.existe) {
          const faltando = !statusBases.loaDespesas.existe ? "LOA Despesas" : "LDO Receitas";
          return {
            status: "INDISPONIVEL" as BaseStatusType,
            badgeText: "Indisponível",
            badgeClass: "bg-surface-container text-on-surface-variant border border-outline-variant",
            warning: `Importe a base ${faltando} para executar esta análise.`,
          };
        }
        return {
          status: "DISPONIVEL" as BaseStatusType,
          badgeText: "Disponível",
          badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
          warning: null,
        };

      case 2: // Despesa LOA x Receita LOA
        if (!statusBases.loaReceitas.existe) {
          return {
            status: "INDISPONIVEL" as BaseStatusType,
            badgeText: "Indisponível",
            badgeClass: "bg-surface-container text-on-surface-variant border border-outline-variant opacity-75",
            warning: "Não é possível executar esta análise porque a base LOA Receitas ainda não foi importada.",
          };
        }
        return {
          status: "DISPONIVEL" as BaseStatusType,
          badgeText: "Disponível",
          badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
          warning: null,
        };

      case 3: // Receita LDO x Receita LOA
        if (!statusBases.loaReceitas.existe) {
          return {
            status: "INDISPONIVEL" as BaseStatusType,
            badgeText: "Indisponível",
            badgeClass: "bg-surface-container text-on-surface-variant border border-outline-variant opacity-75",
            warning: "Importe a base LOA Receitas para comparar com a previsão da LDO.",
          };
        }
        return {
          status: "DISPONIVEL" as BaseStatusType,
          badgeText: "Disponível",
          badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
          warning: null,
        };

      case 4: // Receita Arrecadada x Receita LDO
        if (!statusBases.receitaArrecadada.existe || !statusBases.ldoReceitas.existe) {
          return {
            status: "INDISPONIVEL" as BaseStatusType,
            badgeText: "Indisponível",
            badgeClass: "bg-surface-container text-on-surface-variant border border-outline-variant opacity-75",
            warning: "Importe as bases de Receita Arrecadada e LDO Receitas para executar esta análise.",
          };
        }
        return {
          status: "DISPONIVEL" as BaseStatusType,
          badgeText: "Disponível",
          badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
          warning: null,
        };

      case 5: // Receita Arrecadada x Receita LOA
        if (!statusBases.loaReceitas.existe) {
          return {
            status: "INDISPONIVEL" as BaseStatusType,
            badgeText: "Indisponível",
            badgeClass: "bg-surface-container text-on-surface-variant border border-outline-variant opacity-75",
            warning: "Importe a base LOA Receitas para comparar com a arrecadação histórica.",
          };
        }
        return {
          status: "DISPONIVEL" as BaseStatusType,
          badgeText: "Disponível",
          badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
          warning: null,
        };

      default:
        return {
          status: "INDISPONIVEL" as BaseStatusType,
          badgeText: "Indisponível",
          badgeClass: "bg-surface-container text-on-surface-variant border border-outline-variant",
          warning: null,
        };
    }
  };

  const buttonsConfig = [
    {
      id: 1,
      title: "Despesa LOA x Receita LDO",
      desc: "Compara a despesa fixada na LOA com a receita prevista na LDO.",
      icon: "balance",
      bases: "LOA Despesas + LDO Receitas",
    },
    {
      id: 2,
      title: "Despesa LOA x Receita LOA",
      desc: "Verifica o equilíbrio oficial entre receitas previstas e despesas fixadas na LOA.",
      icon: "account_balance_wallet",
      bases: "LOA Despesas + LOA Receitas",
    },
    {
      id: 3,
      title: "Receita LDO x Receita LOA",
      desc: "Compara a previsão da LDO com a receita prevista na LOA.",
      icon: "compare_arrows",
      bases: "LDO Receitas + LOA Receitas",
    },
    {
      id: 4,
      title: "Receita Arrecadada x Receita LDO",
      desc: "Compara o histórico arrecadado com a previsão da LDO.",
      icon: "history",
      bases: "Receita Arrecadada + LDO Receitas",
    },
    {
      id: 5,
      title: "Receita Arrecadada x Receita LOA",
      desc: "Compara a arrecadação histórica com a previsão da LOA.",
      icon: "analytics",
      bases: "Receita Arrecadada + LOA Receitas",
    },
  ];

  const renderAnalysisResults = () => {
    if (!selectedAnalysis) return null;

    const currentConfig = buttonsConfig.find((b) => b.id === selectedAnalysis);
    const availability = getButtonAvailability(selectedAnalysis);

    if (availability.status === "INDISPONIVEL") {
      return (
        <div className="glass-card p-8 text-center border-l-4 border-l-amber-500 animate-fade-in mt-6 bg-surface">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <h4 className="text-base font-bold text-on-surface mb-1">
            Análise Indisponível: {currentConfig?.title}
          </h4>
          <p className="text-sm text-on-surface-variant max-w-lg mx-auto mb-4">
            {availability.warning}
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Bases requeridas: {currentConfig?.bases}
          </div>
        </div>
      );
    }

    // Botão 1: Despesa LOA x Receita LDO
    if (selectedAnalysis === 1) {
      const recLdo = totais.totalReceitaLdo;
      const despLoa = totais.totalDespesaLoa;
      const diff = recLdo - despLoa;

      let situacaoText = "Compatível / Equilibrado";
      let situacaoTone = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300";
      if (diff > 0) {
        situacaoText = "Receita LDO maior que a despesa";
        situacaoTone = "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300";
      } else if (diff < 0) {
        situacaoText = "Despesa LOA maior que Receita LDO";
        situacaoTone = "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300";
      }

      // Máximo para o gráfico de barras
      const maxVal = Math.max(recLdo, despLoa, Math.abs(diff), 1);

      return (
        <div className="space-y-6 mt-6 animate-fade-in">
          {/* Header da Análise Selecionada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-outline-variant shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h3 className="text-base font-headline font-bold text-on-surface">
                  Análise: Despesa LOA x Receita LDO
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Comparação entre o orçamento fixado na LOA e a previsão aprovada na LDO por valor total e por vínculo.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Análise Ativa
            </span>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Receita LDO Total
              </p>
              <h4 className="text-xl font-headline font-extrabold text-on-surface">
                {currency.format(recLdo)}
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Previsão consolidada LDO</p>
            </div>

            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Despesa LOA Total
              </p>
              <h4 className="text-xl font-headline font-extrabold text-on-surface">
                {currency.format(despLoa)}
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Fixada na LOA importada</p>
            </div>

            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Diferença
              </p>
              <h4 className={`text-xl font-headline font-extrabold ${diff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {diff > 0 ? "+" : ""}{currency.format(diff)}
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Receita LDO - Despesa LOA</p>
            </div>

            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Situação
              </p>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg border ${situacaoTone}`}>
                  {situacaoText}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2">Diagnóstico de compatibilidade</p>
            </div>
          </div>

          {/* Gráfico Simples Comparativo */}
          <div className="glass-card p-6 bg-surface">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Gráfico Comparativo de Totais
            </h4>
            <div className="space-y-4 max-w-2xl">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-on-surface">Receita LDO Prevista</span>
                  <span className="text-primary font-bold">{currency.format(recLdo)}</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (recLdo / maxVal) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-on-surface">Despesa LOA Fixada</span>
                  <span className="text-secondary font-bold">{currency.format(despLoa)}</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (despLoa / maxVal) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-on-surface">Diferença (Saldo)</span>
                  <span className={`font-bold ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {currency.format(diff)}
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${diff >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(100, (Math.abs(diff) / maxVal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="space-y-3">
            {diff < 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-300">
                <span className="material-symbols-outlined text-rose-600 text-lg">warning</span>
                <div>
                  <strong className="font-bold">Alerta de Déficit:</strong> A despesa fixada na LOA supera a previsão de receita da LDO em {currency.format(Math.abs(diff))}.
                </div>
              </div>
            )}
            {tabelas.botao1.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-3 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300">
                <span className="material-symbols-outlined text-amber-600 text-lg">info</span>
                <div>
                  <strong className="font-bold">Comparação Geral:</strong> A despesa importada não possui classificação direta por Vínculo na planilha atual. A comparação foi realizada pelo Total Geral do município.
                </div>
              </div>
            )}
          </div>

          {/* Tabela Comparativa */}
          {tabelas.botao1.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-outline-variant bg-surface flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Comparativo por Vínculo de Receita LDO</h4>
                  <p className="text-xs text-on-surface-variant">Detalhamento das previsões de receita por fonte/vínculo</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  {tabelas.botao1.length} Vínculos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold tracking-wider uppercase">
                      <th className="px-4 py-3">Vínculo</th>
                      <th className="px-4 py-3">Descrição Vínculo</th>
                      <th className="px-4 py-3 text-right">Valor Receita LDO</th>
                      <th className="px-4 py-3 text-right">Diferença</th>
                      <th className="px-4 py-3">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {tabelas.botao1.slice(0, 10).map((row) => (
                      <tr key={row.vinculo} className="hover:bg-surface-container-low/30">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{row.vinculo}</td>
                        <td className="px-4 py-3 text-on-surface max-w-xs truncate">{row.descricao}</td>
                        <td className="px-4 py-3 text-right font-semibold text-on-surface">{currency.format(row.valorReceita)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${row.diferenca >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {currency.format(row.diferenca)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {row.situacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Botão 4: Receita Arrecadada x Receita LDO
    if (selectedAnalysis === 4) {
      const arrTotal = totais.totalReceitaArrecadada;
      const recLdo = totais.totalReceitaLdo;
      const mediaHistorica = arrTotal / totais.qtdAnosArrecadacao;

      return (
        <div className="space-y-6 mt-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-outline-variant shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="text-base font-headline font-bold text-on-surface">
                  Análise: Receita Arrecadada x Receita LDO
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Compara a média histórica de arrecadação ({totais.qtdAnosArrecadacao} ano(s)) com a meta estipulada na LDO.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Média Histórica Arrecadada
              </p>
              <h4 className="text-xl font-headline font-extrabold text-on-surface">
                {currency.format(mediaHistorica)}
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Baseado no histórico do sistema</p>
            </div>

            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Receita LDO Prevista
              </p>
              <h4 className="text-xl font-headline font-extrabold text-on-surface">
                {currency.format(recLdo)}
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Previsão oficial LDO</p>
            </div>

            <div className="glass-card p-5 bg-surface">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Variação / Sustentabilidade
              </p>
              <h4 className={`text-xl font-headline font-extrabold ${recLdo <= mediaHistorica * 1.15 ? "text-emerald-700" : "text-amber-700"}`}>
                {recLdo > mediaHistorica ? "+" : ""}{(((recLdo - mediaHistorica) / (mediaHistorica || 1)) * 100).toFixed(1)}%
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-1.5">LDO em relação à média</p>
            </div>
          </div>

          {tabelas.botao4.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-outline-variant bg-surface flex items-center justify-between">
                <h4 className="text-sm font-bold text-on-surface">Sustentabilidade da LDO por Vínculo</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold tracking-wider uppercase">
                      <th className="px-4 py-3">Vínculo</th>
                      <th className="px-4 py-3">Descrição Vínculo</th>
                      <th className="px-4 py-3 text-right">Média Arrecadada</th>
                      <th className="px-4 py-3 text-right">Previsto LDO</th>
                      <th className="px-4 py-3">Situação Histórica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {tabelas.botao4.slice(0, 10).map((row) => (
                      <tr key={row.vinculo} className="hover:bg-surface-container-low/30">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{row.vinculo}</td>
                        <td className="px-4 py-3 text-on-surface max-w-xs truncate">{row.descricao}</td>
                        <td className="px-4 py-3 text-right font-semibold text-on-surface">{currency.format(row.valorReceita)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{currency.format(row.valorDespesa)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                            row.situacao.includes("acima")
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : row.situacao.includes("sem histórico")
                              ? "bg-surface-container text-on-surface-variant border border-outline-variant"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {row.situacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="glass-card p-6 bg-surface border border-outline-variant rounded-xl my-6">
      {/* Cabeçalho da Seção */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-primary mb-1">
          <span className="material-symbols-outlined text-2xl">compare</span>
          <h3 className="text-lg font-headline font-bold text-on-surface tracking-tight">
            Análises Combinadas
          </h3>
        </div>
        <p className="text-xs text-on-surface-variant max-w-3xl">
          Combine as bases já importadas para verificar equilíbrio, compatibilidade e variações entre LDO, LOA e arrecadação.
        </p>
      </div>

      {/* Grid de Botões/Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {buttonsConfig.map((btn) => {
          const availability = getButtonAvailability(btn.id);
          const isSelected = selectedAnalysis === btn.id;
          const isDisabled = availability.status === "INDISPONIVEL";

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedAnalysis(btn.id)}
              className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-blue-50/70 border-primary shadow-md ring-2 ring-primary/20 dark:bg-blue-950/40"
                  : isDisabled
                  ? "bg-surface-container/50 border-outline-variant/50 opacity-70 hover:opacity-90"
                  : "bg-surface border-outline-variant hover:border-primary/50 hover:bg-surface-container-low shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-surface-container text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${availability.badgeClass}`}>
                    {availability.badgeText}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-on-surface line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                  {btn.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                  {btn.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                <span className="truncate pr-1">{btn.bases}</span>
                <span className="material-symbols-outlined text-[14px] shrink-0">
                  {isSelected ? "check_circle" : "chevron_right"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resultados da Análise Selecionada */}
      {renderAnalysisResults()}
    </section>
  );
}
