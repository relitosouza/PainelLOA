"use client";

import { useState } from "react";
import { percent } from "@/lib/format";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ExecutiveActionKpis({
  transfersDependencyPct,
  transfersValue,
  topFiveOrgansShare,
  highRiskRevenueTotal,
  insufficientGoalsCount,
}: {
  transfersDependencyPct: number;
  transfersValue: number;
  topFiveOrgansShare: number;
  highRiskRevenueTotal: number;
  insufficientGoalsCount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Dependência de Transferências */}
      <div className="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-outline mb-2">
          Dependência de Transferências
        </p>
        <div className="flex items-center gap-4 my-2">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-sky-600"
                strokeDasharray={`${transfersDependencyPct}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black font-mono text-on-surface">
              {percent.format(transfersDependencyPct / 100)}
            </span>
          </div>
          <div>
            <span className="text-xl font-black text-on-surface font-mono block">
              {compactCurrency(transfersValue)}
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Alta dependência
            </span>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant">FPM, ICMS, SUS e FUNDEB</p>
      </div>

      {/* 2. Concentração Orçamentária */}
      <div className="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-outline mb-2">
          Concentração Orçamentária
        </p>
        <div className="flex items-center gap-4 my-2">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-slate-800"
                strokeDasharray={`${topFiveOrgansShare}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black font-mono text-on-surface">
              {percent.format(topFiveOrgansShare / 100)}
            </span>
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface leading-tight block">
              5 maiores secretarias
            </span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Concentração alta
            </span>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant">Saúde, Educação, Obras, Transp. e Assistência</p>
      </div>

      {/* 3. Receitas de Alto Risco */}
      <div className="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-outline mb-2">
          Receitas de Alto Risco
        </p>
        <div className="my-2">
          <span className="text-3xl font-black text-emerald-600 font-mono block">
            {compactCurrency(highRiskRevenueTotal)}
          </span>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Exigem atenção fiscal
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant">Volatilidade de repasses do ICMS estadual</p>
      </div>

      {/* 4. Metas com Risco de Não Execução */}
      <div className="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-outline mb-2">
          Metas com Risco
        </p>
        <div className="my-2">
          <span className="text-3xl font-black text-rose-600 font-mono block">
            {insufficientGoalsCount} metas
          </span>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Acompanhar de perto
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant">Metas da LDO com cobertura insuficiente</p>
      </div>
    </div>
  );
}

export function ExecutiveAlertsMap() {
  const [activeAlert, setActiveAlert] = useState<{
    icon: string;
    iconColor?: string;
    title: string;
    description: string;
    origin: string;
    badge: string;
  } | null>(null);

  const alerts = [
    {
      icon: "warning",
      iconColor: "text-amber-500",
      title: "Margem de decisão abaixo de 6% da LOA (ideal ≥ 7%)",
      description: "O comprometimento rígido com pessoal e contratos essenciais limita a capacidade discricionária para novas ações.",
      origin: "Cálculo da Margem Gerencial LOA 2027 deduzindo despesas 3.1 e vinculações constitucionais.",
      badge: "Atenção Gerencial",
    },
    {
      icon: "error",
      iconColor: "text-rose-500",
      title: "75,2% do orçamento concentrado em apenas 5 Secretarias",
      description: "Saúde, Educação, Serviços e Obras, Transportes e Assistência Social absorvem a maior parcela do orçamento municipal.",
      origin: "Agrupamento por Órgão Orçamentário LOA 2027.",
      badge: "Concentração",
    },
    {
      icon: "trending_down",
      iconColor: "text-amber-500",
      title: "Receita de ICMS com risco alto e impacto de R$ 1,28 bi",
      description: "Possível frustração de repasse do Estado caso ocorra desaceleração da arrecadação paulista.",
      origin: "Série histórica de arrecadação da cota-parte estadual (2024-2026).",
      badge: "Risco Fiscal",
    },
    {
      icon: "assignment_late",
      iconColor: "text-rose-500",
      title: "4 metas da LDO sem cobertura orçamentária suficiente",
      description: "Ações prioritárias de saúde, educação e pavimentação com dotação menor que o custo físico planejado.",
      origin: "Cruzamento Anexo de Metas Físicas LDO 2027 com a LOA 2027.",
      badge: "Plano de Governo",
    },
    {
      icon: "check_circle",
      iconColor: "text-emerald-500",
      title: "Investimento total representa 7,31% da receita líquida",
      description: "Índice de investimento próprio e de capital mantido acima da média mínima de 5%.",
      origin: "Total de Despesas 4.4 / Receita Corrente Líquida Projetada.",
      badge: "Meta Positiva",
    },
  ];

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Mapa de Alertas Executivos</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Sinais vitais para a tomada de decisão do Prefeito</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((al) => (
          <div
            key={al.title}
            onClick={() => setActiveAlert(al)}
            className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 pr-2 min-w-0">
              <span className={`material-symbols-outlined text-lg ${al.iconColor} shrink-0`}>
                {al.icon}
              </span>
              <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                {al.title}
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0">
              chevron_right
            </span>
          </div>
        ))}
      </div>

      {/* Modal de Detalhamento do Alerta */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-surface border border-outline-variant rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-xl ${activeAlert.iconColor}`}>
                  {activeAlert.icon}
                </span>
                <h4 className="text-base font-headline font-black text-on-surface">
                  {activeAlert.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-on-surface uppercase text-[10px] text-slate-500">Descrição do Impacto:</p>
                <p className="text-on-surface-variant mt-0.5 leading-relaxed">{activeAlert.description}</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <p className="font-bold text-primary uppercase text-[10px]">Origem dos Dados e Cálculo:</p>
                <p className="text-on-surface font-mono mt-0.5">{activeAlert.origin}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
