"use client";

import React, { useEffect, useState } from "react";
import { integer } from "@/lib/format";

interface ResumoData {
  totalArrecadado: number;
  quantidadeLancamentos: number;
  grupos: {
    propria: number;
    transferencias: number;
    capital: number;
    detalhes: {
      iptu: number;
      iss: number;
      fpm: number;
      icms: number;
      fundeb: number;
    };
  };
  anosDisponiveis: number[];
}

interface EvolucaoItem {
  exercicio: number;
  valor: number;
}

interface AgrupamentoItem {
  chave: string;
  valor: number;
}

interface MesItem {
  ano: number;
  mes: number;
  valor: number;
}

export function ReceitaArrecadadaDashboardView() {
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const [evolucao, setEvolucao] = useState<EvolucaoItem[]>([]);
  const [porVinculo, setPorVinculo] = useState<AgrupamentoItem[]>([]);
  const [porNatureza, setPorNatureza] = useState<AgrupamentoItem[]>([]);
  const [porFundo, setPorFundo] = useState<AgrupamentoItem[]>([]);
  const [porMes, setPorMes] = useState<MesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParams = anoSelecionado ? `?exercicioInicial=${anoSelecionado}&exercicioFinal=${anoSelecionado}` : '';
        const [resResumo, resEvolucao, resVinculo, resNatureza, resFundo, resMes] = await Promise.all([
          fetch(`/api/receitas/arrecadada/resumo${queryParams}`),
          fetch(`/api/receitas/arrecadada/por-exercicio${queryParams}`),
          fetch(`/api/receitas/arrecadada/por-vinculo${queryParams}`),
          fetch(`/api/receitas/arrecadada/por-natureza${queryParams}`),
          fetch(`/api/receitas/arrecadada/por-fundo${queryParams}`),
          fetch(`/api/receitas/arrecadada/por-mes${queryParams}`)
        ]);
        
        const dataResumo = await resResumo.json();
        const dataEvolucao = await resEvolucao.json();
        const dataVinculo = await resVinculo.json();
        const dataNatureza = await resNatureza.json();
        const dataFundo = await resFundo.json();
        const dataMes = await resMes.json();

        setResumo(dataResumo && !dataResumo.error ? dataResumo : null);
        setEvolucao(Array.isArray(dataEvolucao) ? dataEvolucao : []);
        setPorVinculo(Array.isArray(dataVinculo) ? dataVinculo : []);
        setPorNatureza(Array.isArray(dataNatureza) ? dataNatureza : []);
        setPorFundo(Array.isArray(dataFundo) ? dataFundo : []);
        setPorMes(Array.isArray(dataMes) ? dataMes : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [anoSelecionado]);

  const formatCurrency = (val: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const total = resumo?.totalArrecadado || 0;
  const grupos: ResumoData['grupos'] = resumo?.grupos ?? { propria: 0, transferencias: 0, capital: 0, detalhes: { iptu: 0, iss: 0, fpm: 0, icms: 0, fundeb: 0 } };
  const pctPropria = total ? Math.round((grupos.propria / total) * 100) : 0;

  const maiorReceita = porVinculo.length > 0 ? porVinculo[0] : null;
  const principalNatureza = porNatureza.length > 0 ? porNatureza[0] : null;
  const principalFundo = porFundo.length > 0 ? porFundo[0] : null;
  const totalLancamentos = resumo?.quantidadeLancamentos || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight">Dashboard Receita Arrecadada</h1>
          <p className="text-on-surface-variant mt-1">Análise histórica da arrecadação municipal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-high p-1 rounded-lg">
          <button 
            onClick={() => setAnoSelecionado(null)}
            className={`px-4 py-1.5 rounded-md text-label-md transition-colors ${
              anoSelecionado === null 
                ? 'font-bold bg-white shadow-sm text-tertiary' 
                : 'font-medium text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Geral
          </button>
          {resumo?.anosDisponiveis?.map((ano: number) => (
            <button 
              key={ano}
              onClick={() => setAnoSelecionado(ano)}
              className={`px-4 py-1.5 rounded-md text-label-md transition-colors ${
                anoSelecionado === ano 
                  ? 'font-bold bg-white shadow-sm text-tertiary' 
                  : 'font-medium text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {ano}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-tertiary-container/30 text-tertiary rounded-lg material-symbols-outlined">account_balance</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Total Arrecadado</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : formatCurrency(total)}
            </h3>
          </div>
        </div>

        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-lg material-symbols-outlined">bar_chart</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Lançamentos</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : integer.format(totalLancamentos)}
            </h3>
          </div>
        </div>

        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-green-100 text-green-800 rounded-lg material-symbols-outlined">trending_up</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Receita Própria</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : formatCurrency(grupos.propria)}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">{pctPropria}% do total</p>
          </div>
        </div>

        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Principal Vínculo</p>
            <h3 className="text-xl font-headline font-black text-on-surface truncate">
              {loading ? "Carregando..." : maiorReceita?.chave || "—"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">{maiorReceita ? formatCurrency(maiorReceita.valor) : ""}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-purple-100 text-purple-800 rounded-lg material-symbols-outlined">category</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Principal Natureza</p>
            <h3 className="text-xl font-headline font-black text-on-surface truncate">
              {loading ? "Carregando..." : principalNatureza?.chave || "—"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">{principalNatureza ? formatCurrency(principalNatureza.valor) : ""}</p>
          </div>
        </div>

        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-teal-100 text-teal-800 rounded-lg material-symbols-outlined">savings</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Total por Fundo</p>
            <h3 className="text-xl font-headline font-black text-on-surface truncate">
              {loading ? "Carregando..." : principalFundo?.chave ? `${principalFundo.chave} fundos` : "—"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">{principalFundo ? formatCurrency(principalFundo.valor) : ""}</p>
          </div>
        </div>

        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-lg material-symbols-outlined">calendar_month</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Maior Receita</p>
            <h3 className="text-xl font-headline font-black text-on-surface truncate">
              {loading ? "Carregando..." : maiorReceita?.chave || "—"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">{maiorReceita ? formatCurrency(maiorReceita.valor) : ""}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Evolution Chart */}
        <div className="bg-surface border border-outline-variant p-6 rounded-xl">
          <h4 className="font-bold text-on-surface mb-4">Evolução Anual da Arrecadação</h4>
          <div className="space-y-3">
            {evolucao.map((item) => (
              <div key={item.exercicio} className="flex items-center gap-3">
                <span className="text-sm font-bold text-on-surface-variant w-12">{item.exercicio}</span>
                <div className="flex-1 h-6 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tertiary transition-all duration-500" 
                    style={{ width: `${total ? (item.valor / total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-on-surface w-24 text-right">{integer.format(item.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Evolution */}
        <div className="bg-surface border border-outline-variant p-6 rounded-xl">
          <h4 className="font-bold text-on-surface mb-4">Evolução Mensal</h4>
          <div className="flex items-end gap-2 h-40">
            {porMes.map((item: MesItem) => {
              const maxVal = Math.max(...porMes.map((m) => m.valor), 1);
              const heightPct = (item.valor / maxVal) * 100;
              const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
              return (
                <div key={`${item.ano}-${item.mes}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-32 bg-surface-container rounded-t-lg relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-green-500 transition-all duration-500"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{monthNames[item.mes - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* By Nature and Vinculo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface border border-outline-variant p-6 rounded-xl">
          <h4 className="font-bold text-on-surface mb-4">Arrecadação por Natureza da Receita</h4>
          <div className="space-y-2">
            {porNatureza.slice(0, 10).map((item: AgrupamentoItem) => {
              const pct = total ? (item.valor / total) * 100 : 0;
              return (
                <div key={item.chave} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant w-32 truncate">{item.chave || "—"}</span>
                  <div className="flex-1 h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-on-surface w-20 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface border border-outline-variant p-6 rounded-xl">
          <h4 className="font-bold text-on-surface mb-4">Arrecadação por Vínculo</h4>
          <div className="space-y-2">
            {porVinculo.slice(0, 10).map((item: AgrupamentoItem) => {
              const pct = total ? (item.valor / total) * 100 : 0;
              return (
                <div key={item.chave} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant w-32 truncate">{item.chave || "—"}</span>
                  <div className="flex-1 h-4 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-on-surface w-20 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fundo Distribution */}
      <div className="bg-surface border border-outline-variant p-6 rounded-xl mb-8">
        <h4 className="font-bold text-on-surface mb-4">Arrecadação por Fundo</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {porFundo.slice(0, 8).map((item: AgrupamentoItem) => (
            <div key={item.chave} className="border border-outline-variant p-3 bg-surface rounded-lg">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{item.chave || "Sem fundo"}</p>
              <p className="text-sm font-bold text-on-surface">{formatCurrency(item.valor)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
