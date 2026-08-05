"use client";

import React, { useEffect, useState } from "react";
import { currency, integer } from "@/lib/format";

type FiltrosAnaliticos = {
  exercicioInicial?: number;
  exercicioFinal?: number;
  receita?: string;
  naturezaReceita?: string;
  unidadeOrcamentaria?: string;
  codigoFundo?: string;
  vinculo?: string;
  pesquisa?: string;
  dataInicial?: string;
  dataFinal?: string;
};

interface ReceitaArrecadadaItem {
  id: number;
  dataMovimento: string;
  exercicio: number;
  receita: string;
  naturezaReceita: string;
  descricaoReceita: string;
  unidadeOrcamentaria: string;
  codigoFundo: string;
  vinculo: string;
  valor: number;
}

interface ApiResponse {
  dados: ReceitaArrecadadaItem[];
  total: number;
  totalPages: number;
}

export function ReceitaArrecadadaAnaliticaView() {
  const [dados, setDados] = useState<ReceitaArrecadadaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosAnaliticos>({});

  const limit = 50;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
          }
        });

        const response = await fetch(`/api/receitas/arrecadada?${params.toString()}`);
        const result = (await response.json()) as ApiResponse;
        
        if (response.ok) {
          setDados(result.dados || []);
          setTotal(result.total || 0);
          setTotalPages(result.totalPages || 1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [page, filtros]);

  function handleFilterChange(key: keyof FiltrosAnaliticos, value: string) {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function exportCSV() {
    if (!dados.length) return;
    const headers = ["Data", "Exercício", "Receita", "Natureza", "Descrição", "Unidade", "Fundo", "Vínculo", "Valor"];
    const rows = dados.map(item => [
      item.dataMovimento ? item.dataMovimento.split('T')[0] : "",
      item.exercicio,
      item.receita || "",
      item.naturezaReceita || "",
      (item.descricaoReceita || "").replace(/;/g, ","),
      item.unidadeOrcamentaria || "",
      item.codigoFundo || "",
      item.vinculo || "",
      item.valor
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "receita-arrecadada.csv";
    link.click();
  }

  function exportExcel() {
    if (!dados.length) return;
    const headers = ["Data", "Exercício", "Receita", "Natureza", "Descrição", "Unidade", "Fundo", "Vínculo", "Valor"];
    const rows = dados.map(item => [
      item.dataMovimento ? item.dataMovimento.split('T')[0] : "",
      item.exercicio,
      item.receita || "",
      item.naturezaReceita || "",
      item.descricaoReceita || "",
      item.unidadeOrcamentaria || "",
      item.codigoFundo || "",
      item.vinculo || "",
      item.valor
    ]);
    
    const csv = [headers, ...rows].map(row => row.join("\t")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "receita-arrecadada.xls";
    link.click();
  }

  const valorTotal = dados.reduce((sum, item) => sum + (item.valor || 0), 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface border border-outline-variant p-6 rounded-xl">
        <h3 className="text-sm font-bold text-on-surface mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Exercício</label>
            <input
              type="number"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              placeholder="2024"
              onChange={(e) => {
                const v = e.target.value;
                handleFilterChange("exercicioInicial", v);
                if (v) handleFilterChange("exercicioFinal", v);
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Receita</label>
            <input
              type="text"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              placeholder="Ex: IPTU"
              onChange={(e) => handleFilterChange("receita", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Natureza Receita</label>
            <input
              type="text"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              placeholder="Ex: 1.1.1.1.01"
              onChange={(e) => handleFilterChange("naturezaReceita", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Vínculo</label>
            <input
              type="text"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              placeholder="Ex: 01.110.0000"
              onChange={(e) => handleFilterChange("vinculo", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Unidade Orçamentária</label>
            <input
              type="text"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              placeholder="Ex: 02.001"
              onChange={(e) => handleFilterChange("unidadeOrcamentaria", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Código do Fundo</label>
            <input
              type="text"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              placeholder="Ex: 001"
              onChange={(e) => handleFilterChange("codigoFundo", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Data Inicial</label>
            <input
              type="date"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              onChange={(e) => handleFilterChange("dataInicial", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Data Final</label>
            <input
              type="date"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
              onChange={(e) => handleFilterChange("dataFinal", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Busca</label>
          <input
            type="text"
            className="w-full md:w-96 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
            placeholder="Buscar por descrição..."
            onChange={(e) => handleFilterChange("pesquisa", e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-on-surface-variant">
          {loading ? "Carregando..." : `${integer.format(total)} registros encontrados`} | 
          <span className="font-bold text-on-surface ml-1">{currency.format(valorTotal)}</span> valor total filtrado
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant"
          >
            Exportar CSV
          </button>
          <button
            onClick={exportExcel}
            className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Data Movimento</th>
              <th className="px-4 py-3">Exercício</th>
              <th className="px-4 py-3">Receita</th>
              <th className="px-4 py-3">Natureza</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Unidade</th>
              <th className="px-4 py-3">Fundo</th>
              <th className="px-4 py-3">Vínculo</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-on-surface">
            {dados.map((item, index) => (
              <tr key={`${item.id}-${index}`} className="hover:bg-surface-container-low/30">
                <td className="px-4 py-3">{item.dataMovimento ? item.dataMovimento.split('T')[0] : "—"}</td>
                <td className="px-4 py-3">{item.exercicio}</td>
                <td className="px-4 py-3 font-mono">{item.receita || "—"}</td>
                <td className="px-4 py-3 font-mono">{item.naturezaReceita || "—"}</td>
                <td className="px-4 py-3 max-w-[200px] truncate" title={item.descricaoReceita}>{item.descricaoReceita || "—"}</td>
                <td className="px-4 py-3 font-mono">{item.unidadeOrcamentaria || "—"}</td>
                <td className="px-4 py-3 font-mono">{item.codigoFundo || "—"}</td>
                <td className="px-4 py-3 font-mono">{item.vinculo || "—"}</td>
                <td className="px-4 py-3 text-right font-bold font-mono">{currency.format(item.valor)}</td>
              </tr>
            ))}
            {dados.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-on-surface-variant">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-on-surface-variant">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
