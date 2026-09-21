import React, { useState } from "react";
import type { RawBudgetItem } from "@/lib/loa-analise-items";
import { currency } from "@/lib/format";

export interface ContratosReportConfig {
  secretariasSelecionadas: string[];
  acoesSelecionadas?: string[];
  naturezasSelecionadas?: string[];
  ocultarNatureza?: boolean;
  ocultarAcao?: boolean;
  ocultarVinculo?: boolean;
  incluirObservacao: boolean;
  incluirProcesso: boolean;
  incluirSubelemento: boolean;
  somenteComProcesso: boolean;
}

interface RelatorioContratosModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RawBudgetItem[];
  todasSecretarias: string[];
  onGerarRelatorio: (config: ContratosReportConfig) => void;
}

export function RelatorioContratosModal({
  isOpen,
  onClose,
  items,
  todasSecretarias,
  onGerarRelatorio,
}: RelatorioContratosModalProps) {
  const [selectedSecs, setSelectedSecs] = useState<string[]>([]);
  const [selectedAcoes, setSelectedAcoes] = useState<string[]>([]);
  const [selectedNaturezas, setSelectedNaturezas] = useState<string[]>([]);
  const [buscaAcao, setBuscaAcao] = useState("");
  const [buscaNatureza, setBuscaNatureza] = useState("");
  const [ocultarNatureza, setOcultarNatureza] = useState(false);
  const [ocultarAcao, setOcultarAcao] = useState(false);
  const [ocultarVinculo, setOcultarVinculo] = useState(false);
  const [incluirObservacao, setIncluirObservacao] = useState(true);
  const [incluirProcesso, setIncluirProcesso] = useState(true);
  const [incluirSubelemento, setIncluirSubelemento] = useState(true);
  const [somenteComProcesso, setSomenteComProcesso] = useState(false);

  if (!isOpen) return null;

  // Itens que são contratos
  const isItemContrato = (item: RawBudgetItem) => {
    const ini = String(item.projetoIniciado || item.contrato || "").trim().toUpperCase();
    return ini === "SIM" || ini === "S" || ini === "TRUE" || ini === "1";
  };

  const allContratoItems = items.filter(isItemContrato);

  // Extrair ações e naturezas disponíveis nos contratos (considerando secretaria se houver filtro de secretaria)
  const itensParaOpcoes = selectedSecs.length > 0
    ? allContratoItems.filter((i) => selectedSecs.includes(i.secretaria))
    : allContratoItems;

  const todasAcoes = Array.from(new Set(itensParaOpcoes.map((i) => i.acao).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const todasNaturezas = Array.from(new Set(itensParaOpcoes.map((i) => i.natureza).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  // Filtragem preliminar para contagem
  const previewItems = allContratoItems.filter((i) => {
    if (selectedSecs.length > 0 && !selectedSecs.includes(i.secretaria)) return false;
    if (selectedAcoes.length > 0 && !selectedAcoes.includes(i.acao)) return false;
    if (selectedNaturezas.length > 0 && !selectedNaturezas.includes(i.natureza)) return false;
    if (somenteComProcesso && (!i.processo || i.processo.trim() === "" || i.processo === "—")) return false;
    return true;
  });

  const totalValorContratos = previewItems.reduce((acc, i) => {
    return acc + (i.valLoa || 0) + (i.valorReajuste || 0) + (i.valorAditamento || 0) + (i.valorSugestaoSf || 0) + (i.valorCorteGp || 0);
  }, 0);

  const handleToggleSec = (sec: string) => {
    setSelectedSecs((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  const handleSelectAllSecs = () => {
    setSelectedSecs([]);
  };

  const handleToggleAcao = (acao: string) => {
    setSelectedAcoes((prev) =>
      prev.includes(acao) ? prev.filter((a) => a !== acao) : [...prev, acao]
    );
  };

  const handleSelectAllAcoes = () => {
    setSelectedAcoes([]);
  };

  const handleToggleNatureza = (nat: string) => {
    setSelectedNaturezas((prev) =>
      prev.includes(nat) ? prev.filter((n) => n !== nat) : [...prev, nat]
    );
  };

  const handleSelectAllNaturezas = () => {
    setSelectedNaturezas([]);
  };

  const handleConfirm = () => {
    onGerarRelatorio({
      secretariasSelecionadas: selectedSecs,
      acoesSelecionadas: selectedAcoes.length > 0 ? selectedAcoes : undefined,
      naturezasSelecionadas: selectedNaturezas.length > 0 ? selectedNaturezas : undefined,
      ocultarNatureza,
      ocultarAcao,
      ocultarVinculo,
      incluirObservacao,
      incluirProcesso,
      incluirSubelemento,
      somenteComProcesso,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Relatório Personalizável de Contratos</h2>
              <p className="text-xs text-on-surface-variant">Processos com contrato (SIM) com discriminação de processo e observações</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-on-surface">
          {/* Card Resumo de Itens Encontrados */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Contratos Elegíveis</span>
              <p className="text-lg font-bold text-primary mt-0.5">{previewItems.length} registros</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Valor Total Estimado</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{currency.format(totalValorContratos)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Escopo</span>
              <p className="text-sm font-semibold text-on-surface mt-0.5 truncate">
                {selectedSecs.length === 0 ? "Todas as Secretarias" : `${selectedSecs.length} selecionada(s)`}
              </p>
            </div>
          </div>

          {/* Opções de Conteúdo da Linha */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">tune</span>
              Personalização da Linha de Valores (Descrição)
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Defina quais informações devem compor o detalhamento de cada despesa contratual na folha A4:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={incluirProcesso}
                  onChange={(e) => setIncluirProcesso(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block">Nº do Processo Administrativo</span>
                  <span className="text-[10px] text-on-surface-variant">Exibe &ldquo;Proc: PMS-0123/2024&rdquo;</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={incluirObservacao}
                  onChange={(e) => setIncluirObservacao(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block">Descrição da Observação / Objeto</span>
                  <span className="text-[10px] text-on-surface-variant">Justificativa e objeto do contrato</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={incluirSubelemento}
                  onChange={(e) => setIncluirSubelemento(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block">Nome do Subelemento</span>
                  <span className="text-[10px] text-on-surface-variant">Identificação complementar da despesa</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={somenteComProcesso}
                  onChange={(e) => setSomenteComProcesso(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block">Somente se houver processo</span>
                  <span className="text-[10px] text-on-surface-variant">Oculta contratos sem nº de processo cadastrado</span>
                </div>
              </label>

              {/* Remover / Ocultar Natureza de Despesa */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={ocultarNatureza}
                  onChange={(e) => setOcultarNatureza(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-sm">visibility_off</span>
                    Ocultar código/nome da Natureza
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Oculta código contábil (ex: 3.3.90.39.00)
                  </span>
                </div>
              </label>

              {/* Remover / Ocultar Ação Orçamentária */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={ocultarAcao}
                  onChange={(e) => setOcultarAcao(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-sm">visibility_off</span>
                    Ocultar linha de cabeçalho da Ação
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Oculta a barra de título e agrupamento da Ação
                  </span>
                </div>
              </label>

              {/* Remover / Ocultar Vínculo */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={ocultarVinculo}
                  onChange={(e) => setOcultarVinculo(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-on-surface block flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-sm">visibility_off</span>
                    Ocultar coluna Vínculo
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Remove a coluna de fonte/vínculo do relatório
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Filtro de Secretarias */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">apartment</span>
                Secretarias
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSecs}
                  className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                    selectedSecs.length === 0
                      ? "bg-primary text-white"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                  }`}
                >
                  Todas ({todasSecretarias.length})
                </button>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto border border-outline-variant rounded-xl p-2 space-y-1 bg-surface-container-lowest">
              {todasSecretarias.map((sec) => {
                const count = allContratoItems.filter((i) => i.secretaria === sec).length;
                const isChecked = selectedSecs.includes(sec);
                return (
                  <label
                    key={sec}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                      isChecked ? "bg-primary/10 text-primary font-semibold" : "hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSec(sec)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span className="truncate">{sec}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface-variant">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filtros em 2 Colunas: Ação e Natureza de Despesa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Escolher ou remover Ação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">category</span>
                  Ações Orçamentárias
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllAcoes}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      selectedAcoes.length === 0
                        ? "bg-primary text-white"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                    }`}
                  >
                    Todas ({todasAcoes.length})
                  </button>
                  {selectedAcoes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAcoes([])}
                      className="px-2 py-0.5 rounded text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Limpar seleção"
                    >
                      Limpar ({selectedAcoes.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Busca de Ação */}
              {todasAcoes.length > 5 && (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar ação..."
                    value={buscaAcao}
                    onChange={(e) => setBuscaAcao(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {buscaAcao && (
                    <button
                      type="button"
                      onClick={() => setBuscaAcao("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Lista com Checkboxes de Ação */}
              <div className="max-h-40 overflow-y-auto border border-outline-variant rounded-xl p-2 space-y-1 bg-surface-container-lowest">
                {todasAcoes
                  .filter((acao) => !buscaAcao || acao.toLowerCase().includes(buscaAcao.toLowerCase()))
                  .map((acao) => {
                    const count = itensParaOpcoes.filter((i) => i.acao === acao).length;
                    const isChecked = selectedAcoes.includes(acao);
                    return (
                      <label
                        key={acao}
                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked ? "bg-primary/10 text-primary font-semibold" : "hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAcao(acao)}
                            className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                          />
                          <span className="truncate" title={acao}>
                            {acao}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface-variant shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                {todasAcoes.filter((acao) => !buscaAcao || acao.toLowerCase().includes(buscaAcao.toLowerCase())).length === 0 && (
                  <p className="text-center text-on-surface-variant py-3 text-[11px]">Nenhuma ação encontrada</p>
                )}
              </div>
            </div>

            {/* Escolher ou remover Natureza de Despesa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">payments</span>
                  Naturezas de Despesa
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllNaturezas}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      selectedNaturezas.length === 0
                        ? "bg-primary text-white"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                    }`}
                  >
                    Todas ({todasNaturezas.length})
                  </button>
                  {selectedNaturezas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedNaturezas([])}
                      className="px-2 py-0.5 rounded text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Limpar seleção"
                    >
                      Limpar ({selectedNaturezas.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Busca de Natureza */}
              {todasNaturezas.length > 5 && (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar natureza..."
                    value={buscaNatureza}
                    onChange={(e) => setBuscaNatureza(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {buscaNatureza && (
                    <button
                      type="button"
                      onClick={() => setBuscaNatureza("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Lista com Checkboxes de Natureza */}
              <div className="max-h-40 overflow-y-auto border border-outline-variant rounded-xl p-2 space-y-1 bg-surface-container-lowest">
                {todasNaturezas
                  .filter((nat) => !buscaNatureza || nat.toLowerCase().includes(buscaNatureza.toLowerCase()))
                  .map((nat) => {
                    const count = itensParaOpcoes.filter((i) => i.natureza === nat).length;
                    const isChecked = selectedNaturezas.includes(nat);
                    return (
                      <label
                        key={nat}
                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked ? "bg-primary/10 text-primary font-semibold" : "hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleNatureza(nat)}
                            className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                          />
                          <span className="truncate" title={nat}>
                            {nat}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface-variant shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                {todasNaturezas.filter((nat) => !buscaNatureza || nat.toLowerCase().includes(buscaNatureza.toLowerCase())).length === 0 && (
                  <p className="text-center text-on-surface-variant py-3 text-[11px]">Nenhuma natureza encontrada</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container border-t border-outline-variant flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={previewItems.length === 0}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Gerar Relatório de Contratos</span>
          </button>
        </div>
      </div>
    </div>
  );
}
