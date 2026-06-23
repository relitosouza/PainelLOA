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
      <header className="page-heading"><div><p className="eyebrow">Base orçamentária</p><h1>Importação de Dados da LOA</h1><p>Carregue, valide e confirme a planilha antes de atualizar o painel.</p></div></header>
      {message && <div className={`alert ${message.type === "success" ? "success" : ""}`} role="alert">{message.text}</div>}
      <div className="upload-grid">
        <section className="panel upload-card"><div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(event.dataTransfer.files[0]); }}><div><div className="upload-icon" aria-hidden="true">⇧</div><h2>{loading ? "Lendo planilha..." : "Arraste sua planilha para cá"}</h2><p>Arquivos XLSX, XLS ou CSV de até 25 MB</p><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void selectFile(event.target.files?.[0])} aria-label="Selecionar planilha" /><button className="button primary" onClick={() => inputRef.current?.click()} disabled={loading}>Selecionar arquivo</button>{file && <p><strong>{file.name}</strong></p>}</div></div></section>
        <aside className="panel expectations"><h2>Campos esperados</h2><ul className="expected-list"><li>CD_ÓRGÃO-DS_ÓRGÃO</li><li>CD_UNID.-DS_UNID.</li><li>CD_FUNÇÃO-DS_FUNÇÃO</li><li>CD SUBFUNÇÃO-DS_SUBFUNÇÃO</li><li>CD_PROGRAMA-DS_PROGRAMA</li><li>CD_AÇÃO-DS_AÇÃO</li><li>NATUREZA DE DESPESA</li><li>Desc Sub</li><li>PROCESSO ADMINISTRATIVO</li><li>VALOR</li></ul><button className="button secondary" style={{ marginTop: 20, width: "100%" }} onClick={() => void downloadTemplate()}>↓ Baixar modelo da planilha</button></aside>
        {preview && <section className="panel preview"><div className="panel-header"><div><h2 className="panel-title">Prévia da importação</h2><p className="panel-caption">Confira os primeiros registros antes de confirmar</p></div></div><div className="import-summary"><div className="import-stat"><span>Linhas válidas</span><strong>{integer.format(preview.records.length)}</strong></div><div className="import-stat"><span>Valor total</span><strong>{currency.format(total)}</strong></div><div className="import-stat"><span>Órgãos</span><strong>{new Set(preview.records.map((row) => row.organ)).size}</strong></div><div className="import-stat"><span>Unidades</span><strong>{new Set(preview.records.map((row) => row.budgetUnit)).size}</strong></div></div><div className="table-wrap"><table><thead><tr><th>Órgão</th><th>Unidade</th><th>Programa</th><th>Ação</th><th>Processo</th><th>Valor</th></tr></thead><tbody>{preview.records.slice(0, 5).map((row, index) => <tr key={`${row.administrativeProcess}-${index}`}><td>{row.organ}</td><td>{row.budgetUnit}</td><td>{row.program}</td><td>{row.action}</td><td>{row.administrativeProcess}</td><td className="value">{currency.format(row.value)}</td></tr>)}</tbody></table></div><div className="import-actions"><label className="checkbox"><input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} /> Substituir dados existentes</label><div><button className="button secondary" onClick={cancel}>Cancelar</button> <button className="button primary" onClick={confirm} disabled={!valid || loading}>{loading ? "Importando..." : "Confirmar Importação"}</button></div></div></section>}
      </div>
    </>
  );
}
