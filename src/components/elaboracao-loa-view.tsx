"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { currency, percent } from "@/lib/format";
import { isGenericExpenseCode, validateClassification, type EnquadramentoRuleMessage } from "@/lib/enquadramento-rules";

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
type Suggestion = AuxiliaryCode & { score: number; reason: string };
type ExpenseWithoutSubelement = { id: string; natureza: string; elemento: string; vinculo: string; processo: string; valorLoa: number; quantidadeRegistros: number; justificativa?: string };

const STATUS_LABEL = { PENDENTE: "Pendente de vínculo", PARCIAL: "Parcialmente vinculada", CONCLUIDO: "Concluída" } as const;
const STATUS_CLASS = {
  PENDENTE: "bg-amber-50 text-amber-800 border-amber-200",
  PARCIAL: "bg-blue-50 text-blue-800 border-blue-200",
  CONCLUIDO: "bg-green-50 text-green-800 border-green-200",
} as const;

export function ElaboracaoLoaView() {
  const [actions, setActions] = useState<LdoAction[]>([]);
  const [secretariats, setSecretariats] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [secretariat, setSecretariat] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
      setSecretariats(data.secretariats);
      setSelectedId((current) => current && data.actions.some((item: LdoAction) => item.id === current) ? current : data.actions[0]?.id ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o planejamento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadActions(); }, [loadActions]);

  const filtered = useMemo(() => actions.filter((action) => {
    const query = search.toLowerCase();
    return (!secretariat || action.secretaria === secretariat)
      && (!status || action.status === status)
      && (!query || `${action.secretaria} ${action.secretariaNome} ${action.programaNome} ${action.funcaoNome ?? ""} ${action.subfuncaoNome ?? ""} ${action.acaoCodigo} ${action.acaoNome ?? ""} ${action.produto}`.toLowerCase().includes(query));
  }), [actions, search, secretariat, status]);
  const selected = actions.find((action) => action.id === selectedId) ?? null;

  const groups = useMemo(() => {
    const map = new Map<string, LdoAction[]>();
    filtered.forEach((action) => map.set(action.secretaria, [...(map.get(action.secretaria) ?? []), action]));
    return [...map.entries()];
  }, [filtered]);
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

      <section aria-label="Filtros do catálogo LDO" className="panel bg-surface p-4 grid grid-cols-1 md:grid-cols-[1fr_240px_220px] gap-3">
        <label className="relative"><span className="sr-only">Buscar ação, programa ou produto</span><span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span><input name="planning-search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ação, programa ou produto…" className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-10 pr-3 text-sm" /></label>
        <select name="planning-secretariat" autoComplete="off" aria-label="Filtrar por secretaria" value={secretariat} onChange={(event) => setSecretariat(event.target.value)} className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"><option value="">Todas as secretarias</option>{secretariats.map((item) => <option key={item}>{item}</option>)}</select>
        <select name="planning-status" autoComplete="off" aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"><option value="">Todos os status</option><option value="PENDENTE">Pendentes</option><option value="PARCIAL">Parciais</option><option value="CONCLUIDO">Concluídas</option></select>
      </section>

      {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}
      {!loading && !actions.length && <EmptyState />}

      <div className={`grid grid-cols-1 gap-6 items-start ${isActionPanelOpen ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1.62fr)_minmax(360px,1fr)]"}`}>
        <section aria-labelledby="ldo-catalog-title" className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 id="ldo-catalog-title" className="text-lg font-bold text-on-surface">Ações da LDO</h2><p className="text-xs text-on-surface-variant">Selecione uma ação para definir seu enquadramento.</p></div><span className="text-xs font-semibold text-on-surface-variant">{filtered.length} ações</span></div>
          {loading ? <div className="panel bg-surface p-8 text-sm text-on-surface-variant">Carregando ações…</div> : groups.map(([name, items]) => {
            const showAll = expanded.has(name);
            const visible = showAll ? items : items.slice(0, 5);
    return <div key={name} className="panel bg-surface overflow-hidden border border-outline-variant [content-visibility:auto] [contain-intrinsic-size:420px]">
              <div className="px-5 py-3 bg-surface-container border-b border-outline-variant flex justify-between gap-3"><h3 className="font-bold text-sm text-on-surface">{items[0].secretariaNome} <span className="font-mono text-xs text-on-surface-variant">({name})</span></h3><span className="text-xs text-on-surface-variant">{items.length} ações</span></div>
              <div className="divide-y divide-outline-variant/50">{visible.map((action) => <ActionRow key={action.id} action={action} selected={action.id === selectedId} onSelect={() => setSelectedId(action.id)} />)}</div>
              {items.length > 5 && <button type="button" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(name)) next.delete(name); else next.add(name); return next; })} className="w-full px-5 py-2.5 text-xs font-bold text-primary hover:bg-primary/[0.04]">{showAll ? "Mostrar somente as 5 prioritárias" : `Ver todas as ${items.length} ações`}</button>}
            </div>;
          })}
        </section>

        <aside className="xl:sticky xl:top-20">
          {selected && !isActionPanelOpen ? <ActionSummaryCard action={selected} onOpen={() => setIsActionPanelOpen(true)} /> : !selected ? <div className="panel bg-surface p-8 text-center text-sm text-on-surface-variant">Selecione uma ação da LDO.</div> : null}
        </aside>
      </div>

      {isActionPanelOpen && selected && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 md:p-8" role="dialog" aria-modal="true" aria-labelledby="action-panel-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsActionPanelOpen(false); }}>
        <div className="w-full max-w-5xl">
          <div className="mb-2 flex justify-end"><button type="button" onClick={() => setIsActionPanelOpen(false)} aria-label="Fechar detalhamento da ação" className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface text-slate-700 shadow-lg hover:bg-slate-100"><span aria-hidden="true" className="material-symbols-outlined">close</span></button></div>
          <div id="action-panel-title" className="sr-only">Detalhamento da ação {selected.acaoCodigo}</div>
          <ClassificationPanel action={selected} onSaved={loadActions} />
        </div>
      </div>}

      {actions.some((action) => action.enquadramentos.length) && <TraceabilityMatrix actions={actions} />}
    </div>
  );
}

function ActionRow({ action, selected, onSelect }: { action: LdoAction; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={`w-full text-left px-5 py-4 transition-colors ${selected ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/30" : "hover:bg-surface-container-low"}`}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] text-on-surface-variant truncate">{action.programaCodigo ? `${action.programaCodigo} — ` : ""}{action.programaNome}</p><p className="text-[11px] text-on-surface-variant truncate">Função {action.funcaoCodigo || "—"} — {action.funcaoNome || "Não informada"} · Subfunção {action.subfuncaoCodigo || "—"} — {action.subfuncaoNome || "Não informada"}</p><h4 className="font-bold text-sm text-on-surface mt-0.5">{action.acaoCodigo}{action.acaoNome ? ` — ${action.acaoNome}` : ""}</h4><p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{action.produto || "Produto não informado"}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[action.status]}`}>{STATUS_LABEL[action.status]}</span></div>
    <div className="mt-3"><div className="flex justify-between text-[11px] mb-1"><span>{currency.format(action.valorDistribuido)} distribuídos</span><strong>{currency.format(action.saldo)} disponíveis</strong></div><ProgressBar value={action.valorDistribuido} total={action.custoFinanceiro} /></div>
  </button>;
}

function ActionSummaryCard({ action, onOpen }: { action: LdoAction; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="panel w-full bg-surface text-left transition-shadow hover:shadow-lg" aria-label={`Abrir detalhamento da ação ${action.acaoCodigo}`}>
    <div className="border-b border-outline-variant bg-[#001a4b] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Ação selecionada</p><h2 className="mt-1 font-bold">{action.acaoCodigo}{action.acaoNome ? ` — ${action.acaoNome}` : ""}</h2><p className="mt-1 text-xs text-white/70">{action.secretariaNome}</p></div>
    <div className="space-y-4 p-5"><div><p className="text-[11px] text-on-surface-variant">Função / Subfunção</p><p className="text-xs font-semibold">{action.funcaoCodigo || "—"} — {action.funcaoNome || "Não informada"}</p><p className="text-xs font-semibold">{action.subfuncaoCodigo || "—"} — {action.subfuncaoNome || "Não informada"}</p></div><div><div className="flex justify-between text-xs"><span>Distribuído</span><strong>{currency.format(action.valorDistribuido)}</strong></div><ProgressBar value={action.valorDistribuido} total={action.custoFinanceiro} /><div className="mt-1 flex justify-between text-[11px] text-on-surface-variant"><span>Saldo</span><strong>{currency.format(action.saldo)}</strong></div></div><div className="flex items-center justify-between"><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[action.status]}`}>{STATUS_LABEL[action.status]}</span><span className="text-xs font-bold text-primary">Abrir detalhes →</span></div></div>
  </button>;
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const width = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return <div className="h-2 bg-surface-container-high rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><div className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${width}%` }} /></div>;
}

function ClassificationPanel({ action, onSaved }: { action: LdoAction; onSaved: () => Promise<void> }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [expenses, setExpenses] = useState<AuxiliaryCode[]>([]);
  const [sources, setSources] = useState<AuxiliaryCode[]>([]);
  const [applications, setApplications] = useState<AuxiliaryCode[]>([]);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseId, setExpenseId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [value, setValue] = useState("");
  const [justification, setJustification] = useState("");
  const [suggestionReason, setSuggestionReason] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [existingExpenses, setExistingExpenses] = useState<ExpenseWithoutSubelement[]>([]);
  const [saving, setSaving] = useState(false);
  const expense = [...suggestions, ...expenses].find((item) => item.id === expenseId);

  useEffect(() => {
    setExpenseId(""); setSourceId(""); setApplicationId(""); setValue(""); setJustification(""); setSuggestionReason(""); setMessage(null);
    void Promise.all([
      fetch(`/api/elaboracao-loa/sugestoes?actionId=${action.id}`).then((response) => response.json()).then((data) => setSuggestions(data.suggestions ?? [])),
      fetch("/api/elaboracao-loa/codigos?exercise=2026&type=FONTE_RECURSO&limit=100").then((response) => response.json()).then((data) => setSources(data.items ?? [])),
      fetch("/api/elaboracao-loa/codigos?exercise=2026&type=CODIGO_APLICACAO&limit=500").then((response) => response.json()).then((data) => setApplications(data.items ?? [])),
      fetch(`/api/elaboracao-loa/despesas-sem-subelemento?action=${encodeURIComponent(action.acaoCodigo)}&secretariat=${encodeURIComponent(action.secretariaNome)}`).then((response) => response.json()).then((data) => {
        let customMap: Record<string, number> = {};
        let justificationMap: Record<string, string> = {};
        try { customMap = JSON.parse(localStorage.getItem("painel_loa_custom_edits_v1") || "{}"); justificationMap = JSON.parse(localStorage.getItem("painel_loa_justifications_v1") || "{}"); } catch { /* valores antigos inválidos não impedem a consulta */ }
        setExistingExpenses((data.items ?? []).map((item: ExpenseWithoutSubelement) => {
          const saved = Object.entries(customMap).find(([key]) => key.includes(item.natureza) && key.includes(`|${item.vinculo}|`));
          const savedJustification = saved ? justificationMap[saved[0]] : undefined;
          return { ...item, valorLoa: saved ? saved[1] : item.valorLoa, justificativa: savedJustification };
        }));
      }),
    ]);
  }, [action.id, action.acaoCodigo, action.secretariaNome]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ exercise: "2026", type: "SUBELEMENTO_DESPESA", limit: "40" });
      if (expenseSearch) params.set("search", expenseSearch);
      void fetch(`/api/elaboracao-loa/codigos?${params}`).then((response) => response.json()).then((data) => setExpenses(data.items ?? []));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [expenseSearch]);

  const validation = useMemo<EnquadramentoRuleMessage[]>(() => expense ? validateClassification({
    actionText: `${action.acaoCodigo} ${action.acaoNome ?? ""}`, product: action.produto, expenseCode: expense.codigo,
    sourceCode: sources.find((item) => item.id === sourceId)?.codigo, applicationCode: applications.find((item) => item.id === applicationId)?.codigo,
    value: Number(String(value).replace(".", "").replace(",", ".")), remaining: action.saldo, justification,
  }) : [], [action, expense, sourceId, applicationId, sources, applications, value, justification]);
  const requiresJustification = expense ? isGenericExpenseCode(expense.codigo) : false;

  async function save() {
    if (!expense) return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/elaboracao-loa/enquadramentos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId: action.id, expenseId: expense.id, sourceId, applicationId, value: Number(String(value).replace(".", "").replace(",", ".")), justification, suggestionReason }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.validation?.map((item: EnquadramentoRuleMessage) => item.message).join(" ") || data.message);
      setMessage({ type: "success", text: "Enquadramento salvo e saldo atualizado." });
      setValue(""); setJustification("");
      await onSaved();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível salvar." }); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Remover este enquadramento? O registro continuará disponível no histórico.")) return;
    await fetch(`/api/elaboracao-loa/enquadramentos?id=${id}`, { method: "DELETE" });
    await onSaved();
  }

  return <section className="panel bg-surface border border-outline-variant overflow-hidden" aria-labelledby="classification-title">
    <div className="bg-[#001a4b] text-white p-5"><p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Ação selecionada</p><h2 id="classification-title" className="font-bold mt-1">{action.acaoCodigo}{action.acaoNome ? ` — ${action.acaoNome}` : ""}</h2><p className="text-xs text-white/70 mt-1">Saldo disponível: <strong className="text-white">{currency.format(action.saldo)}</strong></p></div>
    <div className="p-5 space-y-5">
      <div><label htmlFor="expense-search" className="text-xs font-bold text-on-surface block mb-1">Buscar despesa ou subelemento</label><input id="expense-search" name="expense-search" autoComplete="off" value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} placeholder="Código ou descrição…" className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm" /><select name="expense" autoComplete="off" aria-label="Despesa selecionada" value={expenseId} onChange={(event) => { setExpenseId(event.target.value); setSuggestionReason(""); }} className="w-full mt-2 rounded-lg border border-outline-variant px-3 py-2 text-xs"><option value="">Selecione no catálogo</option>{expenses.map((item) => <option key={item.id} value={item.id}>{item.codigo} — {item.nome}</option>)}</select></div>
      <div className="grid grid-cols-1 gap-3"><label className="text-xs font-bold">Fonte de recurso *<select name="source" autoComplete="off" value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="w-full mt-1 rounded-lg border border-outline-variant px-3 py-2 text-xs font-normal"><option value="">Selecione</option>{sources.map((item) => <option key={item.id} value={item.id}>{item.codigo} — {item.nome}</option>)}</select></label><label className="text-xs font-bold">Código de aplicação *<select name="application" autoComplete="off" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="w-full mt-1 rounded-lg border border-outline-variant px-3 py-2 text-xs font-normal"><option value="">Selecione</option>{applications.map((item) => <option key={item.id} value={item.id}>{item.codigo} — {item.nome}</option>)}</select></label></div>
      <label className="text-xs font-bold block">Valor do enquadramento *<input name="allocation-value" autoComplete="off" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value.replace(/-/g, ""))} placeholder="Ex.: 1.250,00" className="w-full mt-1 rounded-lg border border-outline-variant px-3 py-2 text-sm text-right font-mono tabular-nums" /></label>
      {requiresJustification && <label className="text-xs font-bold block text-amber-900">Justificativa técnica *<textarea name="technical-justification" autoComplete="off" value={justification} onChange={(event) => setJustification(event.target.value)} rows={3} placeholder="Explique por que a classificação genérica é necessária…" className="w-full mt-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-on-surface" /></label>}
      {expense && validation.length > 0 && <div className="space-y-1" aria-live="polite">{validation.map((item, index) => <p key={`${item.rule}-${index}`} className={`text-xs border-l-2 pl-2 ${item.severity === "error" ? "border-red-500 text-red-700" : "border-amber-500 text-amber-800"}`}><strong>{item.rule}:</strong> {item.message}</p>)}</div>}
      {message && <div role="status" className={`rounded-lg border p-3 text-xs ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>{message.text}</div>}
      <button type="button" onClick={() => void save()} disabled={!expenseId || validation.some((item) => item.severity === "error") || saving} className="w-full min-h-11 bg-primary text-on-primary font-bold text-sm disabled:opacity-50">{saving ? "Salvando…" : "Salvar enquadramento"}</button>
      {action.enquadramentos.length > 0 && <div className="pt-4 border-t border-outline-variant"><h3 className="text-xs font-bold mb-2">Despesas já vinculadas</h3><div className="space-y-2">{action.enquadramentos.map((item) => <div key={item.id} className="border border-outline-variant p-3 text-xs"><div className="flex justify-between gap-2"><div><strong className="font-mono text-primary">{item.despesa.codigo}</strong><p className="mt-0.5">{item.despesa.nome}</p></div><button type="button" onClick={() => void remove(item.id)} aria-label={`Remover ${item.despesa.codigo}`} className="material-symbols-outlined text-red-600 text-[18px]">delete</button></div><p className="font-bold mt-2">{currency.format(item.valor)}</p>{item.justificativa && <p className="mt-2 text-on-surface-variant"><strong>Justificativa:</strong> {item.justificativa}</p>}</div>)}</div></div>}
      {existingExpenses.length > 0 && <div className="pt-4 border-t border-outline-variant"><h3 className="text-xs font-bold mb-1">Despesas LOA já digitadas sem subelemento</h3><p className="text-[11px] text-on-surface-variant mb-2">Informações associadas da Análise LOA (subelemento).</p><div className="overflow-x-auto rounded-lg border border-blue-200"><table className="w-full min-w-[760px] text-left text-xs"><caption className="sr-only">Despesas já digitadas sem subelemento para a ação selecionada</caption><thead className="bg-blue-50 text-[10px] uppercase tracking-wide text-on-surface-variant"><tr><th scope="col" className="px-3 py-2 font-bold">Despesa</th><th scope="col" className="px-3 py-2 font-bold">Elemento</th><th scope="col" className="px-3 py-2 font-bold">Vínculo</th><th scope="col" className="px-3 py-2 font-bold">Processo</th><th scope="col" className="px-3 py-2 text-right font-bold">Valor LOA</th><th scope="col" className="px-3 py-2 font-bold">Justificativa</th></tr></thead><tbody className="divide-y divide-blue-100">{existingExpenses.map((item) => <tr key={item.id} className="bg-blue-50/30 align-top"><td className="px-3 py-2 font-medium text-on-surface">{item.natureza || "—"}</td><td className="px-3 py-2 font-mono font-bold text-primary">{item.elemento || "—"}</td><td className="px-3 py-2 text-on-surface-variant">{item.vinculo || "—"}</td><td className="px-3 py-2 text-on-surface-variant">{item.processo || "—"}</td><td className="whitespace-nowrap px-3 py-2 text-right font-mono font-bold text-primary">{currency.format(item.valorLoa)}</td><td className="max-w-[260px] px-3 py-2 text-on-surface-variant">{item.justificativa || "—"}</td></tr>)}</tbody><tfoot className="border-t border-blue-200 bg-blue-50"><tr><td colSpan={4} className="px-3 py-2 font-bold text-on-surface">Total já digitado ({existingExpenses.length})</td><td className="whitespace-nowrap px-3 py-2 text-right font-mono font-bold text-primary">{currency.format(existingExpenses.reduce((total, item) => total + item.valorLoa, 0))}</td><td /></tr></tfoot></table></div></div>}
      {suggestions.length > 0 && <fieldset className="border-t border-outline-variant pt-4"><legend className="text-xs font-bold text-on-surface mb-2">Sugestões para esta ação</legend><p className="text-[11px] text-on-surface-variant mb-2">Selecione uma sugestão para preencher a despesa do enquadramento.</p><div className="space-y-2">{suggestions.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => { setExpenseId(item.id); setSuggestionReason(item.reason); }} className={`w-full text-left border p-3 transition-colors ${expenseId === item.id ? "border-primary bg-primary/[0.05]" : "border-outline-variant hover:border-primary/50"}`}><span className="font-mono text-xs font-bold text-primary">{item.codigo}</span><span className="block text-xs font-semibold mt-0.5">{item.nome}</span><span className="block text-[10px] text-on-surface-variant mt-1">Motivo: {item.reason}</span></button>)}</div></fieldset>}
    </div>
  </section>;
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
