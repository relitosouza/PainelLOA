"use client";

import { useEffect, useState } from "react";
import { ArrowUp, BarChart3, Database, Info, Loader2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

type ImportOption = { id: string; fileName: string; exercise: number | null; recordCount: number };
type AssistantMessage = { role: "user" | "assistant"; text: string; details?: Array<{ label: string; value: string }>; sources?: string[]; warning?: string };

const SUGGESTIONS = [
  "Quais órgãos concentram as maiores despesas?",
  "Quais programas têm os maiores valores?",
  "Quais funções concentram mais recursos?",
  "Quanto há em despesas operacionais e investimentos?",
  "Qual é o resumo da LOA selecionada?",
  "Quantos registros existem na importação selecionada?",
  "Qual importação está sendo consultada?",
  "Como está a qualidade da classificação?",
  "Compare as receitas disponíveis no exercício selecionado.",
]; 

export function AssistenteLoaPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [imports, setImports] = useState<ImportOption[]>([]);
  const [importId, setImportId] = useState("");
  const [exercise, setExercise] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/loa?pageSize=1", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { imports?: ImportOption[]; selection?: { importId?: string; exercise?: number | null } };
        const availableImports = data.imports ?? [];
        setImports(availableImports);
        setImportId(data.selection?.importId ?? availableImports[0]?.id ?? "");
        setExercise(data.selection?.exercise ? String(data.selection.exercise) : "");
      })
      .catch(() => setError("Não foi possível carregar as importações disponíveis."));
  }, []);

  const submitQuestion = async (value = question) => {
    const text = value.trim();
    if (!text || loading) return;
    setQuestion("");
    setError("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, importId, exercise: exercise || undefined }),
      });
      const data = (await response.json()) as { message?: string; answer?: string; details?: Array<{ label: string; value: string }>; sources?: string[]; warnings?: string[] };
      if (!response.ok) throw new Error(data.message ?? "Não foi possível responder à pergunta.");
      setMessages((current) => [...current, { role: "assistant", text: data.answer ?? "Não encontrei uma resposta.", details: data.details, sources: data.sources, warning: data.warnings?.[0] }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível responder à pergunta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-[#001a4b] p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              <Sparkles size={14} /> Protótipo de perguntas
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Assistente de análise da LOA</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 md:text-base">Faça perguntas em linguagem natural. Esta página consulta somente as APIs atuais e não altera nenhum dado.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={17} /> Somente leitura</div>
            <p className="mt-1 text-xs text-blue-100">Sem chamadas externas de IA nesta versão.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-h-[520px] rounded-3xl border border-outline-variant bg-surface p-4 shadow-sm md:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
            <div className="rounded-xl bg-tertiary-fixed p-2 text-tertiary"><MessageCircle size={20} /></div>
            <div><h2 className="font-headline text-lg font-bold text-on-surface">Conversa de teste</h2><p className="text-xs text-on-surface-variant">Teste as perguntas antes de integrar o agente ao dashboard.</p></div>
          </div>

          {messages.length === 0 && (
            <div className="rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">Experimente uma pergunta:</p>
              <div className="mt-3 flex flex-wrap gap-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => submitQuestion(suggestion)} className="rounded-full border border-outline-variant bg-surface px-3 py-2 text-left text-xs transition hover:border-tertiary hover:text-tertiary">{suggestion}</button>)}</div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#001a4b] p-4 text-sm text-white" : "max-w-[92%] rounded-2xl rounded-bl-sm bg-surface-container-low p-4 text-sm text-on-surface"}>
                <p className="whitespace-pre-wrap leading-6">{message.text}</p>
                {message.details && message.details.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{message.details.map((detail) => <div key={detail.label} className="rounded-xl border border-outline-variant bg-surface p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{detail.label}</p><p className="mt-1 font-headline font-bold text-tertiary">{detail.value}</p></div>)}</div>}
                {message.sources && <p className="mt-4 text-xs text-on-surface-variant">Fonte: {message.sources.join(", ")}</p>}
                {message.warning && <p className="mt-3 flex gap-2 text-xs text-on-surface-variant"><Info size={15} className="shrink-0" />{message.warning}</p>}
              </article>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-on-surface-variant"><Loader2 size={16} className="animate-spin" /> Consultando as APIs atuais...</div>}
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</p>}

          <form className="mt-6 flex items-end gap-2 rounded-2xl border border-outline-variant bg-surface p-2 focus-within:border-tertiary" onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }}>
            <label htmlFor="loa-question" className="sr-only">Digite sua pergunta</label>
            <textarea id="loa-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex.: Quais órgãos concentram as maiores despesas?" rows={2} maxLength={500} className="min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant" />
            <button type="submit" disabled={loading || !question.trim()} aria-label="Enviar pergunta" className="rounded-xl bg-tertiary p-3 text-white transition hover:bg-tertiary/90 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp size={18} /></button>
          </form>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-outline-variant bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2"><Database size={18} className="text-tertiary" /><h2 className="font-headline font-bold text-on-surface">Contexto da consulta</h2></div>
          <p className="text-xs leading-5 text-on-surface-variant">Escolha a importação usada pelas consultas de LOA. As análises de receita usam o exercício informado.</p>
          <label className="block text-xs font-semibold text-on-surface-variant">Importação LOA<select value={importId} onChange={(event) => setImportId(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-tertiary"><option value="">Mais recente</option>{imports.map((item) => <option key={item.id} value={item.id}>{item.exercise ?? "Sem exercício"} · {item.fileName}</option>)}</select></label>
          <label className="block text-xs font-semibold text-on-surface-variant">Exercício para receitas<input inputMode="numeric" value={exercise} onChange={(event) => setExercise(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Ex.: 2025" className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-tertiary" /></label>
          <div className="rounded-2xl bg-tertiary-fixed p-4 text-xs leading-5 text-on-tertiary-fixed"><div className="flex items-center gap-2 font-bold"><BarChart3 size={15} /> Escopo atual</div><p className="mt-1">Resumo da LOA, maiores grupos, qualidade da classificação e resumo das receitas.</p></div>
        </aside>
      </div>
    </section>
  );
}
