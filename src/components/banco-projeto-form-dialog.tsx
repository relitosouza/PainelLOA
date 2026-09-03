"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BANCO_PROJETOS_SECRETARIAS } from "@/lib/banco-projetos-data";

export interface BancoProjetoFormData {
  id?: string;
  secretaria: string;
  objeto: string;
  natureza: string;
  edital: string;
  valor: number;
}

type Props = {
  isOpen: boolean;
  initialData?: BancoProjetoFormData | null;
  onClose: () => void;
  onSave: (data: BancoProjetoFormData) => void;
};

const NATUREZAS_SUGERIDAS = [
  { code: "4.4.90.51", label: "4.4.90.51 — OBRAS E INSTALAÇÕES" },
  { code: "4.4.90.52", label: "4.4.90.52 — EQUIPAMENTOS E MATERIAL PERMANENTE" },
  { code: "3.3.90.39", label: "3.3.90.39 — OUTROS SERVIÇOS DE TERCEIROS - PJ" },
  { code: "3.3.90.30", label: "3.3.90.30 — MATERIAL DE CONSUMO" },
  { code: "3.3.90.40", label: "3.3.90.40 — SERVIÇOS DE TI E COMUNICAÇÃO" },
  { code: "3.3.50.39", label: "3.3.50.39 — OUTROS SERVIÇOS DE TERCEIROS - PJ (TRANSFERÊNCIAS A ENTIDADES)" },
  { code: "4.4.50.52", label: "4.4.50.52 — EQUIPAMENTOS E MATERIAL PERMANENTE (ENTIDADES)" },
  { code: "3.3.90.36", label: "3.3.90.36 — OUTROS SERVIÇOS DE TERCEIROS - PF" },
  { code: "3.3.90.35", label: "3.3.90.35 — SERVIÇOS DE CONSULTORIA" },
  { code: "3.3.90.48", label: "3.3.90.48 — OUTROS AUXÍLIOS FINANCEIROS A PESSOAS FÍSICAS" },
  { code: "3.1.90.11", label: "3.1.90.11 — VENCIMENTOS E VANTAGENS FIXAS - PESSOAL CIVIL" },
];

export function BancoProjetoFormDialog({ isOpen, initialData, onClose, onSave }: Props) {
  const [secretaria, setSecretaria] = useState("");
  const [objeto, setObjeto] = useState("");
  const [natureza, setNatureza] = useState("");
  const [edital, setEdital] = useState("Não");
  const [valorStr, setValorStr] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLSelectElement | HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSecretaria(initialData.secretaria || "");
        setObjeto(initialData.objeto || "");
        setNatureza(initialData.natureza || "");
        setEdital(initialData.edital || "Não");
        setValorStr(
          initialData.valor
            ? initialData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : ""
        );
      } else {
        setSecretaria(BANCO_PROJETOS_SECRETARIAS[0]?.secretaria || "");
        setObjeto("");
        setNatureza("4.4.90.51 — OBRAS E INSTALAÇÕES");
        setEdital("Não");
        setValorStr("");
      }
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const parseValor = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretaria.trim() || !objeto.trim()) {
      alert("Por favor, preencha a Secretaria e o Objeto/Detalhe do Projeto.");
      return;
    }

    const valorFinal = parseValor(valorStr);

    onSave({
      id: initialData?.id,
      secretaria: secretaria.trim(),
      objeto: objeto.trim(),
      natureza: natureza.trim() || "Não informada",
      edital: edital.trim() || "Não",
      valor: valorFinal,
    });
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="banco-projeto-form-title"
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[min(780px,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-outline-variant bg-surface shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between border-b border-outline-variant bg-surface-container/50 p-5">
          <div>
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-lg">folder_special</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Banco de Projetos</p>
            </div>
            <h2 id="banco-projeto-form-title" className="mt-1 text-lg font-bold text-on-surface">
              {initialData ? "Editar Projeto" : "Novo Projeto no Banco"}
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {initialData
                ? "Altere as informações do projeto antes de alocá-lo na LOA."
                : "Cadastre um novo projeto na carteira de projetos previstos."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-h-10 min-w-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-5">
          {/* Secretaria */}
          <div>
            <label htmlFor="bp-form-secretaria" className="block text-xs font-bold text-on-surface">
              Secretaria *
            </label>
            <select
              id="bp-form-secretaria"
              ref={firstInputRef as React.RefObject<HTMLSelectElement>}
              value={secretaria}
              onChange={(e) => setSecretaria(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary cursor-pointer"
              required
            >
              <option value="">Selecione a Secretaria...</option>
              {BANCO_PROJETOS_SECRETARIAS.map((sec) => (
                <option key={sec.secretaria} value={sec.secretaria}>
                  {sec.secretaria}
                </option>
              ))}
            </select>
          </div>

          {/* Objeto / Detalhe do Projeto */}
          <div>
            <label htmlFor="bp-form-objeto" className="block text-xs font-bold text-on-surface">
              Objeto / Detalhe do Projeto *
            </label>
            <textarea
              id="bp-form-objeto"
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              rows={3}
              placeholder="Ex.: Reforma e ampliação da EMEF Prof. José Silva..."
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary resize-y"
              required
            />
          </div>

          {/* Natureza da Despesa */}
          <div>
            <label htmlFor="bp-form-natureza" className="block text-xs font-bold text-on-surface">
              Natureza da Despesa
            </label>
            <input
              id="bp-form-natureza"
              list="bp-naturezas-list"
              value={natureza}
              onChange={(e) => setNatureza(e.target.value)}
              placeholder="Ex.: 4.4.90.51 ou selecione da lista"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary"
            />
            <datalist id="bp-naturezas-list">
              {NATUREZAS_SUGERIDAS.map((item) => (
                <option key={item.code} value={item.label}>
                  {item.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Previsão do Edital */}
            <div>
              <label htmlFor="bp-form-edital" className="block text-xs font-bold text-on-surface">
                Previsão de Edital
              </label>
              <select
                id="bp-form-edital"
                value={edital}
                onChange={(e) => setEdital(e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary cursor-pointer"
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
                <option value="1º Trimestre">1º Trimestre</option>
                <option value="2º Trimestre">2º Trimestre</option>
                <option value="3º Trimestre">3º Trimestre</option>
                <option value="4º Trimestre">4º Trimestre</option>
                <option value="Em elaboração">Em elaboração</option>
              </select>
            </div>

            {/* Valor Previsto */}
            <div>
              <label htmlFor="bp-form-valor" className="block text-xs font-bold text-on-surface">
                Valor Previsto (R$)
              </label>
              <input
                id="bp-form-valor"
                value={valorStr}
                onChange={(e) => setValorStr(e.target.value.replace(/-/g, ""))}
                inputMode="decimal"
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right font-mono text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container/30 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-tertiary px-5 py-2 text-xs font-bold text-on-tertiary hover:opacity-90 transition-opacity shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{initialData ? "Salvar Alterações" : "Adicionar ao Banco"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
