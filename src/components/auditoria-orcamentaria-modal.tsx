"use client";

import { useEffect, useState, useCallback } from "react";
import { SECRETARIAS_NOMES } from "@/lib/secretarias-catalogo";

interface AlteracaoItem {
  id: string;
  dotacaoId: string | null;
  exercicio: number;
  secretaria: string;
  codigoSecretaria: string | null;
  programa: string | null;
  acao: string | null;
  natureza: string | null;
  subelemento: string | null;
  processo: string | null;
  apelido: string | null;
  valorAnterior: number;
  valorNovo: number;
  diferenca: number;
  justificativa: string;
  tipoAlteracao: string;
  status: string;
  nomeOperador: string;
  emailOperador: string | null;
  criadoEm: string;
}

interface ExclusaoItem {
  id: string;
  dotacaoId: string;
  exercicio: number;
  secretaria: string;
  programa: string | null;
  acao: string | null;
  natureza: string | null;
  subelemento: string | null;
  processo: string | null;
  valorOriginal: number;
  motivoExclusao: string;
  restaurado: boolean;
  nomeOperador: string;
  criadoEm: string;
}

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretariaAtiva?: string;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

export function AuditoriaOrcamentariaModal({ isOpen, onClose, secretariaAtiva }: AuditModalProps) {
  const [activeTab, setActiveTab] = useState<"alteracoes" | "exclusoes">("alteracoes");
  const [secretariaFiltro, setSecretariaFiltro] = useState(secretariaAtiva || "");
  const [alteracoes, setAlteracoes] = useState<AlteracaoItem[]>([]);
  const [exclusoes, setExclusoes] = useState<ExclusaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carregarAuditoria = useCallback(async () => {
    try {
      setLoading(true);
      const url = secretariaFiltro
        ? `/api/orcamento/alteracoes?secretaria=${encodeURIComponent(secretariaFiltro)}`
        : "/api/orcamento/alteracoes";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlteracoes(data.alteracoes || []);
        setExclusoes(data.exclusoes || []);
      }
    } catch (err) {
      console.error("Erro ao carregar auditoria:", err);
    } finally {
      setLoading(false);
    }
  }, [secretariaFiltro]);

  useEffect(() => {
    if (isOpen) {
      carregarAuditoria();
    }
  }, [isOpen, carregarAuditoria]);

  if (!isOpen) return null;

  const alteracoesFiltradas = alteracoes.filter((a) => {
    const termo = busca.toLowerCase();
    return (
      (a.secretaria || "").toLowerCase().includes(termo) ||
      (a.subelemento || "").toLowerCase().includes(termo) ||
      (a.justificativa || "").toLowerCase().includes(termo) ||
      (a.nomeOperador || "").toLowerCase().includes(termo) ||
      (a.acao || "").toLowerCase().includes(termo) ||
      (a.processo || "").toLowerCase().includes(termo)
    );
  });

  const exclusoesFiltradas = exclusoes.filter((e) => {
    const termo = busca.toLowerCase();
    return (
      (e.secretaria || "").toLowerCase().includes(termo) ||
      (e.subelemento || "").toLowerCase().includes(termo) ||
      (e.motivoExclusao || "").toLowerCase().includes(termo) ||
      (e.nomeOperador || "").toLowerCase().includes(termo) ||
      (e.acao || "").toLowerCase().includes(termo)
    );
  });

  const totalSuplementacoes = alteracoes.filter((a) => a.diferenca > 0).reduce((acc, a) => acc + a.diferenca, 0);
  const totalReducoes = alteracoes.filter((a) => a.diferenca < 0).reduce((acc, a) => acc + Math.abs(a.diferenca), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">history_edu</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">Auditoria Orçamentária & Rastreabilidade</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  PostgreSQL Ativo
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Histórico institucional de alterações de valor, justificativas e exclusões de dotações.
              </p>
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

        {/* Resumo Rápido de Métricas de Auditoria */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container-low border-b border-outline-variant/50">
          <div className="bg-surface p-3 rounded-xl border border-outline-variant/60">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Total Alterações</span>
            <p className="text-lg font-bold text-primary">{alteracoes.length}</p>
          </div>
          <div className="bg-surface p-3 rounded-xl border border-outline-variant/60">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Suplementações (+)</span>
            <p className="text-lg font-bold text-emerald-700">+{currency.format(totalSuplementacoes)}</p>
          </div>
          <div className="bg-surface p-3 rounded-xl border border-outline-variant/60">
            <span className="text-[10px] uppercase font-bold text-rose-700">Reduções (-)</span>
            <p className="text-lg font-bold text-rose-700">-{currency.format(totalReducoes)}</p>
          </div>
          <div className="bg-surface p-3 rounded-xl border border-outline-variant/60">
            <span className="text-[10px] uppercase font-bold text-amber-700">Dotações Excluídas</span>
            <p className="text-lg font-bold text-amber-700">{exclusoes.length}</p>
          </div>
        </div>

        {/* Barra de Filtros & Abas */}
        <div className="p-4 border-b border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant">
            <button
              type="button"
              onClick={() => setActiveTab("alteracoes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "alteracoes"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Ajustes de Valor ({alteracoesFiltradas.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exclusoes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "exclusoes"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Exclusões ({exclusoesFiltradas.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-on-surface-variant">search</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por operador, subelemento, justificativa..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:border-primary"
              />
            </div>
            <select
              value={secretariaFiltro}
              onChange={(e) => setSecretariaFiltro(e.target.value)}
              className="text-xs rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-on-surface outline-none focus:border-primary cursor-pointer max-w-[180px]"
            >
              <option value="">Todas Secretarias</option>
              {Object.entries(SECRETARIAS_NOMES).map(([cod, nomeSec]) => (
                <option key={cod} value={cod}>
                  {cod} - {nomeSec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo da Tabela com Scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">
              Carregando registros de auditoria...
            </div>
          ) : activeTab === "alteracoes" ? (
            alteracoesFiltradas.length === 0 ? (
              <div className="py-16 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
                Nenhum registro de alteração de valor encontrado.
              </div>
            ) : (
              <div className="border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container font-bold text-on-surface-variant border-b border-outline-variant">
                    <tr>
                      <th className="px-3 py-2.5">Data / Hora</th>
                      <th className="px-3 py-2.5">Operador</th>
                      <th className="px-3 py-2.5">Secretaria & Ação</th>
                      <th className="px-3 py-2.5">Subelemento</th>
                      <th className="px-3 py-2.5 text-right">Valor Anterior</th>
                      <th className="px-3 py-2.5 text-right">Novo Valor</th>
                      <th className="px-3 py-2.5 text-right">Diferença</th>
                      <th className="px-3 py-2.5">Justificativa Institucional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {alteracoesFiltradas.map((a) => {
                      const isUp = a.diferenca > 0;
                      const isDown = a.diferenca < 0;
                      return (
                        <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                            {dateFormat.format(new Date(a.criadoEm))}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-on-surface">{a.nomeOperador}</div>
                            {a.emailOperador && (
                              <div className="text-[10px] text-on-surface-variant font-mono">{a.emailOperador}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 max-w-[200px]">
                            <div className="font-semibold text-on-surface truncate">{a.secretaria}</div>
                            {a.acao && <div className="text-[10px] text-on-surface-variant truncate">{a.acao}</div>}
                          </td>
                          <td className="px-3 py-2 max-w-[180px]">
                            <div className="font-medium text-on-surface truncate">{a.subelemento || "—"}</div>
                            {a.natureza && <div className="text-[10px] text-on-surface-variant font-mono">{a.natureza}</div>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-on-surface-variant">
                            {currency.format(a.valorAnterior)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-on-surface">
                            {currency.format(a.valorNovo)}
                          </td>
                          <td className={`px-3 py-2 text-right font-mono font-extrabold ${isUp ? "text-emerald-600" : isDown ? "text-rose-600" : "text-gray-600"}`}>
                            {isUp ? "+" : ""}{currency.format(a.diferenca)}
                          </td>
                          <td className="px-3 py-2 max-w-[260px]">
                            <div className="bg-surface-container-low p-1.5 rounded-md border border-outline-variant/40 text-[11px] text-on-surface">
                              {a.justificativa}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            exclusoesFiltradas.length === 0 ? (
              <div className="py-16 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
                Nenhum registro de dotação excluída encontrado.
              </div>
            ) : (
              <div className="border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container font-bold text-on-surface-variant border-b border-outline-variant">
                    <tr>
                      <th className="px-3 py-2.5">Data / Hora</th>
                      <th className="px-3 py-2.5">Operador</th>
                      <th className="px-3 py-2.5">Secretaria & Ação</th>
                      <th className="px-3 py-2.5">Subelemento Excluído</th>
                      <th className="px-3 py-2.5 text-right">Valor Original</th>
                      <th className="px-3 py-2.5">Motivo da Exclusão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {exclusoesFiltradas.map((e) => (
                      <tr key={e.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-3 py-2 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                          {dateFormat.format(new Date(e.criadoEm))}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-on-surface">{e.nomeOperador}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-on-surface">{e.secretaria}</div>
                          {e.acao && <div className="text-[10px] text-on-surface-variant">{e.acao}</div>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-rose-700 line-through">{e.subelemento || "—"}</div>
                          {e.natureza && <div className="text-[10px] text-on-surface-variant font-mono">{e.natureza}</div>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-on-surface">
                          {currency.format(e.valorOriginal)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="bg-rose-50/50 p-1.5 rounded-md border border-rose-200/50 text-[11px] text-on-surface">
                            {e.motivoExclusao}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">
            Exibindo registros auditados do exercício <strong className="text-on-surface">2027</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-xs bg-surface border border-outline-variant hover:bg-surface-container-high rounded-lg text-on-surface transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
