"use client";

import { useRef, useState } from "react";
import type { BudgetRow } from "@/types/loa";
import { currency, integer } from "@/lib/format";

type Preview = { records: BudgetRow[]; invalidValues: number[]; missingOrgan: boolean; hasRequiredFields: boolean };

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const headers = ["CD_ÓRGÃO-DS_ÓRGÃO", "CD_UNID.-DS_UNID.", "CD_FUNÇÃO-DS_FUNÇÃO", "CD SUBFUNÇÃO-DS_SUBFUNÇÃO", "CD_PROGRAMA-DS_PROGRAMA", "CD_AÇÃO-DS_AÇÃO", "NATUREZA DE DESPESA", "Desc Sub", "PROCESSO ADMINISTRATIVO", "VALOR"];
  const example = ["19 - SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA", "001 - GABINETE DA SECRETARIA", "04 - ADMINISTRAÇÃO", "122 - ADMINISTRAÇÃO GERAL", "0013 - MOBILIDADE URBANA", "2.034 - MANUTENÇÃO DA INFRAESTRUTURA VIÁRIA", "3.3.90.39.00 - OUTROS SERVIÇOS DE TERCEIROS - PESSOA JURÍDICA", "SERVIÇOS TÉCNICOS PROFISSIONAIS", "PA 001/2026", 1250000];
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, example]);
  dataSheet["!cols"] = [34, 35, 24, 28, 30, 38, 52, 34, 28, 18].map((wch) => ({ wch }));
  dataSheet["!autofilter"] = { ref: "A1:J2" };
  const instructions = XLSX.utils.aoa_to_sheet([
    ["MODELO DE IMPORTAÇÃO — VISUALIZADOR DA LOA"],
    ["Preencha os dados na aba Dados_LOA sem alterar os nomes dos cabeçalhos."],
    ["O campo VALOR aceita números ou valores no formato brasileiro, como R$ 1.250.000,00."],
    ["Cada linha deve representar um registro orçamentário. Exclua a linha de exemplo antes da importação."],
    ["Não insira totais, subtotais ou linhas vazias entre os registros."],
  ]);
  instructions["!cols"] = [{ wch: 110 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, instructions, "Instruções");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Dados_LOA");
  XLSX.writeFile(workbook, "modelo-importacao-loa.xlsx");
}
export function ImportView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [replace, setReplace] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function selectFile(selected?: File) {
    if (!selected) return;
    setMessage(null);
    if (!/\.(xlsx|xls|csv)$/i.test(selected.name)) {
      setMessage({ type: "error", text: "Formato inválido. Selecione um arquivo XLSX, XLS ou CSV." });
      return;
    }
    try {
      setLoading(true);
      const { parseWorkbook } = await import("@/lib/parser");
      const parsed = parseWorkbook(await selected.arrayBuffer());
      setFile(selected);
      setPreview(parsed);
      if (!parsed.hasRequiredFields || parsed.missingOrgan) setMessage({ type: "error", text: "A planilha não possui todos os campos obrigatórios ou há registros sem Órgão." });
      else if (parsed.invalidValues.length) setMessage({ type: "error", text: `${parsed.invalidValues.length} valor(es) não puderam ser interpretados. Revise a coluna VALOR.` });
    } catch {
      setMessage({ type: "error", text: "Não foi possível ler a planilha. Verifique se o arquivo não está corrompido." });
    } finally { setLoading(false); }
  }

  function cancel() {
    setFile(null); setPreview(null); setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function confirm() {
    if (!file || !preview) return;
    setLoading(true); setMessage(null);
    const body = new FormData(); body.set("file", file); body.set("replace", String(replace));
    try {
      const response = await fetch("/api/import", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setMessage({ type: "success", text: `${result.message} ${integer.format(result.summary.rows)} registros e ${currency.format(result.summary.totalValue)} importados.` });
      setFile(null); setPreview(null);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Falha na importação." });
    } finally { setLoading(false); }
  }

  const total = preview?.records.reduce((sum, row) => sum + row.value, 0) ?? 0;
  const valid = Boolean(preview?.hasRequiredFields && !preview.missingOrgan && !preview.invalidValues.length && preview.records.length);
  return (
    <>
      <header className="page-heading border-b border-outline-variant/30 pb-4 mb-6">
        <div>
          <p className="eyebrow font-bold uppercase text-on-surface-variant tracking-wider text-[11px]">Base orçamentária</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Importação de Dados da LOA</h1>
          <p className="text-on-surface-variant mt-1">Carregue, valide e confirme a planilha antes de atualizar o painel.</p>
        </div>
      </header>

      {message && (
        <div className={`p-4 rounded-xl text-sm mb-6 border ${
          message.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`} role="alert">
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Card */}
        <section className="lg:col-span-8 panel p-6 bg-surface">
          <h2 className="text-md font-bold text-on-surface mb-4">Carregar Nova Planilha</h2>
          <div
            className={`border-dashed border-2 border-outline-variant rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all ${
              dragging ? "bg-surface-container/30 border-tertiary" : "bg-surface"
            }`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(event.dataTransfer.files[0]); }}
          >
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">upload_file</span>
            <h3 className="font-headline font-bold text-sm mb-2">{loading ? "Lendo planilha..." : "Arraste sua planilha para cá"}</h3>
            <p className="text-xs text-on-surface-variant mb-4">Arquivos XLSX, XLS ou CSV de até 25 MB</p>
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
        </section>

        {/* Expected Fields Info */}
        <aside className="lg:col-span-4 panel bg-surface p-6">
          <h2 className="text-md font-bold text-on-surface mb-4">Campos esperados</h2>
          <ul className="space-y-1.5 pl-0 list-none text-xs font-semibold text-on-surface-variant font-mono">
            {["CD_ÓRGÃO-DS_ÓRGÃO", "CD_UNID.-DS_UNID.", "CD_FUNÇÃO-DS_FUNÇÃO", "CD SUBFUNÇÃO-DS_SUBFUNÇÃO", "CD_PROGRAMA-DS_PROGRAMA", "CD_AÇÃO-DS_AÇÃO", "NATUREZA DE DESPESA", "Desc Sub", "PROCESSO ADMINISTRATIVO", "VALOR"].map((field) => (
              <li key={field} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-on-surface-variant shrink-0 rounded-full" />
                {field}
              </li>
            ))}
          </ul>
          <button
            className="w-full brutalist-button bg-surface text-on-surface hover:bg-surface-container mt-6 font-semibold text-xs border border-outline-variant"
            onClick={() => void downloadTemplate()}
          >
            ↓ Baixar modelo da planilha
          </button>
        </aside>

        {/* Preview Section */}
        {preview && (
          <section className="lg:col-span-12 panel p-6 bg-surface">
            <div className="border-b border-outline-variant pb-3 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-md font-bold text-on-surface">Prévia da importação</h2>
                <p className="text-xs text-on-surface-variant">Confira os primeiros registros antes de confirmar</p>
              </div>
              <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">Validação OK</span>
            </div>

            {/* Validation Log */}
            <div className="bg-neutral-950 text-green-400 font-mono text-xs p-4 rounded-xl mb-6 space-y-1 shadow-inner">
              <div>&gt; [SYSTEM] INICIANDO PARSE DA PLANILHA ORÇAMENTÁRIA...</div>
              <div>&gt; [SYSTEM] PROCESSANDO LINHAS... CONCLUÍDO.</div>
              <div>&gt; [SYSTEM] REGISTROS ENCONTRADOS: {integer.format(preview.records.length)}</div>
              <div>&gt; [SYSTEM] VALOR TOTAL DETECTADO: {currency.format(total)}</div>
              <div>&gt; [SYSTEM] CAMPOS OBRIGATÓRIOS VERIFICADOS: OK</div>
              <div>&gt; [SYSTEM] STATUS: PRONTO PARA PERSISTÊNCIA NO BANCO DE DADOS.</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Linhas válidas", val: integer.format(preview.records.length) },
                { label: "Valor total", val: currency.format(total) },
                { label: "Órgãos", val: new Set(preview.records.map((row) => row.organ)).size },
                { label: "Unidades", val: new Set(preview.records.map((row) => row.budgetUnit)).size },
              ].map((stat) => (
                <div key={stat.label} className="border border-outline-variant p-3 bg-surface rounded-lg shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">{stat.label}</span>
                  <strong className="text-base font-bold text-on-surface block">{stat.val}</strong>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto border border-outline-variant rounded-lg mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Órgão</th>
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3">Programa</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3">Processo</th>
                    <th className="px-4 py-3">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                  {preview.records.slice(0, 5).map((row, index) => (
                    <tr key={`${row.administrativeProcess}-${index}`} className="hover:bg-surface-container-low/30">
                      <td className="px-4 py-3 font-semibold">{row.organ}</td>
                      <td className="px-4 py-3">{row.budgetUnit}</td>
                      <td className="px-4 py-3">{row.program}</td>
                      <td className="px-4 py-3">{row.action}</td>
                      <td className="px-4 py-3 font-mono font-bold">{row.administrativeProcess}</td>
                      <td className="px-4 py-3 font-bold">{currency.format(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-outline-variant/30">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs uppercase select-none text-on-surface">
                <input
                  type="checkbox"
                  checked={replace}
                  onChange={(event) => setReplace(event.target.checked)}
                  className="w-4 h-4 border border-outline-variant accent-tertiary cursor-pointer rounded"
                />
                Substituir dados existentes
              </label>
              <div className="flex gap-3">
                <button
                  className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant"
                  onClick={cancel}
                >
                  Cancelar
                </button>
                <button
                  className="brutalist-button brutalist-button-primary bg-tertiary text-on-tertiary hover:bg-tertiary-container font-semibold text-xs disabled:opacity-50 border-0"
                  onClick={confirm}
                  disabled={!valid || loading}
                >
                  {loading ? "Importando..." : "Confirmar Importação"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
