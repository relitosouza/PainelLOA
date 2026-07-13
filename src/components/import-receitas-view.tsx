'use client';

import { useRef, useState } from "react";
import { currency, integer } from "@/lib/format";

export function ImportReceitasView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  async function selectFile(selected?: File) {
    if (!selected) return;
    setMessage(null);
    setResultado(null);
    if (!/\.(xlsx|xls|csv)$/i.test(selected.name)) {
      setMessage({ type: "error", text: "Formato inválido. Selecione um arquivo XLSX, XLS ou CSV." });
      return;
    }
    setFile(selected);
  }

  function cancel() {
    setFile(null); setMessage(null); setResultado(null); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function confirm() {
    if (!file) return;
    setLoading(true); setMessage(null); setResultado(null); setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return p;
        return p + Math.max(0.5, (95 - p) * 0.05);
      });
    }, 200);

    const body = new FormData(); body.set("file", file);
    try {
      const response = await fetch("/api/receitas-historicas/importar", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha na importação.");
      
      setResultado(result);
      if (result.sucesso) {
        setMessage({ type: "success", text: `Importação concluída: ${integer.format(result.importados)} registros importados com sucesso.` });
      } else {
        setMessage({ type: "error", text: "Importação finalizada com erros. Verifique o detalhamento." });
      }
      // setFile(null); // Mantemos o file para ver o nome
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Falha na importação." });
    } finally { 
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setLoading(false), 500); 
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Upload Card */}
      <section className="lg:col-span-8 panel p-6 bg-surface">
        <h2 className="text-md font-bold text-on-surface mb-4">Carregar Nova Planilha de Receitas</h2>
        <div
          className={`border-dashed border-2 border-outline-variant rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all ${
            dragging ? "bg-surface-container/30 border-tertiary" : "bg-surface"
          }`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(event.dataTransfer.files[0]); }}
        >
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">upload_file</span>
          <h3 className="font-headline font-bold text-sm mb-2">{loading ? "Processando..." : "Arraste sua planilha de receitas para cá"}</h3>
          <p className="text-xs text-on-surface-variant mb-4">Arquivos XLSX, XLS ou CSV</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => void selectFile(event.target.files?.[0])}
            aria-label="Selecionar planilha"
          />
          <button
            className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            Selecionar arquivo
          </button>
          {file && (
            <p className="mt-4 text-xs font-semibold rounded-lg text-green-800 bg-green-100 border border-green-200 px-3 py-1.5">
              Arquivo selecionado: {file.name}
            </p>
          )}
        </div>
        
        {loading && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {progress > 90 ? "Salvando registros no banco de dados..." : "Enviando e processando planilha..."}
              </span>
              <span className="text-xs font-bold text-tertiary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-tertiary transition-all duration-300 ease-out relative" 
                style={{ width: `${progress}%` }} 
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {!loading && message && (
          <div className={`mt-6 p-4 rounded-xl text-sm border ${
            message.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`} role="alert">
            {message.text}
          </div>
        )}

        {resultado && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total de Linhas", val: integer.format(resultado.totalLinhas) },
              { label: "Importados", val: integer.format(resultado.importados) },
              { label: "Ignorados (Duplicados)", val: integer.format(resultado.ignorados) },
              { label: "Com Erro", val: integer.format(resultado.comErro) },
            ].map((stat) => (
              <div key={stat.label} className="border border-outline-variant p-3 bg-surface rounded-lg shadow-sm">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">{stat.label}</span>
                <strong className={`text-base font-bold block ${stat.label.includes('Erro') && resultado.comErro > 0 ? 'text-red-600' : 'text-on-surface'}`}>{stat.val}</strong>
              </div>
            ))}
          </div>
        )}

        {file && !resultado && !loading && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/30">
            <button
              className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant"
              onClick={cancel}
            >
              Cancelar
            </button>
            <button
              className="brutalist-button brutalist-button-primary bg-tertiary text-on-tertiary hover:bg-tertiary-container font-semibold text-xs disabled:opacity-50 border-0"
              onClick={confirm}
              disabled={loading}
            >
              {loading ? "Importando..." : "Confirmar Importação"}
            </button>
          </div>
        )}
      </section>

      {/* Expected Fields Info */}
      <aside className="lg:col-span-4 panel bg-surface p-6">
        <h2 className="text-md font-bold text-on-surface mb-4">Campos esperados (Receitas)</h2>
        <p className="text-xs text-on-surface-variant mb-4">
          O sistema é flexível na leitura dos nomes das colunas, mas espera encontrar informações chave como Data, Valor, Exercício e códigos de classificação.
        </p>
        <ul className="space-y-1.5 pl-0 list-none text-xs font-semibold text-on-surface-variant font-mono">
          {["Data_Movto", "Exercicio", "Valor", "Receita", "Natur_Rec", "Desc_Receita", "Unid_Orcam", "Codigo_Fundo", "Vinculo"].map((field) => (
            <li key={field} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-on-surface-variant shrink-0 rounded-full" />
              {field}
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-on-surface-variant mt-4 font-sans font-normal">
          * Maiúsculas, minúsculas e espaços nos nomes das colunas são ignorados na leitura.
        </p>
      </aside>
    </div>
  );
}
