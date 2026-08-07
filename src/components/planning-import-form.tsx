"use client";

import { useRef, useState } from "react";
import { currency, integer } from "@/lib/format";

type ImportKind = "ldo" | "catalog";

const CONFIG: Record<ImportKind, { title: string; description: string; endpoint: string; acceptLabel: string }> = {
  ldo: {
    title: "Ações e produtos da LDO",
    description: "Importa Secretaria, Programa, Ação, Produto, meta física e custo financeiro como uma nova versão.",
    endpoint: "/api/elaboracao-loa/importar-ldo",
    acceptLabel: "Anexo VI da LDO",
  },
  catalog: {
    title: "Tabelas Auxiliares — Anexo II",
    description: "Atualiza o catálogo de códigos permitidos para receita, despesa, fonte, aplicação, função e subfunção.",
    endpoint: "/api/elaboracao-loa/importar-catalogo",
    acceptLabel: "Anexo II — Tabelas Auxiliares",
  },
};

export function PlanningImportForm() {
  const [exercise, setExercise] = useState(2026);
  return (
    <div className="space-y-5 [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-primary">
      <div className="max-w-xs">
        <label htmlFor="planning-exercise" className="block text-xs font-bold text-on-surface-variant mb-1">Exercício de referência</label>
        <input id="planning-exercise" name="planning-exercise" autoComplete="off" type="number" min={2000} max={2100} value={exercise} onChange={(event) => setExercise(Number(event.target.value))} className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <PlanningImportCard kind="ldo" exercise={exercise} />
        <PlanningImportCard kind="catalog" exercise={exercise} />
      </div>
      <p className="text-xs text-on-surface-variant border-l-2 border-primary pl-3">
        Cada confirmação cria uma versão ativa. As importações anteriores, a LOA e os ajustes da Análise LOA (subelemento) não são apagados.
      </p>
    </div>
  );
}

function PlanningImportCard({ kind, exercise }: { kind: ImportKind; exercise: number }) {
  const config = CONFIG[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string; details?: string } | null>(null);

  async function selectFile(selected: File | null) {
    setFile(selected);
    setPreview("");
    setResult(null);
    if (!selected) return;
    setLoading(true);
    try {
      const buffer = await selected.arrayBuffer();
      if (kind === "ldo") {
        const { parseLdoActionWorkbook } = await import("@/lib/ldo-action-parser");
        const parsed = parseLdoActionWorkbook(buffer);
        setPreview(`${integer.format(parsed.records.length)} ações válidas • ${currency.format(parsed.totalValue)} • ${integer.format(parsed.secretariats)} secretarias`);
      } else {
        const { parseAuxiliaryTablesWorkbook } = await import("@/lib/auxiliary-tables-parser");
        const parsed = parseAuxiliaryTablesWorkbook(buffer);
        setPreview(`${integer.format(parsed.records.length)} códigos • ${parsed.sheets.filter((sheet) => sheet.count > 0).length} tabelas identificadas`);
      }
    } catch {
      setResult({ type: "error", text: "Não foi possível validar a estrutura da planilha." });
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("exercise", String(exercise));
      const response = await fetch(config.endpoint, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Falha na importação.");
      const summary = data.summary;
      const details = kind === "ldo"
        ? `${integer.format(summary.rows)} ações • ${currency.format(summary.totalValue)} • ${integer.format(summary.secretariats)} secretarias`
        : `${integer.format(summary.rows)} códigos em ${summary.sheets.filter((sheet: { count: number }) => sheet.count > 0).length} tabelas`;
      setResult({ type: "success", text: data.message, details });
      setFile(null);
      setPreview("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setResult({ type: "error", text: error instanceof Error ? error.message : "Falha na importação." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel bg-surface p-6 border border-outline-variant">
      <div className="flex items-start gap-3 mb-5">
        <span aria-hidden="true" className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">{kind === "ldo" ? "account_tree" : "library_books"}</span>
        <div>
          <h2 className="font-bold text-on-surface">{config.title}</h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{config.description}</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => void selectFile(event.target.files?.[0] ?? null)} />
      <button type="button" onClick={() => inputRef.current?.click()} className="w-full min-h-24 border-2 border-dashed border-outline-variant rounded-lg px-4 text-sm text-on-surface-variant hover:border-primary hover:bg-primary/[0.03] transition-colors">
        <span aria-hidden="true" className="material-symbols-outlined block mb-1">upload_file</span>
        {file ? file.name : `Selecionar ${config.acceptLabel}`}
      </button>
      {preview && <div className="mt-3 border border-outline-variant bg-surface-container p-3 text-xs"><strong className="block text-on-surface">Prévia validada</strong><span className="text-on-surface-variant">{preview}</span></div>}
      {result && <div role="status" className={`mt-4 rounded-lg border p-3 text-xs ${result.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}><strong className="block">{result.text}</strong>{result.details && <span>{result.details}</span>}</div>}
      <div className="flex justify-end mt-4">
        <button type="button" onClick={() => void submit()} disabled={!file || loading} className="brutalist-button brutalist-button-primary bg-primary text-on-primary text-xs font-bold disabled:opacity-50">
          {loading ? "Importando…" : "Confirmar nova versão"}
        </button>
      </div>
    </section>
  );
}
