"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { currency, percent } from "@/lib/format";
import { DetalhamentoProposta } from "./elaboracao-loa/detalhamento-proposta";

type AuxiliaryCode = { id: string; codigo: string; nome: string; tipo: string };
type LinkItem = {
  id: string; valor: number; justificativa: string | null; motivoSugestao: string | null; responsavel: string | null;
  despesa: AuxiliaryCode; fonteRecurso: AuxiliaryCode; codigoAplicacao: AuxiliaryCode;
};
type LdoAction = {
  id: string; secretaria: string; secretariaNome: string; programaCodigo: string | null; programaNome: string; funcaoCodigo: string | null; funcaoNome: string | null; subfuncaoCodigo: string | null; subfuncaoNome: string | null; acaoCodigo: string; acaoNome: string | null;
  produto: string; metaFisica: number | null; custoFinanceiro: number; valorDistribuido: number; saldo: number;
  status: "PENDENTE" | "PARCIAL" | "CONCLUIDO"; enquadramentos: LinkItem[];
};

export function ElaboracaoLoaView() {
  const [actions, setActions] = useState<LdoAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadActions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/elaboracao-loa/acoes?exercise=2026");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setActions(data.actions);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o planejamento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadActions(); }, [loadActions]);

  const [loaRevenue, setLoaRevenue] = useState<number | null>(null);
  const [loaExpense, setLoaExpense] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/elaboracao-loa/resumo?exercise=2026")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { setLoaRevenue(data?.loaReceita ?? null); setLoaExpense(data?.loaDespesaProposta ?? null); })
      .catch(() => { setLoaRevenue(null); setLoaExpense(null); });
  }, []);

  const [ajusteTotal, setAjusteTotal] = useState(0);
  const loaExpenseProposta = loaExpense === null ? null : loaExpense + ajusteTotal;

  const totals = useMemo(() => actions.reduce((acc, action) => ({ cost: acc.cost + action.custoFinanceiro, distributed: acc.distributed + action.valorDistribuido }), { cost: 0, distributed: 0 }), [actions]);

  return (
    <div className="space-y-6 [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-primary">
      <header className="page-heading border-b border-outline-variant/30 pb-5">
        <div>
          <p className="eyebrow font-bold uppercase text-on-surface-variant tracking-wider text-[11px]">Planejamento orçamentário</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Enquadramento LDO → LOA</h1>
          <p className="text-on-surface-variant mt-1">Distribua o custo das ações da LDO nas classificações válidas da LOA.</p>
        </div>
        <div className="min-w-64">
          <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Progresso geral</span><strong>{percent.format(totals.cost ? totals.distributed / totals.cost : 0)}</strong></div>
          <ProgressBar value={totals.distributed} total={totals.cost} />
          <p className="text-[11px] text-on-surface-variant mt-1">{currency.format(totals.distributed)} de {currency.format(totals.cost)}</p>
        </div>
      </header>

      <section aria-label="Resumo orçamentário" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard icon="request_quote" label="LDO Despesa" value={loading ? null : totals.cost} hint="Custo total das ações da LDO" />
        <SummaryCard icon="savings" label="LOA Receita" value={loaRevenue} hint={loaRevenue === null ? "Base LOA Receitas não importada" : "Receita prevista importada"} />
        <SummaryCard icon="receipt_long" label="LOA Despesa Proposta" value={loaExpenseProposta} hint={ajusteTotal ? `Valor Previsto LOA ${ajusteTotal < 0 ? "−" : "+"} ${currency.format(Math.abs(ajusteTotal))} em ajustes` : "Valor Previsto LOA (Análise LOA)"} />
        {(() => {
          const deficit = loaRevenue === null || loaExpenseProposta === null ? null : loaRevenue - loaExpenseProposta;
          const tone = deficit === null ? undefined : deficit < 0 ? "negative" : "positive";
          return <SummaryCard icon="balance" label="Déficit" value={deficit} tone={tone} hint={deficit === null ? "LOA Receita − LOA Despesa Proposta" : deficit < 0 ? "Despesa proposta supera a receita" : "Receita cobre a despesa proposta"} />;
        })()}
      </section>

      {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}
      {!loading && !actions.length && <EmptyState />}

      <DetalhamentoProposta deficitBase={loaRevenue === null || loaExpense === null ? null : loaRevenue - loaExpense} onAjusteTotalChange={setAjusteTotal} />

      {actions.some((action) => action.enquadramentos.length) && <TraceabilityMatrix actions={actions} />}
    </div>
  );
}

function SummaryCard({ icon, label, value, hint, tone }: { icon: string; label: string; value: number | null; hint: string; tone?: "positive" | "negative" }) {
  const valueClass = tone === "negative" ? "text-red-700" : tone === "positive" ? "text-green-700" : "text-on-surface";
  return (
    <div className="panel bg-surface border border-outline-variant p-4">
      <div className="flex items-center justify-between text-on-surface-variant">
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClass}`}>{value === null ? "—" : currency.format(value)}</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">{hint}</p>
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const width = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return <div className="h-2 bg-surface-container-high rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><div className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${width}%` }} /></div>;
}

function EmptyState() {
  return <section className="panel bg-surface p-10 text-center"><span aria-hidden="true" className="material-symbols-outlined text-4xl text-on-surface-variant">account_tree</span><h2 className="font-bold mt-3">Nenhuma ação LDO importada</h2><p className="text-sm text-on-surface-variant mt-1">Acesse Importações e carregue as Ações LDO e as Tabelas Auxiliares de 2026.</p><Link href="/importacao" className="inline-flex mt-4 bg-primary text-on-primary px-4 py-2 text-sm font-bold">Ir para Importações</Link></section>;
}

function TraceabilityMatrix({ actions }: { actions: LdoAction[] }) {
  const rows = actions.flatMap((action) => action.enquadramentos.map((item) => ({ action, item })));
  const [search, setSearch] = useState("");
  const filteredRows = rows.filter(({ action, item }) => `${action.secretaria} ${action.programaNome} ${action.acaoCodigo} ${item.despesa.codigo} ${item.despesa.nome} ${item.justificativa ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = filteredRows.map(({ action, item }) => ({ Secretaria: action.secretaria, Programa: action.programaNome, Ação: action.acaoCodigo, Produto: action.produto, Despesa: `${item.despesa.codigo} - ${item.despesa.nome}`, Fonte: `${item.fonteRecurso.codigo} - ${item.fonteRecurso.nome}`, Aplicação: `${item.codigoAplicacao.codigo} - ${item.codigoAplicacao.nome}`, Valor: item.valor, Justificativa: item.justificativa ?? "", "Motivo da sugestão": item.motivoSugestao ?? "", Responsável: item.responsavel ?? "" }));
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), "Rastreabilidade"); XLSX.writeFile(workbook, "matriz-rastreabilidade-ldo-loa.xlsx");
  }
  async function exportPdf() {
    const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ orientation: "landscape" }); doc.setFontSize(15); doc.text("Matriz de Rastreabilidade LDO → LOA", 14, 15);
    autoTableModule.default(doc, { startY: 21, head: [["Secretaria", "Ação", "Despesa", "Fonte", "Aplicação", "Valor", "Justificativa"]], body: filteredRows.map(({ action, item }) => [action.secretaria, action.acaoCodigo, `${item.despesa.codigo} - ${item.despesa.nome}`, item.fonteRecurso.codigo, item.codigoAplicacao.codigo, currency.format(item.valor), item.justificativa ?? "—"]), styles: { fontSize: 7 }, headStyles: { fillColor: [0, 90, 180] } });
    doc.save("matriz-rastreabilidade-ldo-loa.pdf");
  }
  return <section className="panel bg-surface p-6" aria-labelledby="traceability-title"><div className="flex flex-wrap justify-between gap-3 mb-4"><div><h2 id="traceability-title" className="text-lg font-bold">Matriz de Rastreabilidade</h2><p className="text-xs text-on-surface-variant">Relação interna entre ações da LDO e classificações da LOA.</p></div><div className="flex gap-2"><button type="button" onClick={() => void exportExcel()} className="border border-green-300 text-green-800 px-3 py-2 text-xs font-bold">Excel</button><button type="button" onClick={() => void exportPdf()} className="border border-red-300 text-red-700 px-3 py-2 text-xs font-bold">PDF</button></div></div><label className="block max-w-md mb-3"><span className="sr-only">Filtrar matriz de rastreabilidade</span><input name="traceability-search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtrar por secretaria, ação, despesa ou justificativa…" className="w-full border border-outline-variant px-3 py-2 text-xs" /></label><div className="overflow-x-auto border border-outline-variant"><table className="w-full text-xs"><thead className="bg-surface-container text-left"><tr><th className="p-3">Secretaria</th><th className="p-3">Ação LDO</th><th className="p-3">Despesa LOA</th><th className="p-3">Fonte / Aplicação</th><th className="p-3 text-right">Valor</th><th className="p-3">Justificativa / Responsável</th></tr></thead><tbody className="divide-y divide-outline-variant">{filteredRows.map(({ action, item }) => <tr key={item.id}><td className="p-3">{action.secretaria}</td><td className="p-3 font-mono font-bold">{action.acaoCodigo}</td><td className="p-3"><strong>{item.despesa.codigo}</strong><br />{item.despesa.nome}</td><td className="p-3">{item.fonteRecurso.codigo} / {item.codigoAplicacao.codigo}</td><td className="p-3 text-right font-mono tabular-nums">{currency.format(item.valor)}</td><td className="p-3 max-w-xs break-words">{item.justificativa || "—"}{item.responsavel && <span className="block mt-1 text-on-surface-variant">Responsável: {item.responsavel}</span>}</td></tr>)}</tbody></table></div></section>;
}
