"use client";

import React from "react";
import { currency, integer, percent } from "@/lib/format";
import type { AnaliseLoaLayoutConfig } from "../analise-loa-cards-config-dialog";

interface AnaliseLoaKpisProps {
  layoutConfig: AnaliseLoaLayoutConfig;
  ldoReceitaTotal: number;
  ldoReceitaEntidades: Array<{ nome: string; valor: number }>;
  loaReceitaResumo: { total: number; maior: { natureza: string; valor: number } | null; qtdFontes: number; entidades: Array<{ nome: string; valor: number }> };
  loaExpectativaTotal: number;
  metrics: {
    valLdoTotal: number;
    valLoaTotal: number;
    valLoa2026Total: number;
    valorSugestaoSfTotal: number;
    valorCorteGpTotal: number;
    diff: number;
    percentExec: number;
    totalNaturezas: number;
  };
}

export const AnaliseLoaReceitaKpis = React.memo(function AnaliseLoaReceitaKpis({
  layoutConfig,
  ldoReceitaTotal,
  ldoReceitaEntidades,
  loaReceitaResumo,
}: Pick<AnaliseLoaKpisProps, "layoutConfig" | "ldoReceitaTotal" | "ldoReceitaEntidades" | "loaReceitaResumo">) {
  const recLdoEntidades = ldoReceitaEntidades.reduce((sum, entidade) => sum + entidade.valor, 0);
  const recLdoPrefeitura = ldoReceitaTotal - recLdoEntidades;
  const recLoaEntidades = loaReceitaResumo.entidades.reduce((sum, entidade) => sum + entidade.valor, 0);
  const recLoa = loaReceitaResumo.total + recLoaEntidades;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
        <span className="material-symbols-outlined text-sm text-emerald-600">account_balance_wallet</span>
        <span>Painel da Receita Orçamentária</span>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {layoutConfig.receitaKpisOrder.map((kpiId) => {
          if (layoutConfig.visibility[kpiId] === false) return null;

          if (kpiId === "rec-ldo") {
            return (
              <div key="rec-ldo" className="glass-card bg-surface p-4 border-t-2 border-t-emerald-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LDO</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(ldoReceitaTotal)}
                </h3>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">Receita Planejada LDO</p>
                {ldoReceitaEntidades.length > 0 && (
                  <p
                    className="text-[10px] text-on-surface-variant mt-1"
                    title={[`Prefeitura: ${currency.format(recLdoPrefeitura)}`, ...ldoReceitaEntidades.map((e) => `${e.nome}: ${currency.format(e.valor)}`)].join("\n")}
                  >
                    Prefeitura {currency.format(recLdoPrefeitura)} + indiretas {currency.format(recLdoEntidades)}
                  </p>
                )}
              </div>
            );
          }

          if (kpiId === "rec-loa") {
            return (
              <div key="rec-loa" className="glass-card bg-surface p-4 border-t-2 border-t-blue-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LOA</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(recLoa)}
                </h3>
                <p className="text-[10px] text-blue-700 font-semibold mt-1">Receita Fixada LOA</p>
                <p
                  className="text-[10px] text-on-surface-variant mt-1"
                  title={[`Prefeitura: ${currency.format(loaReceitaResumo.total)}`, ...loaReceitaResumo.entidades.map((e) => `${e.nome}: ${currency.format(e.valor)}`)].join("\n")}
                >
                  Prefeitura {currency.format(loaReceitaResumo.total)} + indiretas {currency.format(recLoaEntidades)}
                </p>
              </div>
            );
          }

          if (kpiId === "rec-diff") {
            const recLdo = ldoReceitaTotal;
            const recDiff = recLoa - recLdo;
            const isGreater = recDiff > 0;
            const isSmaller = recDiff < 0;

            return (
              <div key="rec-diff" className={`glass-card bg-surface p-4 border-t-2 ${isGreater ? "border-t-rose-500 bg-rose-50/20" : isSmaller ? "border-t-emerald-500" : "border-t-gray-400"} shadow-sm rounded-xl`}>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diferença (LOA - LDO)</p>
                <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${isGreater ? "text-rose-600" : isSmaller ? "text-emerald-600" : "text-on-surface"}`}>
                  {isGreater ? "▲" : isSmaller ? "▼" : "—"} {currency.format(Math.abs(recDiff))}
                </h3>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {isGreater ? "⚠️ LOA maior que a LDO (+ Excesso)" : isSmaller ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
                </p>
              </div>
            );
          }

          if (kpiId === "rec-exec") {
            return (
              <div key="rec-exec" className="glass-card bg-surface p-4 border-t-2 border-t-tertiary shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Execução Planejamento</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {percent.format(ldoReceitaTotal > 0 ? recLoa / ldoReceitaTotal : 0)}
                </h3>
                <p className="text-[10px] text-tertiary font-semibold mt-1">Transformado em LOA</p>
              </div>
            );
          }

          if (kpiId === "rec-maior") {
            return (
              <div key="rec-maior" className="glass-card bg-surface p-4 border-t-2 border-t-teal-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Maior Receita LOA</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(loaReceitaResumo.maior?.valor ?? 0)}
                </h3>
                <p className="text-[10px] text-teal-700 font-semibold mt-1">{loaReceitaResumo.maior?.natureza ?? "Sem receita LOA"}</p>
              </div>
            );
          }

          if (kpiId === "rec-fontes") {
            return (
              <div key="rec-fontes" className="glass-card bg-surface p-4 border-t-2 border-t-amber-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Fontes / Vínculos</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {integer.format(loaReceitaResumo.qtdFontes)}
                </h3>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">Fontes com receita na LOA</p>
              </div>
            );
          }

          return null;
        })}
      </section>
    </div>
  );
});

export const AnaliseLoaDespesaKpis = React.memo(function AnaliseLoaDespesaKpis({
  layoutConfig,
  loaExpectativaTotal,
  metrics,
}: Pick<AnaliseLoaKpisProps, "layoutConfig" | "loaExpectativaTotal" | "metrics">) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
        <span className="material-symbols-outlined text-sm text-blue-600">payments</span>
        <span>Painel da Despesa Orçamentária</span>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {layoutConfig.despesaKpisOrder.map((kpiId) => {
          if (layoutConfig.visibility[kpiId] === false) return null;

          if (kpiId === "desp-ldo") {
            return (
              <div key="desp-ldo" className="glass-card bg-surface p-4 border-t-2 border-t-emerald-500 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LDO</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(metrics.valLdoTotal)}
                </h3>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">Despesa Planejada</p>
              </div>
            );
          }

          if (kpiId === "desp-loa") {
            return (
              <div key="desp-loa" className="glass-card bg-surface p-4 border-t-2 border-t-blue-500 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LOA</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(metrics.valLoaTotal)}
                </h3>
                <p className="text-[10px] text-blue-700 font-semibold mt-1">Despesa Fixada</p>
              </div>
            );
          }

          if (kpiId === "desp-diff") {
            return (
              <div key="desp-diff" className={`glass-card bg-surface p-4 border-t-2 ${metrics.diff > 0 ? "border-t-rose-500 bg-rose-50/20" : metrics.diff < 0 ? "border-t-emerald-500" : "border-t-gray-400"} shadow-sm rounded-xl`}>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diferença (LOA - LDO)</p>
                <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${metrics.diff > 0 ? "text-rose-600" : metrics.diff < 0 ? "text-emerald-600" : "text-on-surface"}`}>
                  {metrics.diff > 0 ? "▲" : metrics.diff < 0 ? "▼" : "—"} {currency.format(Math.abs(metrics.diff))}
                </h3>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {metrics.diff > 0 ? "⚠️ LOA maior que a LDO (+ Excesso)" : metrics.diff < 0 ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
                </p>
              </div>
            );
          }

          if (kpiId === "desp-expectativa") {
            return (
              <div key="desp-expectativa" className="glass-card bg-surface p-4 border-t-2 border-t-primary-container shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Expectativa LOA</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(loaExpectativaTotal)}
                </h3>
                <p className="text-[10px] text-primary font-semibold mt-1">Expectativa LOA Fixada</p>
              </div>
            );
          }

          if (kpiId === "desp-exec") {
            return (
              <div key="desp-exec" className="glass-card bg-surface p-4 border-t-2 border-t-teal-500 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Execução Planejamento</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {percent.format(metrics.percentExec / 100)}
                </h3>
                <p className="text-[10px] text-teal-700 font-semibold mt-1">Transformado em LOA</p>
              </div>
            );
          }

          if (kpiId === "desp-loa2026") {
            return (
              <div key="desp-loa2026" className="glass-card bg-surface p-4 border-t-2 border-t-slate-500 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor LOA 2026</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {currency.format(metrics.valLoa2026Total)}
                </h3>
                <p className="text-[10px] text-on-surface-variant font-semibold mt-1">Dotação inicial 2026</p>
              </div>
            );
          }

          if (kpiId === "desp-sugestao-sf") {
            return (
              <div key="desp-sugestao-sf" className="glass-card bg-surface p-4 border-t-2 border-t-amber-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Sugestão SF</p>
                <h3 className="text-lg font-headline font-extrabold text-amber-700">
                  {currency.format(metrics.valorSugestaoSfTotal)}
                </h3>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">Cortes sugeridos</p>
              </div>
            );
          }

          if (kpiId === "desp-corte-gp") {
            return (
              <div key="desp-corte-gp" className="glass-card bg-surface p-4 border-t-2 border-t-rose-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Corte GP</p>
                <h3 className="text-lg font-headline font-extrabold text-rose-700">
                  {currency.format(metrics.valorCorteGpTotal)}
                </h3>
                <p className="text-[10px] text-rose-700 font-semibold mt-1">Cortes definidos</p>
              </div>
            );
          }

          if (kpiId === "desp-naturezas") {
            return (
              <div key="desp-naturezas" className="glass-card bg-surface p-4 border-t-2 border-t-amber-500 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total de Naturezas</p>
                <h3 className="text-lg font-headline font-extrabold text-on-surface">
                  {integer.format(metrics.totalNaturezas)}
                </h3>
                <p className="text-[10px] text-on-surface-variant mt-1">Classificações econômicas</p>
              </div>
            );
          }

          return null;
        })}
      </section>
    </div>
  );
});
