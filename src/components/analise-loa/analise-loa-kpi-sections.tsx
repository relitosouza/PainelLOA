"use client";

import React from "react";
import { currency, integer, percent } from "@/lib/format";
import type { AnaliseLoaLayoutConfig } from "../analise-loa-cards-config-dialog";

interface AnaliseLoaKpisProps {
  layoutConfig: AnaliseLoaLayoutConfig;
  ldoReceitaTotal: number;
  ldoReceitaEntidades: Array<{ nome: string; valor: number }>;
  /** `total` é a receita LOA inteira; `entidades` são as UGs indiretas (CMO, FITO, IPMO) e o restante é a direta (PMO). */
  loaReceitaResumo: { total: number; prefeitura: number; maior: { natureza: string; valor: number } | null; qtdFontes: number; entidades: Array<{ nome: string; valor: number }> };
  loaExpectativaTotal: number;
  /** Total da LOA 2026 (todas as dotações), independente dos filtros do painel. */
  loa2026Total: number;
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
  const recLoaEntidades = Math.round(loaReceitaResumo.entidades.reduce((sum, entidade) => sum + entidade.valor, 0) * 100) / 100;
  // A UG vem da importação da receita: PMO é a administração direta; CMO, FITO e IPMO são as indiretas.
  const recLoaPrefeitura = Math.round((loaReceitaResumo.prefeitura || loaReceitaResumo.total - recLoaEntidades) * 100) / 100;
  const recLoa = Math.round((recLoaPrefeitura + recLoaEntidades) * 100) / 100;
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
                  title={[`PMO (direta): ${currency.format(recLoaPrefeitura)}`, ...loaReceitaResumo.entidades.map((e) => `${e.nome}: ${currency.format(e.valor)}`)].join("\n")}
                >
                  PMO {currency.format(recLoaPrefeitura)} + indiretas {currency.format(recLoaEntidades)}
                </p>
                {loaReceitaResumo.entidades.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {loaReceitaResumo.entidades.map((entidade) => (
                      <li key={entidade.nome} className="flex justify-between gap-2 text-[10px] text-on-surface-variant">
                        <span>{entidade.nome}</span>
                        <span className="font-semibold tabular-nums">{currency.format(entidade.valor)}</span>
                      </li>
                    ))}
                  </ul>
                )}
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
  loa2026Total,
  metrics,
  aplicarSugestaoSf: aplicarSugestaoSfProp,
  onToggleSugestaoSf: onToggleSugestaoSfProp,
}: Pick<AnaliseLoaKpisProps, "layoutConfig" | "loaExpectativaTotal" | "loa2026Total" | "metrics"> & {
  aplicarSugestaoSf?: boolean;
  onToggleSugestaoSf?: () => void;
}) {
  const [internalAplicarSugestaoSf, setInternalAplicarSugestaoSf] = React.useState(false);
  const aplicarSugestaoSf = aplicarSugestaoSfProp !== undefined ? aplicarSugestaoSfProp : internalAplicarSugestaoSf;
  const handleToggleSugestaoSf = onToggleSugestaoSfProp || (() => setInternalAplicarSugestaoSf((prev) => !prev));

  // Quando aplicarSugestaoSf estiver ativo, recalcula a LOA e a Diferença (LOA - LDO)
  const effectiveValLoa = aplicarSugestaoSf
    ? metrics.valLoaTotal + metrics.valorSugestaoSfTotal
    : metrics.valLoaTotal;
  const effectiveDiff = effectiveValLoa - metrics.valLdoTotal;

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
              <AnaliseLoaValorPrevistoCard
                key="desp-loa"
                valLoaTotal={metrics.valLoaTotal}
                valorSugestaoSfTotal={metrics.valorSugestaoSfTotal}
                aplicarSugestaoSf={aplicarSugestaoSf}
                onToggleSugestaoSf={handleToggleSugestaoSf}
              />
            );
          }

          if (kpiId === "desp-diff") {
            const isGreater = effectiveDiff > 0;
            const isSmaller = effectiveDiff < 0;

            return (
              <div
                key="desp-diff"
                className={`glass-card bg-surface p-4 border-t-2 ${
                  isGreater ? "border-t-rose-500 bg-rose-50/20" : isSmaller ? "border-t-emerald-500" : "border-t-gray-400"
                } shadow-sm rounded-xl transition-all duration-200 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Diferença (LOA - LDO)</p>
                    {aplicarSugestaoSf && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                        + SF
                      </span>
                    )}
                  </div>
                  <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${isGreater ? "text-rose-600" : isSmaller ? "text-emerald-600" : "text-on-surface"}`}>
                    {isGreater ? "▲" : isSmaller ? "▼" : "—"} {currency.format(Math.abs(effectiveDiff))}
                  </h3>
                </div>
                <div className="mt-2 pt-1 border-t border-outline/10 text-[10px]">
                  {aplicarSugestaoSf ? (
                    <div className="space-y-0.5">
                      <p className="text-on-surface-variant">
                        {isGreater ? "⚠️ LOA (+ SF) maior que a LDO" : isSmaller ? "LOA (+ SF) menor que a LDO" : "Valores equivalentes"}
                      </p>
                      <p className="text-[9.5px] text-on-surface-variant/80">
                        Original: <span className="font-semibold">{metrics.diff > 0 ? "▲" : metrics.diff < 0 ? "▼" : ""}{currency.format(Math.abs(metrics.diff))}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-on-surface-variant">
                      {isGreater ? "⚠️ LOA maior que a LDO (+ Excesso)" : isSmaller ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
                    </p>
                  )}
                </div>
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
                  {currency.format(loa2026Total)}
                </h3>
                <p
                  className="text-[10px] text-on-surface-variant font-semibold mt-1"
                  title={`Total da LOA 2026, independente dos filtros. Nas linhas de 2027: ${currency.format(metrics.valLoa2026Total)}`}
                >
                  Dotação inicial 2026 (total)
                </p>
              </div>
            );
          }

          if (kpiId === "desp-sugestao-sf") {
            return (
              <div key="desp-sugestao-sf" className="glass-card bg-surface p-4 border-t-2 border-t-amber-600 shadow-sm rounded-xl">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Ajuste SF</p>
                <h3 className="text-lg font-headline font-extrabold text-amber-700">
                  {currency.format(metrics.valorSugestaoSfTotal)}
                </h3>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">Ajustes sugeridos</p>
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

export const AnaliseLoaResultadoKpis = React.memo(function AnaliseLoaResultadoKpis({
  layoutConfig,
  ldoReceitaTotal,
  loaReceitaResumo,
  metrics,
  aplicarSugestaoSf = false,
}: Pick<AnaliseLoaKpisProps, "layoutConfig" | "ldoReceitaTotal" | "loaReceitaResumo" | "metrics"> & {
  aplicarSugestaoSf?: boolean;
}) {
  // Cálculo exato da Receita LOA total consolidada (direta + indiretas)
  const recLoaEntidades = Math.round(loaReceitaResumo.entidades.reduce((sum, entidade) => sum + entidade.valor, 0) * 100) / 100;
  const recLoaPrefeitura = Math.round((loaReceitaResumo.prefeitura || loaReceitaResumo.total - recLoaEntidades) * 100) / 100;
  const recLoaTotal = Math.round((recLoaPrefeitura + recLoaEntidades) * 100) / 100;

  // 1º Card: Valor Previsto LDO Receita - Valor Previsto LDO Despesa
  const resultadoLdo = Math.round((ldoReceitaTotal - metrics.valLdoTotal) * 100) / 100;
  const isLdoSuperavit = resultadoLdo > 0;
  const isLdoDeficit = resultadoLdo < 0;

  // 2º Card: Valor LOA Receita - Valor LOA Despesa (considera Ajuste SF se ativada)
  const effectiveValLoa = aplicarSugestaoSf
    ? metrics.valLoaTotal + metrics.valorSugestaoSfTotal
    : metrics.valLoaTotal;
  const resultadoLoa = Math.round((recLoaTotal - effectiveValLoa) * 100) / 100;
  const isLoaSuperavit = resultadoLoa > 0;
  const isLoaDeficit = resultadoLoa < 0;

  const kpisOrder = layoutConfig.resultadoKpisOrder || ["res-ldo", "res-loa"];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
        <span className="material-symbols-outlined text-sm text-teal-600">balance</span>
        <span>Painel de Resultado</span>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpisOrder.map((kpiId) => {
          if (layoutConfig.visibility[kpiId] === false) return null;

          if (kpiId === "res-ldo") {
            return (
              <div
                key="res-ldo"
                className={`glass-card bg-surface p-4 border-t-2 ${
                  isLdoSuperavit
                    ? "border-t-emerald-600 bg-emerald-50/15"
                    : isLdoDeficit
                    ? "border-t-rose-600 bg-rose-50/15"
                    : "border-t-teal-600"
                } shadow-sm rounded-xl transition-all flex flex-col justify-between`}
              >
                <div>
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Resultado LDO
                  </p>
                  <h3
                    className={`text-lg font-headline font-extrabold flex items-center gap-1 ${
                      isLdoSuperavit
                        ? "text-emerald-700 dark:text-emerald-400"
                        : isLdoDeficit
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-on-surface"
                    }`}
                  >
                    {isLdoSuperavit ? "▲" : isLdoDeficit ? "▼" : "="} {currency.format(Math.abs(resultadoLdo))}
                  </h3>
                  <p className="text-[10px] text-teal-700 font-semibold mt-1">
                    Receita LDO − Despesa LDO
                  </p>
                </div>
                <div className="mt-2 pt-1 border-t border-outline/10 text-[10px] space-y-0.5 text-on-surface-variant">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span>Receita LDO:</span>
                    <span className="font-semibold text-emerald-700">{currency.format(ldoReceitaTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span>Despesa LDO:</span>
                    <span className="font-semibold text-blue-700">{currency.format(metrics.valLdoTotal)}</span>
                  </div>
                  <p className={`font-semibold text-[9.5px] mt-1 ${isLdoSuperavit ? "text-emerald-700" : isLdoDeficit ? "text-rose-700" : "text-on-surface-variant"}`}>
                    {isLdoSuperavit ? "Superávit LDO" : isLdoDeficit ? "Déficit LDO" : "Orçamento Equilibrado"}
                  </p>
                </div>
              </div>
            );
          }

          if (kpiId === "res-loa") {
            return (
              <div
                key="res-loa"
                className={`glass-card bg-surface p-4 border-t-2 ${
                  isLoaSuperavit
                    ? "border-t-emerald-600 bg-emerald-50/15"
                    : isLoaDeficit
                    ? "border-t-rose-600 bg-rose-50/15"
                    : "border-t-blue-600"
                } shadow-sm rounded-xl transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Resultado LOA
                    </p>
                    {aplicarSugestaoSf && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                        + SF
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-lg font-headline font-extrabold flex items-center gap-1 ${
                      isLoaSuperavit
                        ? "text-emerald-700 dark:text-emerald-400"
                        : isLoaDeficit
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-on-surface"
                    }`}
                  >
                    {isLoaSuperavit ? "▲" : isLoaDeficit ? "▼" : "="} {currency.format(Math.abs(resultadoLoa))}
                  </h3>
                  <p className="text-[10px] text-blue-700 font-semibold mt-1">
                    Receita LOA − Despesa LOA
                  </p>
                </div>
                <div className="mt-2 pt-1 border-t border-outline/10 text-[10px] space-y-0.5 text-on-surface-variant">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span>Receita LOA:</span>
                    <span className="font-semibold text-emerald-700">{currency.format(recLoaTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span>Despesa LOA:</span>
                    <span className="font-semibold text-blue-700">
                      {currency.format(effectiveValLoa)}
                      {aplicarSugestaoSf && (
                        <span className="text-[8.5px] text-amber-700 font-normal ml-1">(c/ SF)</span>
                      )}
                    </span>
                  </div>
                  <p className={`font-semibold text-[9.5px] mt-1 ${isLoaSuperavit ? "text-emerald-700" : isLoaDeficit ? "text-rose-700" : "text-on-surface-variant"}`}>
                    {isLoaSuperavit ? "Superávit LOA" : isLoaDeficit ? "Déficit LOA" : "Orçamento Equilibrado"}
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })}
      </section>
    </div>
  );
});

export const AnaliseLoaValorPrevistoCard = React.memo(function AnaliseLoaValorPrevistoCard({
  valLoaTotal,
  valorSugestaoSfTotal,
  aplicarSugestaoSf,
  onToggleSugestaoSf,
}: {
  valLoaTotal: number;
  valorSugestaoSfTotal: number;
  aplicarSugestaoSf: boolean;
  onToggleSugestaoSf: () => void;
}) {
  const valorExibido = aplicarSugestaoSf
    ? valLoaTotal + valorSugestaoSfTotal
    : valLoaTotal;

  return (
    <div className={`glass-card bg-surface p-4 border-t-2 ${aplicarSugestaoSf ? "border-t-amber-500 bg-amber-50/10" : "border-t-blue-500"} shadow-sm rounded-xl transition-all duration-200 flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Valor Previsto LOA</p>
          <button
            type="button"
            onClick={onToggleSugestaoSf}
            title={aplicarSugestaoSf ? "Restaurar valor original" : "Somar Ajuste SF (+)"}
            aria-label={aplicarSugestaoSf ? "Restaurar valor original" : "Somar Ajuste SF"}
            className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold transition-all border shadow-xs ${
              aplicarSugestaoSf
                ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 ring-2 ring-amber-400/30"
                : "bg-surface text-on-surface-variant border-outline/30 hover:bg-surface-variant hover:text-on-surface hover:border-outline/50"
            }`}
          >
            -
          </button>
        </div>

        <h3 className={`text-lg font-headline font-extrabold transition-colors ${aplicarSugestaoSf ? "text-amber-700 dark:text-amber-400" : "text-on-surface"}`}>
          {currency.format(valorExibido)}
        </h3>
      </div>

      <div className="mt-2 pt-1 border-t border-outline/10 text-[10px]">
        {aplicarSugestaoSf ? (
          <div className="space-y-0.5">
            <p className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
              <span>Fixado</span>
              <span className="line-through text-on-surface-variant/70">{currency.format(valLoaTotal)}</span>
            </p>
            <p className="text-on-surface-variant text-[9.5px]">
              Ajuste SF somado: <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{currency.format(valorSugestaoSfTotal)}</span>
            </p>
          </div>
        ) : (
          <p className="text-blue-700 dark:text-blue-400 font-semibold">Despesa Fixada</p>
        )}
      </div>
    </div>
  );
});
