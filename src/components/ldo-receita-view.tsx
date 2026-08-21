"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { currency } from "@/lib/format";

interface LdoRegistro {
  id: string;
  exercicio: number;
  numeroLdo: string;
  apelidoOriginal: string;
  apelidoNormalizado: string;
  vinculo: string;
  descricaoVinculo: string;
  valorTotalLdo: number;
  statusDistribuicao: "NAO_INICIADO" | "PARCIALMENTE_DISTRIBUIDO" | "TOTALMENTE_DISTRIBUIDO" | "ACIMA_LDO";
  valorDistribuidoLoa: number;
  saldoDistribuir: number;
  situacaoValidacao: string;
}

interface LdoKpis {
  totalPrevistoLdo: number;
  totalDistribuidoLoa: number;
  saldoNaoDistribuido: number;
  quantidadeVinculos: number;
  quantidadeRegistros: number;
  totalmenteDistribuido: number;
  parcialmenteDistribuido: number;
  naoIniciado: number;
  acimaLdo: number;
}

interface VinculoComparativo {
  vinculo: string;
  descricao: string;
  totalLdo: number;
  totalLoa: number;
}

interface HistoricoItem {
  id: string;
  nomeArquivo: string;
  exercicio: number;
  quantidadeLinhas: number;
  registrosImportados: number;
  valorTotalImportado: number;
  status: string;
  usuarioResponsavel: string;
  iniciadoEm: string;
}

export function LdoReceitaView() {
  const [activeSubTab] = useState<"dashboard" | "analitica" | "importar" | "historico">("dashboard");
  const [exercicio, setExercicio] = useState<number>(new Date().getFullYear() + 1);

  const [registros, setRegistros] = useState<LdoRegistro[]>([]);
  const [kpis, setKpis] = useState<LdoKpis | null>(null);
  const [comparativo, setComparativo] = useState<VinculoComparativo[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  // Filtros
  const [filterApelido, setFilterApelido] = useState("");
  const [filterVinculo, setFilterVinculo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadLdoData = useCallback(async () => {
    try {
      const res = await fetch(`/api/receitas/ldo?exercicio=${exercicio}`);
      if (res.ok) {
        const data = await res.json();
        setRegistros(data.registros || []);
        setKpis(data.kpis || null);
        setComparativo(data.vinculosComparativo || []);
      }
    } catch (err) {
      console.error("Erro ao carregar receitas LDO:", err);
    }
  }, [exercicio]);

  useEffect(() => {
    loadLdoData();
  }, [loadLdoData]);

  const loadHistorico = useCallback(async () => {
    try {
      const res = await fetch(`/api/receitas/ldo/historico?exercicio=${exercicio}`);
      if (res.ok) {
        setHistorico(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  }, [exercicio]);

  useEffect(() => {
    if (activeSubTab === "historico") {
      loadHistorico();
    }
  }, [activeSubTab, loadHistorico]);
  const filteredRegistros = registros.filter((r) => {
    const matchApelido = !filterApelido || r.apelidoOriginal.toLowerCase().includes(filterApelido.toLowerCase());
    const matchVinculo = !filterVinculo || r.vinculo.toLowerCase().includes(filterVinculo.toLowerCase()) || r.descricaoVinculo.toLowerCase().includes(filterVinculo.toLowerCase());
    const matchStatus = !filterStatus || r.statusDistribuicao === filterStatus;
    return matchApelido && matchVinculo && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Banner de Aviso de Importação Centralizada */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-blue-600">info</span>
          <span className="text-xs font-semibold">
            A importação de planilhas foi centralizada no menu <strong>Importações</strong>. Acesse essa área para enviar, validar ou atualizar seus dados.
          </span>
        </div>
        <Link
          href="/importacao"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
        >
          <span>Ir para Importações</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </Link>
      </div>

      {/* Header & Sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Receitas da LDO</h2>
          <p className="text-xs text-on-surface-variant">Previsão orientadora das receitas municipais para o planejamento orçamentário.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold text-on-surface-variant">Exercício:</span>
            <select
              value={exercicio}
              onChange={(e) => setExercicio(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-on-surface outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <a
            href="/api/receitas/ldo/modelo"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Baixar Modelo
          </a>
        </div>
      </div>

      {/* Abas Secundárias da LDO */}
      <div className="flex gap-2 border-b border-outline-variant/20">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeSubTab === "dashboard" ? "border-primary text-primary font-bold" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Visão Geral & KPIs
        </button>
        <button
          onClick={() => setActiveSubTab("analitica")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeSubTab === "analitica" ? "border-primary text-primary font-bold" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Tabela Analítica ({registros.length})
        </button>
        <button
          onClick={() => {
            setActiveSubTab("historico");
            loadHistorico();
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeSubTab === "historico" ? "border-primary text-primary font-bold" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Histórico
        </button>
      </div>

      {/* SUB-TELA 1: DASHBOARD E KPIS */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-outline-variant p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total LDO Previsto</span>
              <p className="text-xl font-bold text-primary mt-1">{currency.format(kpis?.totalPrevistoLdo || 0)}</p>
              <span className="text-xs text-on-surface-variant mt-2 block">{kpis?.quantidadeRegistros || 0} receitas cadastradas</span>
            </div>

            <div className="bg-surface border border-outline-variant p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Distribuído na LOA</span>
              <p className="text-xl font-bold text-secondary mt-1">{currency.format(kpis?.totalDistribuidoLoa || 0)}</p>
              <span className="text-xs text-on-surface-variant mt-2 block">Referência vinculada</span>
            </div>

            <div className="bg-surface border border-outline-variant p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Saldo a Distribuir</span>
              <p className="text-xl font-bold text-amber-600 mt-1">{currency.format(kpis?.saldoNaoDistribuido || 0)}</p>
              <span className="text-xs text-on-surface-variant mt-2 block">Diferença LDO vs LOA</span>
            </div>

            <div className="bg-surface border border-outline-variant p-4 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vínculos Únicos</span>
              <p className="text-xl font-bold text-on-surface mt-1">{kpis?.quantidadeVinculos || 0}</p>
              <span className="text-xs text-on-surface-variant mt-2 block">Fontes de recurso</span>
            </div>
          </div>

          {/* Comparativo LDO vs LOA por Vínculo */}
          <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-base font-bold text-on-surface">Comparativo LDO vs LOA por Vínculo</h3>
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                {comparativo.length} vínculos listados
              </span>
            </div>
            {comparativo.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                Nenhum dado importado para o exercício {exercicio}. Acesse o menu <strong>Importações</strong> para enviar uma planilha.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {comparativo.map((v) => {
                  const maxVal = Math.max(v.totalLdo, v.totalLoa, 1);
                  const pctLdo = (v.totalLdo / maxVal) * 100;
                  const pctLoa = (v.totalLoa / maxVal) * 100;

                  return (
                    <div key={v.vinculo} className="space-y-1.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors border-b border-outline-variant/20">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface">
                          {v.vinculo} — {v.descricao}
                        </span>
                        <span className="text-on-surface-variant">LDO: {currency.format(v.totalLdo)}</span>
                      </div>
                      <div className="h-3 bg-surface-container rounded-full overflow-hidden flex flex-col gap-0.5">
                        <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${pctLdo}%` }} title="Valor LDO"></div>
                        <div className="h-1.5 bg-secondary rounded-full transition-all" style={{ width: `${pctLoa}%` }} title="Valor LOA"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TELA 2: TABELA ANALÍTICA DE RECEITAS LDO */}
      {activeSubTab === "analitica" && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-surface p-4 rounded-xl border border-outline-variant">
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">Filtrar por Apelido (Texto Alfanumérico)</label>
              <input
                type="text"
                placeholder="Ex: 001, 1.9, REC-01..."
                value={filterApelido}
                onChange={(e) => setFilterApelido(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-container border border-outline-variant rounded-lg outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">Filtrar por Vínculo / Descrição</label>
              <input
                type="text"
                placeholder="Ex: 01.110.0000, Tesouro..."
                value={filterVinculo}
                onChange={(e) => setFilterVinculo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-container border border-outline-variant rounded-lg outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">Status de Distribuição LOA</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-container border border-outline-variant rounded-lg outline-none focus:border-primary"
              >
                <option value="">Todos os status</option>
                <option value="NAO_INICIADO">Não iniciado</option>
                <option value="PARCIALMENTE_DISTRIBUIDO">Parcialmente Distribuído</option>
                <option value="TOTALMENTE_DISTRIBUIDO">Totalmente Distribuído</option>
                <option value="ACIMA_LDO">Acima da LDO</option>
              </select>
            </div>
          </div>

          {/* Tabela de Dados */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-outline-variant font-bold text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Apelido (Original)</th>
                    <th className="px-4 py-3">Vínculo</th>
                    <th className="px-4 py-3">Descrição do Vínculo</th>
                    <th className="px-4 py-3 text-right">Previsto LDO</th>
                    <th className="px-4 py-3 text-right">Distribuído LOA</th>
                    <th className="px-4 py-3 text-right">Saldo LDO</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredRegistros.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistros.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-primary">{r.apelidoOriginal}</td>
                        <td className="px-4 py-2.5 font-semibold text-on-surface">{r.vinculo}</td>
                        <td className="px-4 py-2.5 text-on-surface-variant">{r.descricaoVinculo}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-on-surface">{currency.format(r.valorTotalLdo)}</td>
                        <td className="px-4 py-2.5 text-right text-secondary font-semibold">{currency.format(r.valorDistribuidoLoa)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-600 font-semibold">{currency.format(r.saldoDistribuir)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.statusDistribuicao === "TOTALMENTE_DISTRIBUIDO"
                                ? "bg-green-100 text-green-800"
                                : r.statusDistribuicao === "PARCIALMENTE_DISTRIBUIDO"
                                ? "bg-blue-100 text-blue-800"
                                : r.statusDistribuicao === "ACIMA_LDO"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {r.statusDistribuicao.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* SUB-TELA 4: HISTÓRICO DE IMPORTAÇÕES */}
      {activeSubTab === "historico" && (
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container border-b border-outline-variant font-bold text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Exercício</th>
                <th className="px-4 py-3 text-center">Registros</th>
                <th className="px-4 py-3 text-right">Valor Total Importado</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {historico.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                    Nenhum histórico registrado para este exercício.
                  </td>
                </tr>
              ) : (
                historico.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-on-surface">{new Date(h.iniciadoEm).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5 font-semibold text-primary">{h.nomeArquivo}</td>
                    <td className="px-4 py-2.5 text-on-surface">{h.exercicio}</td>
                    <td className="px-4 py-2.5 text-center text-on-surface">{h.registrosImportados}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-on-surface">{currency.format(h.valorTotalImportado)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">{h.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
