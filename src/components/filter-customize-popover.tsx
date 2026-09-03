"use client";

import { useState, useRef, useEffect } from "react";

export interface FilterFieldDefinition {
  key: string;
  label: string;
  category?: string;
  description?: string;
  activeCount?: number;
}

interface FilterCustomizePopoverProps {
  fields: FilterFieldDefinition[];
  visibleKeys: string[];
  onToggleField: (key: string) => void;
  onShowAll: () => void;
  onResetDefault: () => void;
  isSaving?: boolean;
  className?: string;
}

export function FilterCustomizePopover({
  fields,
  visibleKeys,
  onToggleField,
  onShowAll,
  onResetDefault,
  isSaving = false,
  className = "",
}: FilterCustomizePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  const visibleCount = visibleKeys.length;
  const totalCount = fields.length;
  const isAllVisible = visibleCount === totalCount;

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Botão de abertura */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Personalizar quais filtros aparecem no painel"
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer ${
          isOpen
            ? "bg-primary text-on-primary border-primary shadow-sm"
            : visibleCount < totalCount
            ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
            : "border-outline-variant text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
        }`}
        data-testid="filters-customize-toggle"
      >
        <span className="material-symbols-outlined text-xs">
          {visibleCount < totalCount ? "tune" : "playlist_add_check"}
        </span>
        <span>Personalizar</span>
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            isOpen
              ? "bg-on-primary/20 text-on-primary"
              : "bg-surface-container text-on-surface-variant border border-outline-variant/60"
          }`}
        >
          {visibleCount}/{totalCount}
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-surface rounded-2xl shadow-2xl border border-outline-variant p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95"
          data-testid="filters-customize-popover"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-outline-variant/50 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">tune</span>
              <div>
                <h4 className="text-xs font-bold text-on-surface">Personalizar Filtros</h4>
                <p className="text-[10px] text-on-surface-variant">
                  Marque os campos que deseja exibir
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Busca rápida */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar dimensão..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.2 text-xs rounded-lg border border-outline-variant bg-surface-container/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <span className="material-symbols-outlined text-xs absolute left-2 top-2 text-on-surface-variant/70">
              search
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1.5 text-xs text-on-surface-variant hover:text-on-surface"
              >
                ×
              </button>
            )}
          </div>

          {/* Lista de Dimensões / Checkboxes */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredFields.length === 0 ? (
              <div className="text-center py-4 text-xs text-on-surface-variant">
                Nenhum filtro encontrado para &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredFields.map((field) => {
                const isChecked = visibleKeys.includes(field.key);
                const hasActiveValues = (field.activeCount || 0) > 0;

                return (
                  <label
                    key={field.key}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      isChecked
                        ? "bg-primary/5 hover:bg-primary/10 text-on-surface"
                        : "hover:bg-surface-container/50 text-on-surface-variant opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleField(field.key)}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-primary"
                      />
                      <span className={`truncate font-medium ${isChecked ? "text-on-surface font-semibold" : ""}`}>
                        {field.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {hasActiveValues && (
                        <span
                          className="px-1.5 py-0.2 text-[9px] bg-primary text-on-primary font-bold rounded-full"
                          title="Este filtro possui valores ativos aplicados"
                        >
                          {field.activeCount} ativos
                        </span>
                      )}
                      {!isChecked && hasActiveValues && (
                        <span
                          className="material-symbols-outlined text-xs text-amber-600"
                          title="Filtro oculto mas aplicando restrições"
                        >
                          warning
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Ações e Rodapé */}
          <div className="pt-2.5 border-t border-outline-variant/50 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onShowAll}
                disabled={isAllVisible}
                className={`text-primary hover:underline font-semibold cursor-pointer ${
                  isAllVisible ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                Exibir Todos
              </button>
              <span className="text-outline-variant">|</span>
              <button
                type="button"
                onClick={onResetDefault}
                className="text-on-surface-variant hover:text-on-surface hover:underline cursor-pointer"
              >
                Padrão
              </button>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
              <span className="material-symbols-outlined text-xs text-emerald-600">
                {isSaving ? "sync" : "cloud_done"}
              </span>
              <span>{isSaving ? "Salvando..." : "Salvo no banco"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
