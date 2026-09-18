"use client";

import { useState, useRef, useTransition } from "react";
import { processDetalhamentoWorkbook, type ImportDetalhamentoResult, type ItemChangeSummary } from "@/lib/import-detalhamento-excel";
import type { RawBudgetItem } from "@/lib/loa-analise-items";
import { currency } from "@/lib/format";

interface ImportarDetalhamentoModalProps {
  open: boolean;
  onClose: () => void;
  currentItems: RawBudgetItem[];
  currentValidatedRows: Record<string, boolean>;
  currentJustifications: Record<string, string>;
  onApplyImport: (result: ImportDetalhamentoResult, justificativaGeral: string) => Promise<void>;
}

export function ImportarDetalhamentoModal({
  open,
  onClose,
  currentItems,
  currentValidatedRows,
  currentJustifications,
  onApplyImport,
}: ImportarDetalhamentoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImportDetalhamentoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [justificativaGeral, setJustificativaGeral] = useState<string>("Atualização em lote via importação da planilha LOA Completo");
  const [filterCampo, setFilterCampo] = useState<string>("todos");
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage("");
    setAnalysisResult(null);
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      startTransition(() => {
        const result = processDetalhamentoWorkbook(
          buffer,
          currentItems,
          currentValidatedRows,
          currentJustifications
        );

        if (!result.success) {
          setErrorMessage(result.warnings[0] || "Não foi possível ler a planilha.");
        } else {
          setAnalysisResult(result);
        }
        setIsProcessing(false);
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao processar o arquivo Excel.");
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        void handleFileChange(droppedFile);
      } else {
        setErrorMessage("Por favor, selecione um arquivo Excel (.xlsx ou .xls).");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleConfirm = async () => {
    if (!analysisResult) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await onApplyImport(analysisResult, justificativaGeral);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao aplicar as alterações no sistema.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChanges = analysisResult?.alteracoes.filter((item) => {
    if (filterCampo === "todos") return true;
    if (filterCampo === "valores") {
      return ["Valor Vigente", "Valor Total LOA 2027", "Reajuste", "Aditamento", "Sugestão SF", "Corte GP", "Novo Registro Adicionado"].includes(item.campo);
    }
    if (filterCampo === "novos") {
      return item.campo === "Novo Registro Adicionado";
    }
    if (filterCampo === "cadastral") {
      return ["Processo", "Código de Aplicação", "Contrato / Projeto Iniciado", "Justificativa / Observação"].includes(item.campo);
    }
    return item.campo === filterCampo;
  }) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/60 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-2xl">upload_file</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface font-headline">
                Importar Detalhamento LOA Completo
              </h2>
              <p className="text-xs text-on-surface-variant">
                Atualize valores, reajustes, aditamentos e dados cadastrais a partir do Excel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Área de Upload / Arrastar Arquivo */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                : "border-outline-variant hover:border-primary/60 hover:bg-surface-container-low"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  void handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <span className={`material-symbols-outlined text-3xl ${file ? "text-emerald-600" : "text-on-surface-variant"}`}>
                {file ? "task" : "cloud_upload"}
              </span>
              {file ? (
                <div>
                  <p className="text-xs font-bold text-on-surface">{file.name}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {(file.size / 1024).toFixed(1)} KB · Clique ou arraste outro arquivo para substituir
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Clique para selecionar ou arraste o arquivo Excel aqui
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Suporta planilhas com a aba <strong>Detalhamento_LOA_Completo</strong> (.xlsx)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Estado de Processamento */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs font-semibold text-primary">
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              <span>Analisando e comparando dados da planilha com o sistema...</span>
            </div>
          )}

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resultado da Análise / Preview */}
          {analysisResult && !isProcessing && (
            <div className="space-y-4">
              
              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Linhas Lidas</span>
                  <p className="text-lg font-extrabold font-mono text-on-surface">{analysisResult.totalLinhasLidas}</p>
                </div>
                <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Correspondidas</span>
                  <p className="text-lg font-extrabold font-mono text-teal-700 dark:text-teal-400">{analysisResult.correspondencias}</p>
                </div>
                <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Com Alterações</span>
                  <p className="text-lg font-extrabold font-mono text-primary">{analysisResult.itensModificados}</p>
                </div>
                <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Campos Alterados</span>
                  <p className="text-lg font-extrabold font-mono text-amber-700 dark:text-amber-400">
                    {analysisResult.alteracoes.length}
                    {analysisResult.addedExpenses && analysisResult.addedExpenses.length > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
                        (+{analysisResult.addedExpenses.length} novos)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Tabela de Alterações Detectadas */}
              {analysisResult.alteracoes.length > 0 ? (
                <div className="rounded-xl border border-outline-variant overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between p-3 bg-surface-container-low border-b border-outline-variant/60 gap-2">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">difference</span>
                      <span>Alterações Detectadas ({filteredChanges.length})</span>
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-on-surface-variant font-medium">Filtrar:</span>
                      <select
                        value={filterCampo}
                        onChange={(e) => setFilterCampo(e.target.value)}
                        className="rounded-lg border border-outline-variant bg-surface px-2 py-1 text-xs text-on-surface font-semibold focus:outline-none"
                      >
                        <option value="todos">Todos os campos</option>
                        <option value="valores">Apenas Valores Financeiros</option>
                        <option value="novos">Apenas Novas Linhas Adicionadas</option>
                        <option value="cadastral">Apenas Dados Cadastrais</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-outline-variant/40 text-xs">
                    {filteredChanges.map((change, idx) => {
                      const isNumber = typeof change.novo === "number";
                      const diffNumber = isNumber ? (change.novo as number) - (change.antigo as number) : null;
                      return (
                        <div key={`${change.itemId}-${change.campo}-${idx}`} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container-lowest">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{change.campo}</span>
                            <p className="font-semibold text-on-surface truncate">{change.acao}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {change.natureza} · {change.subelemento}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-right">
                            <div>
                              <span className="text-[9px] block text-on-surface-variant uppercase">Antes</span>
                              <span className="text-on-surface-variant line-through">
                                {isNumber ? currency.format(change.antigo as number) : String(change.antigo)}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-xs text-outline-variant">arrow_forward</span>
                            <div>
                              <span className="text-[9px] block text-emerald-700 dark:text-emerald-400 font-bold uppercase">Novo</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {isNumber ? currency.format(change.novo as number) : String(change.novo)}
                              </span>
                            </div>
                            {diffNumber !== null && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${diffNumber > 0 ? "bg-emerald-100 text-emerald-800" : diffNumber < 0 ? "bg-rose-100 text-rose-800" : "bg-gray-100 text-gray-700"}`}>
                                {diffNumber > 0 ? `+${currency.format(diffNumber)}` : currency.format(diffNumber)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-surface-container-low text-center space-y-1">
                  <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                  <p className="text-xs font-bold text-on-surface">Todos os dados já estão idênticos ao sistema!</p>
                  <p className="text-[11px] text-on-surface-variant">Nenhuma alteração de valor ou cadastro foi identificada no arquivo.</p>
                </div>
              )}

              {/* Justificativa Geral da Importação */}
              {analysisResult.alteracoes.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="import-justificativa" className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">description</span>
                    <span>Justificativa da Importação em Lote</span>
                  </label>
                  <input
                    id="import-justificativa"
                    type="text"
                    value={justificativaGeral}
                    onChange={(e) => setJustificativaGeral(e.target.value)}
                    placeholder="Informe a motivação das alterações (ex: Ajuste LDO/LOA acordado com a Secretaria)..."
                    className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Avisos de linhas não encontradas */}
              {analysisResult.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs space-y-1 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>Avisos de Importação ({analysisResult.warnings.length})</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {analysisResult.warnings.slice(0, 5).map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                    {analysisResult.warnings.length > 5 && (
                      <li>...e mais {analysisResult.warnings.length - 5} aviso(s).</li>
                    )}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-outline-variant/60 bg-surface-container-lowest">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                !analysisResult ||
                (analysisResult.alteracoes.length === 0 && (!analysisResult.addedExpenses || analysisResult.addedExpenses.length === 0)) ||
                isSaving
              }
              onClick={() => void handleConfirm()}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                analysisResult &&
                (analysisResult.alteracoes.length > 0 || (analysisResult.addedExpenses && analysisResult.addedExpenses.length > 0)) &&
                !isSaving
                  ? "bg-primary text-on-primary hover:bg-primary/90"
                  : "bg-surface-container text-on-surface-variant/50 border border-outline-variant cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Aplicando e Salvando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save_as</span>
                  <span>
                    Aplicar {analysisResult && analysisResult.itensModificados > 0 ? `${analysisResult.itensModificados} Alterações` : "Alterações"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
