"use client";

import React, { useState, useRef } from "react";
import { currency, integer } from "@/lib/format";
import type { LoaReceitaRowRaw } from "@/lib/loa-receita-parser";

interface PreviewLoaReceita {
  nomeArquivo: string;
  exercicio: number;
  records: LoaReceitaRowRaw[];
  totalLinhas: number;
  registrosValidos: number;
  registrosComAlerta: number;
  registrosInvalidos: number;
  registrosDuplicados: number;
  valorTotalLoa: number;
  fontesUnicas: number;
  naturezasUnicas: number;
  hasRequiredFields: boolean;
  missingFields: string[];
}

export function LoaReceitaImportForm({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [exercicio, setExercicio] = useState<number>(new Date().getFullYear() + 1);
  const [modoImportacao, setModoImportacao] = useState<"substituir" | "complementar">("substituir");
  const [acaoDuplicados, setAcaoDuplicados] = useState<"consolidar" | "rejeitar" | "manter">("consolidar");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewLoaReceita | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "warning"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file?: File | null) {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setMessage({ type: "error", text: "Formato inválido. Selecione um arquivo Excel (.xlsx, .xls) ou CSV." });
      return;
    }

    setSelectedFile(file);
    setMessage(null);
    setPreview(null);
    setIsValidating(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("exercicio", exercicio.toString());

    try {
      const res = await fetch("/api/receitas/loa/validar-arquivo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setPreview(data);
        if (!data.hasRequiredFields) {
          setMessage({
            type: "error",
            text: `A planilha não contém as colunas mínimas obrigatórias: ${data.missingFields.join(", ")}.`,
          });
        } else if (data.registrosInvalidos > 0) {
          setMessage({
            type: "warning",
            text: `Atenção: ${data.registrosInvalidos} registro(s) possuem valores inválidos ou formatação inadequada.`,
          });
        }
      } else {
        setMessage({ type: "error", text: data.error || "Falha ao validar os dados da planilha." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao se comunicar com o servidor de validação." });
    } finally {
      setIsValidating(false);
    }
  }

  async function handleConfirmImport() {
    if (!selectedFile || !preview) return;
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("exercicio", exercicio.toString());
    formData.append("modoImportacao", modoImportacao);
    formData.append("acaoDuplicados", acaoDuplicados);

    try {
      const res = await fetch("/api/receitas/loa/confirmar-importacao", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Sucesso! Foram importados ${integer.format(result.quantidadeRegistros)} registros de LOA Receitas (${currency.format(result.valorTotal)}) para o exercício ${result.exercicio}.`,
        });
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onImportSuccess) onImportSuccess();
      } else {
        setMessage({ type: "error", text: result.error || "Falha ao persistir dados da LOA Receitas." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao confirmar importação no servidor." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setSelectedFile(null);
    setPreview(null);
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-8">
      {/* Mensagens de Alerta */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : message.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
              : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : message.type === "warning" ? "warning" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Grid Principal: Upload + Modelo de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seção de Upload e Configuração */}
        <section className="lg:col-span-7 space-y-6">
          <div className="panel p-6 bg-surface border border-outline-variant/60 rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                  Importar Receitas da LOA
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Carregue a planilha com a previsão da receita aprovada na Lei Orçamentária Anual.
                </p>
              </div>

              <a
                href="/api/receitas/loa/modelo"
                download="modelo-receitas-loa.xlsx"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 px-3.5 py-2 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Baixar Modelo (.xlsx)
              </a>
            </div>

            {/* Configurações da Importação */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block text-xs font-semibold text-on-surface">
                Exercício da LOA
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={exercicio}
                  onChange={(e) => setExercicio(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  required
                />
              </label>

              <label className="block text-xs font-semibold text-on-surface">
                Modo de Inserção
                <select
                  value={modoImportacao}
                  onChange={(e) => setModoImportacao(e.target.value as "substituir" | "complementar")}
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                >
                  <option value="substituir">Substituir exercício</option>
                  <option value="complementar">Complementar dados</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-on-surface">
                Naturezas Repetidas
                <select
                  value={acaoDuplicados}
                  onChange={(e) => setAcaoDuplicados(e.target.value as "consolidar" | "rejeitar" | "manter")}
                  className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                >
                  <option value="consolidar">Consolidar (Somar)</option>
                  <option value="manter">Manter todas</option>
                  <option value="rejeitar">Rejeitar duplicadas</option>
                </select>
              </label>
            </div>

            {/* Zona de Dropzone */}
            <div
              className={`border-dashed border-2 rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                dragging
                  ? "bg-surface-container/40 border-primary"
                  : "border-outline-variant bg-surface hover:bg-surface-container-low/40"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void handleFileSelect(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => void handleFileSelect(e.target.files?.[0])}
              />
              <span className="material-symbols-outlined text-[44px] text-primary/70 mb-3">cloud_upload</span>
              <h3 className="font-bold text-sm text-on-surface mb-1">
                {isValidating ? "Validando planilha..." : "Clique ou arraste a planilha aqui"}
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">Formatos suportados: XLSX, XLS ou CSV (até 25 MB)</p>

              <button
                type="button"
                className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant px-4 py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isValidating}
              >
                Selecionar do computador
              </button>

              {selectedFile && (
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold rounded-lg text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-3.5 py-2">
                  <span className="material-symbols-outlined text-base">description</span>
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Especificação do Modelo de Dados */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="panel p-6 bg-surface border border-outline-variant/60 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
              <span className="material-symbols-outlined text-primary text-xl">schema</span>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Modelo de Dados — LOA Receitas</h3>
                <p className="text-[11px] text-on-surface-variant">Padronização conforme normas SOF/STN e AUDESP</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              O modelo de previsão orçamentária da LOA estrutura a receita pública por código, natureza orçamentária,
              especificação e fonte de destinação legal dos recursos.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-semibold">
                    <th className="py-2 px-2.5">Coluna / Campo</th>
                    <th className="py-2 px-2.5">Tipo</th>
                    <th className="py-2 px-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block text-primary">NATUREZA_RECEITA</strong>
                      <span className="text-[10px] text-on-surface-variant">Ex: 1.1.1.8.01.1.1</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Texto</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Obrigatório</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block text-primary">FONTE_RECURSO</strong>
                      <span className="text-[10px] text-on-surface-variant">Vínculo legal (ex: 01.110.0000)</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Texto</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Obrigatório</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block text-primary">VALOR_ORCADO</strong>
                      <span className="text-[10px] text-on-surface-variant">Previsão na LOA em R$</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Moeda / Decimal</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Obrigatório</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block">DESCRICAO_RECEITA</strong>
                      <span className="text-[10px] text-on-surface-variant">Especificação da rubrica</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Texto</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">Recomendado</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block">CD_RECEITA</strong>
                      <span className="text-[10px] text-on-surface-variant">Código estruturado / numérico</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Texto</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-slate-100 text-slate-600">Opcional</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block">DESCRICAO_FONTE</strong>
                      <span className="text-[10px] text-on-surface-variant">Nome do vínculo de recursos</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Texto</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-slate-100 text-slate-600">Opcional</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5">
                      <strong className="block">ORGAO_UNIDADE</strong>
                      <span className="text-[10px] text-on-surface-variant">Secretaria ou Fundo gestor</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px]">Texto</td>
                    <td className="py-2 px-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-slate-100 text-slate-600">Opcional</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-on-surface-variant bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 space-y-1">
              <p className="font-semibold text-on-surface">💡 Dica de Compatibilidade:</p>
              <p>O importador reconhece automaticamente aliases como <code>NATUREZA</code>, <code>VINCULO</code>, <code>ESPECIFICACAO</code>, <code>PREVISAO</code> e <code>VALOR</code> com ou sem acentos.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Seção de Pré-Visualização dos Dados Validados */}
      {preview && (
        <section className="panel p-6 bg-surface border border-outline-variant/60 rounded-xl space-y-6">
          <div className="border-b border-outline-variant/40 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                Prévia da Validação — {preview.nomeArquivo}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Confira o resumo das receitas e os primeiros registros identificados antes de salvar no banco.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {preview.hasRequiredFields && preview.registrosInvalidos === 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">check</span>
                  Validação Aprovada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Contém Alertas
                </span>
              )}
            </div>
          </div>

          {/* KPI Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="border border-outline-variant/60 p-3.5 bg-surface rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
                Total Previsto LOA
              </span>
              <strong className="text-base font-bold text-primary block truncate">
                {currency.format(preview.valorTotalLoa)}
              </strong>
            </div>

            <div className="border border-outline-variant/60 p-3.5 bg-surface rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
                Registros Válidos
              </span>
              <strong className="text-base font-bold text-on-surface block">
                {integer.format(preview.registrosValidos)} / {integer.format(preview.totalLinhas)}
              </strong>
            </div>

            <div className="border border-outline-variant/60 p-3.5 bg-surface rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
                Fontes / Vínculos
              </span>
              <strong className="text-base font-bold text-on-surface block">
                {preview.fontesUnicas} únicos
              </strong>
            </div>

            <div className="border border-outline-variant/60 p-3.5 bg-surface rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
                Naturezas
              </span>
              <strong className="text-base font-bold text-on-surface block">
                {preview.naturezasUnicas} rubricas
              </strong>
            </div>

            <div className="border border-outline-variant/60 p-3.5 bg-surface rounded-xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
                Duplicidades
              </span>
              <strong className="text-base font-bold text-amber-700 block">
                {preview.registrosDuplicados} encontrados
              </strong>
            </div>
          </div>

          {/* Terminal Log de Auditoria */}
          <div className="bg-neutral-950 text-emerald-400 font-mono text-xs p-4 rounded-xl space-y-1 shadow-inner overflow-x-auto">
            <div>&gt; [PARSER] ARQUIVO CARREGADO: {preview.nomeArquivo} ({preview.totalLinhas} LINHAS)</div>
            <div>&gt; [PARSER] EXERCÍCIO ALVO: {preview.exercicio}</div>
            <div>&gt; [PARSER] COLUNA NATUREZA: {preview.colunasEncontradas.naturezaReceita ?? "IDENTIFICADA POR PADRÃO"}</div>
            <div>&gt; [PARSER] COLUNA FONTE/VÍNCULO: {preview.colunasEncontradas.fonteRecurso ?? "IDENTIFICADA POR PADRÃO"}</div>
            <div>&gt; [PARSER] COLUNA VALOR: {preview.colunasEncontradas.valor ?? "IDENTIFICADA POR PADRÃO"}</div>
            <div>&gt; [PARSER] VALOR TOTAL CALCULADO: {currency.format(preview.valorTotalLoa)}</div>
            <div>&gt; [STATUS] MODELO DE DADOS VALIDADO. PRONTO PARA PERSISTÊNCIA.</div>
          </div>

          {/* Tabela de Amostra dos Dados */}
          <div className="overflow-x-auto border border-outline-variant/50 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-semibold uppercase tracking-wider">
                  <th className="px-3.5 py-3">Linha</th>
                  <th className="px-3.5 py-3">Cód. Receita</th>
                  <th className="px-3.5 py-3">Natureza</th>
                  <th className="px-3.5 py-3">Descrição da Receita</th>
                  <th className="px-3.5 py-3">Fonte / Vínculo</th>
                  <th className="px-3.5 py-3">Órgão / Unidade</th>
                  <th className="px-3.5 py-3 text-right">Valor Orçado</th>
                  <th className="px-3.5 py-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                {preview.records.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.linhaOrigem}-${idx}`} className="hover:bg-surface-container-low/40">
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-on-surface-variant">#{row.linhaOrigem}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px]">{row.codigoReceita || "-"}</td>
                    <td className="px-3.5 py-2.5 font-mono font-bold text-primary">{row.naturezaReceita}</td>
                    <td className="px-3.5 py-2.5 max-w-xs truncate" title={row.descricaoReceita}>
                      {row.descricaoReceita}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="font-mono text-xs font-semibold">{row.fonteRecurso}</span>
                      {row.descricaoFonte && (
                        <span className="block text-[10px] text-on-surface-variant truncate max-w-[160px]">
                          {row.descricaoFonte}
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-on-surface-variant text-[11px]">
                      {row.orgaoUnidade || "-"}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-right font-mono">
                      {currency.format(row.valor)}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.situacaoValidacao === "VÁLIDO"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.situacaoValidacao === "DUPLICADO"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {row.situacaoValidacao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ações Finais */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-outline-variant/40">
            <p className="text-xs text-on-surface-variant">
              Exibindo os primeiros registros de um total de {integer.format(preview.records.length)} itens validados.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant px-4 py-2"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="brutalist-button brutalist-button-primary bg-primary text-on-primary hover:bg-primary/90 font-semibold text-xs px-5 py-2 disabled:opacity-50 flex items-center gap-2 border-0"
                onClick={handleConfirmImport}
                disabled={isSubmitting || !preview.hasRequiredFields || preview.registrosValidos === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Gravando no Banco...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Confirmar Importação de LOA Receitas
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
