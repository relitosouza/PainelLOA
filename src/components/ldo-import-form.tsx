"use client";

import React, { useState, useRef } from "react";
import { currency } from "@/lib/format";

interface PreviewValidation {
  nomeArquivo: string;
  exercicio: number;
  records: Array<{
    apelidoOriginal: string;
    vinculo: string;
    descricaoVinculo: string;
    total: number;
    situacaoValidacao: string;
  }>;
  totalLinhas: number;
  registrosValidos: number;
  registrosDuplicados: number;
  valorTotalLdo: number;
}

export function LdoImportForm({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [exercicio, setExercicio] = useState<number>(new Date().getFullYear() + 1);
  const [numeroLdo, setNumeroLdo] = useState("Lei Orçamentária LDO-" + (new Date().getFullYear() + 1));
  const [observacoes, setObservacoes] = useState("");
  const [acaoDuplicados, setAcaoDuplicados] = useState("consolidar");
  const [modoImportacao] = useState("substituir");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewValidation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("exercicio", exercicio.toString());

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/receitas/ldo/validar-arquivo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      } else {
        const err = await res.json();
        setUploadMessage({ type: "error", text: err.error || "Falha ao validar a planilha." });
      }
    } catch {
      setUploadMessage({ type: "error", text: "Erro ao ler a planilha. Verifique o arquivo." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmImport() {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("exercicio", exercicio.toString());
    formData.append("numeroLdo", numeroLdo);
    formData.append("observacoes", observacoes);
    formData.append("acaoDuplicados", acaoDuplicados);
    formData.append("modoImportacao", modoImportacao);

    try {
      const res = await fetch("/api/receitas/ldo/confirmar-importacao", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadMessage({ type: "success", text: "Importação da LDO concluída com sucesso! Os dados já foram atualizados no banco." });
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onImportSuccess) onImportSuccess();
      } else {
        const err = await res.json();
        setUploadMessage({ type: "error", text: err.error || "Erro ao gravar a importação." });
      }
    } catch {
      setUploadMessage({ type: "error", text: "Erro ao conectar com o servidor." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface border border-outline-variant p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
          <h3 className="text-lg font-bold text-on-surface">Formulário de Importação das Receitas da LDO</h3>
          <a
            href="/api/receitas/ldo/modelo"
            download
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Baixar Modelo (.xlsx)
          </a>
        </div>

        {uploadMessage && (
          <div
            className={`p-4 rounded-lg text-sm font-semibold ${
              uploadMessage.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {uploadMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Exercício da LDO *</label>
            <input
              type="number"
              value={exercicio}
              onChange={(e) => setExercicio(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg outline-none focus:border-primary font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Número / Identificação da LDO</label>
            <input
              type="text"
              value={numeroLdo}
              onChange={(e) => setNumeroLdo(e.target.value)}
              placeholder="Ex: Lei nº 4.500/2026"
              className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Planilha de previsão aprovada na Câmara de Vereadores..."
            className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg outline-none focus:border-primary h-20"
          />
        </div>

        {/* Configuração de Tratamento de Duplicados */}
        <div className="bg-surface-container/50 border border-outline-variant/50 p-4 rounded-lg space-y-2">
          <span className="text-xs font-bold text-on-surface">Regra para Registros Duplicados (Mesmo Apelido + Vínculo):</span>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="duplicados"
                checked={acaoDuplicados === "consolidar"}
                onChange={() => setAcaoDuplicados("consolidar")}
              />
              Consolidar (Somar totais)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="duplicados"
                checked={acaoDuplicados === "manter"}
                onChange={() => setAcaoDuplicados("manter")}
              />
              Manter linhas individualizadas
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="duplicados"
                checked={acaoDuplicados === "rejeitar"}
                onChange={() => setAcaoDuplicados("rejeitar")}
              />
              Rejeitar duplicados
            </label>
          </div>
        </div>

        {/* Dropzone de Arquivo */}
        <div className="border-2 border-dashed border-outline-variant p-6 rounded-xl text-center space-y-3 bg-surface-container-low">
          <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
          <div>
            <p className="text-sm font-bold text-on-surface">Selecione ou arraste a planilha da LDO</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Formatos suportados: .xlsx, .xls, .csv</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="ldo-file-input"
          />

          <label
            htmlFor="ldo-file-input"
            className="inline-block px-5 py-2 text-xs font-bold text-white bg-primary rounded-lg cursor-pointer hover:bg-primary/90 transition-colors shadow-xs"
          >
            {selectedFile ? selectedFile.name : "Selecionar Arquivo da LDO"}
          </label>
        </div>

        {/* Pré-visualização de Validação */}
        {preview && (
          <div className="space-y-4 pt-4 border-t border-outline-variant">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-surface-container p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total Linhas</span>
                <p className="text-base font-bold text-on-surface">{preview.totalLinhas}</p>
              </div>
              <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
                <span className="text-[10px] font-bold text-green-700 uppercase">Válidos</span>
                <p className="text-base font-bold text-green-800">{preview.registrosValidos}</p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Duplicados</span>
                <p className="text-base font-bold text-amber-800">{preview.registrosDuplicados}</p>
              </div>
              <div className="bg-surface-container p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Valor LDO Total</span>
                <p className="text-base font-bold text-primary">{currency.format(preview.valorTotalLdo)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-xs"
              >
                {isSubmitting ? "Gravando no Banco..." : "Confirmar Importação LDO"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
