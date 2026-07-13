"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export function RevenueDetailView() {
  const [resumo, setResumo] = useState<any>(null);
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParams = anoSelecionado ? `?exercicioInicial=${anoSelecionado}&exercicioFinal=${anoSelecionado}` : '';
        const [resResumo, resEvolucao] = await Promise.all([
          fetch(`/api/receitas-historicas/resumo${queryParams}`),
          fetch(`/api/receitas-historicas/evolucao`)
        ]);
        
        setResumo(await resResumo.json());
        setEvolucao(await resEvolucao.json());
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
  const grupos = resumo?.grupos || {};
  const pctTransferencias = total ? Math.round((grupos.transferencias / total) * 100) : 0;
  const acimaDaMedia = pctTransferencias > 48;
  const pctCapital = total ? Math.round(((grupos.capital || 0) / total) * 100) : 0;
  const pctCorrentes = total ? 100 - pctCapital : 100;

  return (
    <div className="space-y-8 animate-fade-in">
      <style dangerouslySetInnerHTML={{__html: `
        .recipe-gradient {
            background: linear-gradient(135deg, #005da7 0%, #2e7d32 100%);
        }
        .bento-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .bento-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px -5px rgba(0,0,0,0.1);
        }
      `}} />
      
      {/* Header & Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight">Análise Detalhada de Receitas</h1>
          <p className="text-on-surface-variant mt-1">Acompanhamento em tempo real da arrecadação e transferências.</p>
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
        {/* Total Revenue */}
        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-tertiary-container/30 text-tertiary rounded-lg material-symbols-outlined">account_balance</span>
            <span className="text-label-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+4.2%</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Receita Total</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : formatCurrency(total)}
            </h3>
          </div>
        </div>

        {/* Own Revenue */}
        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-green-100 text-green-800 rounded-lg material-symbols-outlined">home_work</span>
            <span className="text-label-sm font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">IPTU, ISS, Taxas</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Receita Própria</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : formatCurrency(grupos.propria)}
            </h3>
            <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-green-600 h-full" style={{ width: `${total ? (grupos.propria / total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Transfers */}
        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-lg material-symbols-outlined">move_to_inbox</span>
            <span className="text-label-sm font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">FPM, ICMS, SUS</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Transferências</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : formatCurrency(grupos.transferencias)}
            </h3>
            <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: `${total ? (grupos.transferencias / total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Capital Revenue */}
        <div className="bento-card bg-surface border border-outline-variant p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg material-symbols-outlined">trending_up</span>
            <span className="text-label-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Alienação/Op. Créd.</span>
          </div>
          <div className="mt-4">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Receita de Capital</p>
            <h3 className="text-2xl font-headline font-black text-on-surface">
              {loading ? "Carregando..." : formatCurrency(grupos.capital)}
            </h3>
          </div>
        </div>
      </div>

      {/* Alert & Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Alert Section */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className={`border-l-4 p-6 rounded-xl ${acimaDaMedia ? 'bg-error-container/20 border-error' : 'bg-green-50 border-green-500'}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`material-symbols-outlined ${acimaDaMedia ? 'text-error' : 'text-green-600'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {acimaDaMedia ? 'warning' : 'check_circle'}
              </span>
              <h4 className={`font-bold ${acimaDaMedia ? 'text-on-error-container' : 'text-green-800'}`}>
                {acimaDaMedia ? 'Alerta de Vulnerabilidade' : 'Indicador Saudável'}
              </h4>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
              A <span className="font-bold">Dependência de Transferências ({loading ? '...' : pctTransferencias}%)</span> está 
              {acimaDaMedia ? ' acima ' : ' abaixo '} da média histórica de 48%. Isso indica que a gestão municipal {acimaDaMedia ? 'é sensível a flutuações de repasses externos (FPM/ICMS).' : 'possui boa autonomia financeira baseada em arrecadação própria.'}
            </p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black ${acimaDaMedia ? 'text-error' : 'text-green-600'}`}>{loading ? '-' : pctTransferencias}%</span>
              <span className={`text-label-sm font-medium mb-1 ${acimaDaMedia ? 'text-error' : 'text-green-600'}`}>da receita total</span>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-surface border border-outline-variant p-6 rounded-xl flex-1 relative overflow-hidden">
            <h4 className="font-bold text-on-surface mb-6">Receita Corrente vs Capital</h4>
            <div className="flex items-center justify-center py-8">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f0eded" strokeWidth="4"></circle>
                  <circle cx="18" cy="18" fill="transparent" r="16" stroke="#005da7" strokeDasharray={`${pctCorrentes} 100`} strokeWidth="4"></circle>
                  <circle cx="18" cy="18" fill="transparent" r="16" stroke="#2e7d32" strokeDasharray={`${pctCapital} 100`} strokeDashoffset={`-${pctCorrentes}`} strokeWidth="4"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">100%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary"></div> Correntes</span>
                <span className="font-bold">{loading ? '-' : pctCorrentes}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div> Capital</span>
                <span className="font-bold">{loading ? '-' : pctCapital}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Section */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h4 className="font-bold text-on-surface">Principais Fontes de Receita</h4>
            <button className="text-tertiary text-label-md font-bold flex items-center gap-1 hover:underline">
              Ver Detalhado <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant">Fonte</th>
                  <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant">Tipo</th>
                  <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant text-right">Valor Realizado</th>
                  <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant text-right">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-medium text-on-surface">FPM - Fundo Particip. Municípios</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">Transferência União</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatCurrency(grupos.detalhes?.fpm)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-tertiary">{total ? ((grupos.detalhes?.fpm / total) * 100).toFixed(1) : 0}%</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-medium text-on-surface">ICMS - Cota Parte Estadual</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">Transferência Estado</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatCurrency(grupos.detalhes?.icms)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-tertiary">{total ? ((grupos.detalhes?.icms / total) * 100).toFixed(1) : 0}%</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-medium text-on-surface">ISS - Serviços</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-xs font-bold">Própria</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatCurrency(grupos.detalhes?.iss)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-green-600">{total ? ((grupos.detalhes?.iss / total) * 100).toFixed(1) : 0}%</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-medium text-on-surface">IPTU - Territorial Urbano</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-xs font-bold">Própria</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatCurrency(grupos.detalhes?.iptu)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-green-600">{total ? ((grupos.detalhes?.iptu / total) * 100).toFixed(1) : 0}%</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-medium text-on-surface">FUNDEB</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">Vinc. Educação</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatCurrency(grupos.detalhes?.fundeb)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-tertiary">{total ? ((grupos.detalhes?.fundeb / total) * 100).toFixed(1) : 0}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* IA Insights Section */}
      <section className="bg-inverse-surface text-inverse-on-surface rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-tertiary rounded-lg material-symbols-outlined text-on-tertiary">psychology</span>
              <h2 className="text-2xl font-headline font-bold">Insights Inteligentes da Sala</h2>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1 bg-tertiary rounded-full"></div>
                <div>
                  <p className="font-bold text-lg mb-1">Crescimento Acima da Inflação</p>
                  <p className="text-surface-variant/80 text-sm">A arrecadação de ISS superou o IPCA acumulado em 2.4% este semestre, impulsionada pelo setor de serviços tecnológicos no polo industrial norte.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-lg mb-1">Otimização de Créditos</p>
                  <p className="text-surface-variant/80 text-sm">O novo programa de refinanciamento (REFIS) projeta uma entrada de R$ 12M extras para o próximo trimestre, reduzindo o estoque de dívida ativa.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-80 h-64 relative rounded-xl overflow-hidden border border-white/10 group">
            <img 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt="AI Insight" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQJIBwRHVQrO3jK83ot_kWkKT9hrtR2m0SruKrKFJt0z_-fYAB4UDJtfsk07LTFBs4l_aZYT687FthxbF7USVqV0byj1fi2d2V7Ovd5k56glm_sdtgQwnXyTNYQNWNOIRgYcazcvGhPTsfOW-z4A-dO3qYnrIuRq3igYF8P6MevEPKQFz-iB21G9Woftbpedkl5Lk2JyXvsI8lqZct97p69VdbZjXDIkeM3JfFmdf0rOPoU1f9Rm6QEyfg0rmZLDoSEw-suHK7swMw" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] uppercase tracking-widest font-black opacity-50">Visual Data Engine</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
