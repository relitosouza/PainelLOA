"use client";

import { useEffect, useState, type ReactNode } from "react";
import { currency, integer, percent } from "@/lib/format";
import {
  calcularEmendasImpositivas,
  EMENDAS_IMPOSITIVAS_2027,
  type IndiceConstitucional,
} from "@/lib/indicadores-constitucionais";

type IndicesResponse = {
  exercicio: number;
  possuiReceita: boolean;
  base: number;
  porImposto: Array<{ imposto: string; valor: number }>;
  saude: IndiceConstitucional;
  educacao: IndiceConstitucional & { retencaoFundeb: number };
};

function SectionHeader({ icon, title, description, badge }: { icon: string; title: string; description: string; badge?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-primary mb-1">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
          <h3 className="text-lg font-headline font-bold text-on-surface tracking-tight">{title}</h3>
        </div>
        <p className="text-xs text-on-surface-variant max-w-3xl">{description}</p>
      </div>
      {badge && (
        <span className="self-start rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          {badge}
        </span>
      )}
    </div>
  );
}

function IndiceCard({ titulo, icon, accent, indice, base, extra }: {
  titulo: string;
  icon: string;
  accent: "rose" | "blue";
  indice: IndiceConstitucional;
  base: number;
  extra?: ReactNode;
}) {
  const accentClass = accent === "rose"
    ? { border: "border-t-rose-600", text: "text-rose-700 dark:text-rose-300", icon: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" }
    : { border: "border-t-blue-600", text: "text-blue-700 dark:text-blue-300", icon: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" };
  const aplicadoPercentual = indice.aplicado !== null && base > 0 ? indice.aplicado / base : null;
  const cumpre = aplicadoPercentual !== null ? aplicadoPercentual >= indice.percentual : null;

  return (
    <article className={`rounded-xl border border-outline-variant border-t-2 ${accentClass.border} bg-surface p-5 shadow-sm`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass.icon}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
        <h4 className="text-sm font-bold text-on-surface">{titulo}</h4>
        <span className={`ml-auto text-lg font-headline font-extrabold ${accentClass.text}`}>{integer.format(indice.percentual * 100)}%</span>
      </div>

      <dl className="space-y-3">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">A deduzir da receita (mínimo)</dt>
          <dd className="text-xl font-headline font-extrabold text-on-surface">{currency.format(indice.minimo)}</dd>
          <p className="text-[10px] text-on-surface-variant">{integer.format(indice.percentual * 100)}% de {currency.format(base)}</p>
        </div>

        <div className="rounded-lg bg-surface-container-low/70 p-3">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Efetivamente aplicado na proposta LOA</dt>
          {indice.aplicado === null ? (
            <dd className="mt-1 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
              Aguardando a base de despesa por fonte de recurso.
            </dd>
          ) : (
            <dd className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-headline font-extrabold text-on-surface">{currency.format(indice.aplicado)}</span>
              <span className={`text-xs font-bold ${cumpre ? "text-emerald-700" : "text-rose-700"}`}>
                {percent.format(aplicadoPercentual ?? 0)} {cumpre ? "· cumpre" : "· abaixo do mínimo"}
              </span>
            </dd>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/60 pt-3 text-xs">
          <span className="text-on-surface-variant">Já vinculado na receita LOA</span>
          <span className="font-bold text-on-surface">{currency.format(indice.vinculadoReceita)}</span>
        </div>
        {extra}
      </dl>
    </article>
  );
}

export function IndicesConstitucionaisSection({ exercicio = 2027 }: { exercicio?: number }) {
  const [dados, setDados] = useState<IndicesResponse | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch(`/api/indicadores/indices-constitucionais?exercicio=${exercicio}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json: IndicesResponse) => { if (ativo) setDados(json); })
      .catch(() => { if (ativo) setErro(true); });
    return () => { ativo = false; };
  }, [exercicio]);

  return (
    <section className="glass-card p-6 bg-surface border border-outline-variant rounded-xl">
      <SectionHeader
        icon="gavel"
        title="Índices Constitucionais Mínimos"
        description="Mínimos de Saúde (15%) e Educação (25%) sobre a receita de impostos e transferências constitucionais, e quanto a proposta LOA aplica em cada área."
        badge={`LOA ${exercicio}`}
      />

      {erro ? (
        <p className="text-sm text-rose-700">Não foi possível carregar a receita da LOA.</p>
      ) : !dados ? (
        <p className="text-sm text-on-surface-variant">Carregando…</p>
      ) : !dados.possuiReceita ? (
        <p className="text-sm text-on-surface-variant">A receita da LOA {exercicio} ainda não foi importada.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-outline-variant/60 bg-surface-container-low/50 px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Receita base (impostos e transferências)</span>
            <span className="text-lg font-headline font-extrabold text-on-surface">{currency.format(dados.base)}</span>
            <span className="text-[11px] text-on-surface-variant" title={dados.porImposto.map((i) => `${i.imposto}: ${currency.format(i.valor)}`).join("\n")}>
              {dados.porImposto.map((i) => i.imposto).join(" · ")}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <IndiceCard titulo="Saúde" icon="health_and_safety" accent="rose" indice={dados.saude} base={dados.base} />
            <IndiceCard
              titulo="Educação"
              icon="school"
              accent="blue"
              indice={dados.educacao}
              base={dados.base}
              extra={
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">dos quais retidos para o Fundeb</span>
                  <span className="font-bold text-on-surface">{currency.format(dados.educacao.retencaoFundeb)}</span>
                </div>
              }
            />
          </div>
        </>
      )}
    </section>
  );
}

export function EmendasImpositivasSection() {
  const parametros = EMENDAS_IMPOSITIVAS_2027;
  const emendas = calcularEmendasImpositivas(parametros);
  const cards = [
    { label: "Vereadores", value: integer.format(emendas.vereadores), hint: "Câmara Municipal de Osasco", border: "border-t-slate-500", text: "text-on-surface" },
    { label: "Cota por vereador", value: currency.format(emendas.cotaPorVereador), hint: `${currency.format(emendas.totalMinimo)} ÷ ${emendas.vereadores}`, border: "border-t-blue-600", text: "text-on-surface" },
    { label: "Mínimo da cota para Saúde", value: currency.format(emendas.saudeMinimoPorVereador), hint: `${integer.format(parametros.percentualSaude * 100)}% da cota · total ${currency.format(emendas.saudeMinimoTotal)}`, border: "border-t-rose-600", text: "text-rose-700 dark:text-rose-300" },
    { label: "Valor total das cotas", value: currency.format(emendas.totalMinimo), hint: `${percent.format(parametros.aliquota)} da RCL`, border: "border-t-emerald-600", text: "text-emerald-700 dark:text-emerald-300" },
  ];

  return (
    <section className="glass-card p-6 bg-surface border border-outline-variant rounded-xl">
      <SectionHeader
        icon="how_to_vote"
        title="Emendas Impositivas"
        description="Cotas individuais dos vereadores calculadas sobre a Receita Corrente Líquida; metade do valor deve ser destinada a ações e serviços públicos de saúde."
        badge={`RCL ${currency.format(parametros.rcl)}`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-xl border border-outline-variant border-t-2 ${card.border} bg-surface p-4 shadow-sm`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">{card.label}</p>
            <h4 className={`text-lg font-headline font-extrabold ${card.text}`}>{card.value}</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">{card.hint}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
