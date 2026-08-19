"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

export type ExpenseElementOption = { code: string; label: string };

type Props = {
  actionLabel: string;
  natureLabel: string;
  subelemento: string;
  setSubelemento: (value: string) => void;
  options?: ExpenseElementOption[];
  value: string;
  setValue: (value: string) => void;
  vinculo: string;
  setVinculo: (value: string) => void;
  codigoAplicacao: string;
  setCodigoAplicacao: (value: string) => void;
  processo: string;
  setProcesso: (value: string) => void;
  projetoIniciado?: string;
  setProjetoIniciado?: (value: string) => void;
  observacao?: string;
  setObservacao?: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  parseValue: (value: string) => number;
};

export const VINCULO_OPTIONS = [
  { value: "01", label: "01 — Tesouro" },
  { value: "02", label: "02 — Estado" },
  { value: "03", label: "03 — Fundos" },
  { value: "04", label: "04 — Indireta" },
  { value: "05", label: "05 — Federal" },
  { value: "06", label: "06 — Outras Fonte" },
  { value: "07", label: "07 — Operação de Crédito" },
  { value: "08", label: "08 — Emendas Individuais" },
];

export function formatVinculoComAplicacao(fonteVinculo?: string, codigoAplicacao?: string): string {
  const fonte = (fonteVinculo || "01").trim();
  const app = (codigoAplicacao || "").trim();
  if (!app) return fonte;

  if (fonte.includes(app) || fonte.includes(`.${app}`)) return fonte;

  if (/^\d+$/.test(fonte)) {
    return `${fonte}.${app}`;
  }

  if (fonte.includes("—") || fonte.includes("-")) {
    const [code, ...rest] = fonte.split(/[—-]/);
    const desc = rest.join("—").trim();
    return `${code.trim()}.${app}${desc ? ` — ${desc}` : ""}`;
  }

  return `${fonte}.${app}`;
}

export function AddElementExpenseDialog({
  actionLabel,
  natureLabel,
  subelemento,
  setSubelemento,
  options = [],
  value,
  setValue,
  vinculo,
  setVinculo,
  codigoAplicacao,
  setCodigoAplicacao,
  processo,
  setProcesso,
  projetoIniciado,
  setProjetoIniciado,
  observacao,
  setObservacao,
  onClose,
  onConfirm,
  parseValue,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const subelementRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => subelementRef.current?.focus());
    return () => {
      triggerRef.current?.focus();
      triggerRef.current = null;
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled])"
      ),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const canConfirm = Boolean(subelemento.trim() && (!value || parseValue(value) >= 0));

  return (
    <div
      className="fixed inset-0 z-[51] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-subelement-title"
      onKeyDown={onKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex max-h-[min(780px,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-outline-variant bg-surface shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between border-b border-outline-variant bg-surface-container/50 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Novo subelemento de despesa
            </p>
            <h2 id="add-subelement-title" className="mt-1 text-lg font-bold text-on-surface">
              Adicionar Subelemento
            </h2>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
              {actionLabel} · {natureLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar adicionar subelemento"
            className="min-h-10 min-w-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Natureza da Despesa */}
          <label className="block text-xs font-bold text-on-surface">
            Natureza de despesa *
            <input
              value={natureLabel}
              readOnly
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface-variant"
            />
          </label>

          {/* Subelemento (Campo Livre) */}
          <div>
            <label htmlFor="input-subelemento" className="block text-xs font-bold text-on-surface">
              Subelemento *
            </label>
            <p className="mt-0.5 text-[11px] text-on-surface-variant">
              Campo livre. Digite a descrição ou código do subelemento que desejar.
            </p>
            <input
              id="input-subelemento"
              ref={subelementRef}
              list="subelementos-sugestoes"
              value={subelemento}
              onChange={(event) => setSubelemento(event.target.value)}
              placeholder="Ex.: 01 — JUROS DA DÍVIDA CONTRATUAL ou Serviços Terceiros"
              className="mt-1 w-full rounded-lg border border-primary bg-surface px-3 py-2 text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
            {options.length > 0 && (
              <datalist id="subelementos-sugestoes">
                {options.map((opt) => (
                  <option key={`${opt.code}-${opt.label}`} value={opt.code ? `${opt.code} — ${opt.label}` : opt.label}>
                    {opt.code ? `${opt.code} — ` : ""}{opt.label}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          {/* Valor LOA */}
          <label className="block text-xs font-bold text-on-surface">
            Valor LOA *
            <input
              value={value}
              onChange={(event) => setValue(event.target.value.replace(/-/g, ""))}
              inputMode="decimal"
              placeholder="Ex.: 25.000,00"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </label>

          {/* Bloco Unificado: Vínculo & Código de Aplicação */}
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest/80 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Vínculo & Aplicação</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700 font-mono font-bold text-[11px]">
                <span className="material-symbols-outlined text-[12px]">account_balance</span>
                <span>{formatVinculoComAplicacao(vinculo || "01", codigoAplicacao)}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Fonte / Vínculo
                </label>
                <select
                  value={vinculo}
                  onChange={(event) => setVinculo(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-mono text-on-surface focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {VINCULO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Código de Aplicação
                </label>
                <input
                  value={codigoAplicacao}
                  onChange={(event) => setCodigoAplicacao(event.target.value)}
                  placeholder="Ex.: 110.0000"
                  className="w-full rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <p className="text-[10px] text-on-surface-variant font-normal">
              Composição: <strong className="font-mono text-on-surface">{vinculo || "01"}</strong> (Fonte) . <strong className="font-mono text-on-surface">{codigoAplicacao || "110.0000"}</strong> (Aplicação.Variável)
            </p>
          </div>

          {/* Processo Administrativo */}
          <label className="block text-xs font-bold text-on-surface">
            Processo
            <input
              value={processo}
              onChange={(event) => setProcesso(event.target.value)}
              placeholder="Opcional (Ex.: 12345/2026)"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </label>

          {/* Projeto Iniciado */}
          {setProjetoIniciado && (
            <label className="block text-xs font-bold text-on-surface">
              Projeto Iniciado
              <select
                value={projetoIniciado || ""}
                onChange={(event) => setProjetoIniciado(event.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="">Não informado</option>
                <option value="SIM">SIM</option>
                <option value="NÃO">NÃO</option>
              </select>
            </label>
          )}

          {/* Observação */}
          {setObservacao && (
            <label className="block text-xs font-bold text-on-surface">
              Observação
              <textarea
                value={observacao || ""}
                onChange={(event) => setObservacao(event.target.value)}
                placeholder="Observação complementar (opcional)"
                rows={2}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none resize-y"
              />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container/40 p-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="min-h-11 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            Adicionar subelemento
          </button>
        </div>
      </div>
    </div>
  );
}
