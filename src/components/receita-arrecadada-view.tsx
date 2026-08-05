"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReceitaArrecadadaDashboardView } from "./receita-arrecadada-dashboard-view";
import { ReceitaArrecadadaAnaliticaView } from "./receita-arrecadada-analitica-view";
import { LdoReceitaView } from "./ldo-receita-view";

export function ReceitaArrecadadaView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as "ldo" | "loa" | "arrecadada") || "ldo";
  const [activeTab, setActiveTab] = useState<"ldo" | "loa" | "arrecadada">(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab") as "ldo" | "loa" | "arrecadada";
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho Unificado da Página */}
      <header className="border-b border-outline-variant/30 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            RECEITAS MUNICIPAIS
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Painel de Receitas Municipais</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Acompanhe as receitas da LDO, da LOA e a análise da arrecadação municipal.
          </p>
        </div>

        {/* Abas Principais do Painel conforme a figura */}
        <div className="flex gap-2 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ldo")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "ldo"
                ? "border-primary text-primary bg-surface-container font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">description</span>
            <span>Receitas LDO</span>
          </button>

          <button
            onClick={() => setActiveTab("loa")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "loa"
                ? "border-primary text-primary bg-surface-container font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">subtitles</span>
            <span>Receitas LOA</span>
          </button>

          <button
            onClick={() => setActiveTab("arrecadada")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "arrecadada"
                ? "border-primary text-primary bg-surface-container font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">monitoring</span>
            <span>Análise de Receita Arrecadada</span>
          </button>
        </div>
      </header>

      {/* Conteúdo da Aba Principal Selecionada */}
      {activeTab === "ldo" ? (
        <LdoReceitaView />
      ) : activeTab === "loa" ? (
        <div className="bg-surface border border-outline-variant rounded-xl p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary">account_balance</span>
          <h3 className="text-lg font-bold text-on-surface">Módulo Receitas LOA</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Visualização e detalhamento das receitas orçamentárias previstas na LOA por vínculo, fonte e natureza de receita.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-semibold text-on-surface-variant">Visão Geral & KPIs</span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-semibold text-on-surface-variant">Tabela Analítica</span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-semibold text-on-surface-variant">Comparativos LDO vs LOA</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-outline-variant/20 pb-2">
            <span className="px-4 py-1.5 text-xs font-bold bg-surface-container text-primary rounded-lg">Visão Geral & KPIs</span>
            <span className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant">Tabela Analítica</span>
            <span className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant">Evolução Histórica</span>
            <span className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant">Histórico</span>
          </div>

          <ReceitaArrecadadaDashboardView />
          <ReceitaArrecadadaAnaliticaView />
        </div>
      )}
    </div>
  );
}
