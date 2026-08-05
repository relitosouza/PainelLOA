"use client";

import { useEffect, useMemo, useState } from "react";
import { currency, integer, percent } from "@/lib/format";
import * as XLSX from "xlsx";

// --- Tipos de Filtro ---
export interface TechnicalFilterState {
  secretaria: string[];
  orgao: string[];
  unidade: string[];
  programa: string[];
  acao: string[];
  natureza: string[];
  fonteVinculo: string[];
  categoriaEconomica: string[];
  grupoNatureza: string[];
  elemento: string[];
  subelemento: string[];
  processo: string[];
  exercicio: string[];
  search: string;
}

const INITIAL_FILTERS: TechnicalFilterState = {
  secretaria: [],
  orgao: [],
  unidade: [],
  programa: [],
  acao: [],
  natureza: [],
  fonteVinculo: [],
  categoriaEconomica: [],
  grupoNatureza: [],
  elemento: [],
  subelement: [],
  processo: [],
  exercicio: [],
  search: "",
};

export interface RawBudgetItem {
  id: string;
  progKey: string;
  secretaria: string;
  orgao: string;
  unidade: string;
  programa: string;
  acao: string;
  natureza: string;
  fonteVinculo: string;
  categoriaEconomica: string;
  grupoNatureza: string;
  elemento: string;
  subelemento: string;
  processo: string;
  valLdo: number;
  valLoa: number;
}

interface TreeNode {
  id: string;
  name: string;
  level: "secretaria" | "programa" | "acao" | "natureza" | "elemento" | "subelemento" | "processo";
  valLdo: number;
  valLoa: number;
  diff: number;
  children?: TreeNode[];
}

export function AnaliseLoaView() {
  const [loading, setLoading] = useState(true);
  const [rawItems, setRawItems] = useState<RawBudgetItem[]>([]);
  const [ldoReceitaTotal, setLdoReceitaTotal] = useState<number>(0);
  const [filters, setFilters] = useState<TechnicalFilterState>(INITIAL_FILTERS);

  // Estados da Tree View e Tabela
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItemForInsights, setSelectedItemForInsights] = useState<string | null>(null);

  // Estado para controlar a célula em foco de edição (id + campo: 'valLdo' | 'valLoa')
  const [editingCell, setEditingCell] = useState<{ id: string; field: "valLdo" | "valLoa" } | null>(null);
  const [tempInputValue, setTempInputValue] = useState<string>("");

  const numberFormatter = useMemo(() => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), []);

  const formatBr = (num: number) => numberFormatter.format(num);

  const parseBr = (text: string) => {
    if (!text) return 0;
    const cleanStr = text.replace(/\./g, "").replace(",", ".");
    const val = parseFloat(cleanStr);
    return Number.isFinite(val) ? val : 0;
  };

  // Carregar dados de ambos os cenários e consolidar
  useEffect(() => {
    async function loadTechnicalData() {
      try {
        setLoading(true);
        // Ler planilha pública consolidada
        const res = await fetch("/ConsolidadoLoa27_ATIVIDADES.xlsx");
        if (!res.ok) throw new Error("Planilha não encontrada");
        const buffer = await res.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

        const loaMap = new Map<string, RawBudgetItem>();

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          const peca = String(r[18] || "").trim();
          const progKey = String(r[7] || "").trim().replace(/^\.+/, "");
          const organStr = String(r[8] || "").trim().replace(/^\.+/, "");
          const unitStr = String(r[9] || "").trim().replace(/^\.+/, "");
          const funcStr = String(r[10] || "").trim().replace(/^\.+/, "");
          const subfuncStr = String(r[11] || "").trim().replace(/^\.+/, "");
          const programStr = String(r[12] || "").trim().replace(/^\.+/, "");
          const actionStr = String(r[13] || "").trim().replace(/^\.+/, "");
          const natureStr = String(r[14] || "").trim().replace(/^\.+/, "");
          const subelemStr = String(r[15] || "").trim().replace(/^\.+/, "");
          const processStr = String(r[16] || "").trim().replace(/^\.+/, "");
          const valor = Number(r[17]) || 0;

          // Extração de Categoria, Grupo e Elemento a partir do código de Natureza (ex: 3.3.90.39.00)
          const natClean = natureStr.split("-")[0].trim();
          const parts = natClean.split(".");
          const catEcon = parts[0] ? `${parts[0]} — Despesa` : "Outras";
          const grpNat = parts[1] ? `${parts[0]}.${parts[1]} — Grupo` : "Outros";
          const elem = parts[2] ? `${parts[0]}.${parts[1]}.${parts[2]}` : "Outros";
          const vinculo = parts[3] ? `${parts[2]}.${parts[3]}` : "Tesouro / Próprio";

          // Agrupamento por Secretaria (Órgão), Ação, Natureza da Despesa e Processo
          const groupKey = `${organStr}|${actionStr}|${natureStr}|${processStr}`;

          if (!loaMap.has(groupKey)) {
            loaMap.set(groupKey, {
              id: groupKey,
              progKey: progKey || groupKey,
              secretaria: organStr,
              orgao: organStr,
              unidade: unitStr,
              programa: programStr,
              acao: actionStr,
              natureza: natureStr,
              fonteVinculo: vinculo,
              categoriaEconomica: catEcon,
              grupoNatureza: grpNat,
              elemento: elem,
              subelemento: subelemStr,
              processo: processStr || "—",
              valLdo: 0,
              valLoa: 0,
            });
          }

          const item = loaMap.get(groupKey)!;
          if (peca === "LDO") item.valLdo += valor;
          else if (peca === "LOA") item.valLoa += valor;
        }

        setRawItems([...loaMap.values()]);

        // Carregar Receita LDO real do banco de dados (tabela LdoReceita)
        try {
          const apiRes = await fetch("/api/analises-combinadas");
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData?.totais?.totalReceitaLdo) {
              setLdoReceitaTotal(Number(apiData.totais.totalReceitaLdo) || 0);
            }
          }
        } catch (apiErr) {
          console.warn("Não foi possível carregar o total da LdoReceita via API:", apiErr);
        }
      } catch (err) {
        console.error("Erro ao carregar dados técnicos da LOA/LDO:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTechnicalData();
  }, []);

  // Extrair opções únicas cascading para os Chips de Filtro (dependente dos filtros atuais)
  const filterOptions = useMemo(() => {
    const getOptions = (key: keyof RawBudgetItem, currentFilterItems: RawBudgetItem[]) =>
      Array.from(new Set(currentFilterItems.map((item) => String(item[key])).filter(Boolean))).sort();

    // Helper para obter os itens filtrados desconsiderando o filtro do próprio campo
    const getItemsForField = (fieldToIgnore: keyof TechnicalFilterState) => {
      return rawItems.filter((item) => {
        const match = (fieldValues: string[] | undefined, itemValue: string) =>
          !fieldValues || !fieldValues.length || fieldValues.includes(itemValue);

        if (fieldToIgnore !== "secretaria" && !match(filters.secretaria, item.secretaria)) return false;
        if (fieldToIgnore !== "orgao" && !match(filters.orgao, item.orgao)) return false;
        if (fieldToIgnore !== "unidade" && !match(filters.unidade, item.unidade)) return false;
        if (fieldToIgnore !== "programa" && !match(filters.programa, item.programa)) return false;
        if (fieldToIgnore !== "acao" && !match(filters.acao, item.acao)) return false;
        if (fieldToIgnore !== "natureza" && !match(filters.natureza, item.natureza)) return false;
        if (fieldToIgnore !== "fonteVinculo" && !match(filters.fonteVinculo, item.fonteVinculo)) return false;
        if (fieldToIgnore !== "categoriaEconomica" && !match(filters.categoriaEconomica, item.categoriaEconomica)) return false;
        if (fieldToIgnore !== "grupoNatureza" && !match(filters.grupoNatureza, item.grupoNatureza)) return false;
        if (fieldToIgnore !== "elemento" && !match(filters.elemento, item.elemento)) return false;
        if (fieldToIgnore !== "subelemento" && !match(filters.subelemento, item.subelemento)) return false;
        if (fieldToIgnore !== "processo" && !match(filters.processo, item.processo)) return false;

        return true;
      });
    };

    return {
      secretaria: getOptions("secretaria", getItemsForField("secretaria")),
      orgao: getOptions("orgao", getItemsForField("orgao")),
      unidade: getOptions("unidade", getItemsForField("unidade")),
      programa: getOptions("programa", getItemsForField("programa")),
      acao: getOptions("acao", getItemsForField("acao")),
      natureza: getOptions("natureza", getItemsForField("natureza")),
      fonteVinculo: getOptions("fonteVinculo", getItemsForField("fonteVinculo")),
      categoriaEconomica: getOptions("categoriaEconomica", getItemsForField("categoriaEconomica")),
      grupoNatureza: getOptions("grupoNatureza", getItemsForField("grupoNatureza")),
      elemento: getOptions("elemento", getItemsForField("elemento")),
      subelemento: getOptions("subelemento", getItemsForField("subelemento")),
      processo: getOptions("processo", getItemsForField("processo")),
      exercicio: ["2027", "2026"],
    };
  }, [rawItems, filters]);

  // Aplicação Dinâmica dos Filtros
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const match = (fieldValues: string[] | undefined, itemValue: string) =>
        !fieldValues || !fieldValues.length || fieldValues.includes(itemValue);

      if (!match(filters.secretaria, item.secretaria)) return false;
      if (!match(filters.orgao, item.orgao)) return false;
      if (!match(filters.unidade, item.unidade)) return false;
      if (!match(filters.programa, item.programa)) return false;
      if (!match(filters.acao, item.acao)) return false;
      if (!match(filters.natureza, item.natureza)) return false;
      if (!match(filters.fonteVinculo, item.fonteVinculo)) return false;
      if (!match(filters.categoriaEconomica, item.categoriaEconomica)) return false;
      if (!match(filters.grupoNatureza, item.grupoNatureza)) return false;
      if (!match(filters.elemento, item.elemento)) return false;
      if (!match(filters.subelemento, item.subelemento)) return false;
      if (!match(filters.processo, item.processo)) return false;

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const fullText = `${item.secretaria} ${item.programa} ${item.acao} ${item.natureza} ${item.subelemento} ${item.processo}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      return true;
    });
  }, [rawItems, filters]);

  // Métricas Recalculadas Instantaneamente para os Cards Superiores
  const metrics = useMemo(() => {
    let valLdoTotal = 0;
    let valLoaTotal = 0;
    const acoesSet = new Set<string>();
    const naturezasSet = new Set<string>();

    filteredItems.forEach((item) => {
      valLdoTotal += item.valLdo;
      valLoaTotal += item.valLoa;
      if (item.acao) acoesSet.add(item.acao);
      if (item.natureza) naturezasSet.add(item.natureza);
    });

    const diff = valLoaTotal - valLdoTotal;
    const percentExec = valLdoTotal > 0 ? (valLoaTotal / valLdoTotal) * 100 : 100;

    return {
      valLdoTotal,
      valLoaTotal,
      diff,
      percentExec,
      totalAcoes: acoesSet.size,
      totalNaturezas: naturezasSet.size,
    };
  }, [filteredItems]);

  // Métricas para Painel Lateral de Insights Inteligentes
  const insights = useMemo(() => {
    let maiorAumento = { item: "", val: 0 };
    let maiorReducao = { item: "", val: 0 };
    const progMap = new Map<string, number>();
    const secMap = new Map<string, number>();
    let novasDotacoes = 0;
    let dotacoesRemovidas = 0;
    let suplementado = 0;
    let reduzido = 0;

    filteredItems.forEach((item) => {
      const diff = item.valLoa - item.valLdo;
      if (diff > maiorAumento.val) {
        maiorAumento = { item: `${item.acao} — ${item.subelemento || item.natureza}`, val: diff };
      }
      if (diff < maiorReducao.val) {
        maiorReducao = { item: `${item.acao} — ${item.subelemento || item.natureza}`, val: diff };
      }

      if (item.valLdo === 0 && item.valLoa > 0) novasDotacoes++;
      if (item.valLdo > 0 && item.valLoa === 0) dotacoesRemovidas++;

      if (diff > 0) suplementado += diff;
      if (diff < 0) reduzido += Math.abs(diff);

      progMap.set(item.programa, (progMap.get(item.programa) || 0) + item.valLoa);
      secMap.set(item.secretaria, (secMap.get(item.secretaria) || 0) + item.valLoa);
    });

    const sortedProg = [...progMap.entries()].sort((a, b) => b[1] - a[1]);
    const sortedSec = [...secMap.entries()].sort((a, b) => b[1] - a[1]);

    const aderencia = metrics.valLdoTotal > 0 ? Math.min(100, Math.max(0, (1 - Math.abs(metrics.diff) / metrics.valLdoTotal) * 100)) : 100;

    return {
      maiorAumento,
      maiorReducao,
      programaMaisImpactado: sortedProg[0]?.[0] || "Nenhum",
      secretariaMaiorOrcamento: sortedSec[0]?.[0] || "Nenhuma",
      novasDotacoes,
      dotacoesRemovidas,
      aderencia,
      suplementado,
      reduzido,
    };
  }, [filteredItems, metrics]);

  // Construção do Pivot Tree View (Árvore Hierárquica Esquerda)
  const pivotTree = useMemo(() => {
    const rootNodes: TreeNode[] = [];
    const secMap = new Map<string, TreeNode>();

    filteredItems.forEach((item) => {
      const secKey = item.secretaria || "Sem Secretaria";
      if (!secMap.has(secKey)) {
        const node: TreeNode = {
          id: `sec-${secKey}`,
          name: secKey,
          level: "secretaria",
          valLdo: 0,
          valLoa: 0,
          diff: 0,
          children: [],
        };
        secMap.set(secKey, node);
        rootNodes.push(node);
      }

      const secNode = secMap.get(secKey)!;
      secNode.valLdo += item.valLdo;
      secNode.valLoa += item.valLoa;
      secNode.diff = secNode.valLoa - secNode.valLdo;

      // Nível 2: Programa
      let progNode = secNode.children!.find((c) => c.name === item.programa);
      if (!progNode) {
        progNode = {
          id: `prog-${secKey}-${item.programa}`,
          name: item.programa || "Sem Programa",
          level: "programa",
          valLdo: 0,
          valLoa: 0,
          diff: 0,
          children: [],
        };
        secNode.children!.push(progNode);
      }
      progNode.valLdo += item.valLdo;
      progNode.valLoa += item.valLoa;
      progNode.diff = progNode.valLoa - progNode.valLdo;

      // Nível 3: Ação
      let acaoNode = progNode.children!.find((c) => c.name === item.acao);
      if (!acaoNode) {
        acaoNode = {
          id: `acao-${secKey}-${item.programa}-${item.acao}`,
          name: item.acao || "Sem Ação",
          level: "acao",
          valLdo: 0,
          valLoa: 0,
          diff: 0,
          children: [],
        };
        progNode.children!.push(acaoNode);
      }
      acaoNode.valLdo += item.valLdo;
      acaoNode.valLoa += item.valLoa;
      acaoNode.diff = acaoNode.valLoa - acaoNode.valLdo;

      // Nível 4: Natureza
      let natNode = acaoNode.children!.find((c) => c.name === item.natureza);
      if (!natNode) {
        natNode = {
          id: `nat-${secKey}-${item.programa}-${item.acao}-${item.natureza}`,
          name: item.natureza || "Sem Natureza",
          level: "natureza",
          valLdo: 0,
          valLoa: 0,
          diff: 0,
        };
        acaoNode.children!.push(natNode);
      }
      natNode.valLdo += item.valLdo;
      natNode.valLoa += item.valLoa;
      natNode.diff = natNode.valLoa - natNode.valLdo;
    });

    return rootNodes.sort((a, b) => b.valLoa - a.valLoa);
  }, [filteredItems]);

  // Função para determinar o status e badge de cada linha
  const getStatusInfo = (valLdo: number, valLoa: number) => {
    if (valLdo === 0 && valLoa > 0) return { label: "Nova Dotação", class: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    if (valLdo > 0 && valLoa === 0) return { label: "Removida", class: "bg-rose-100 text-rose-800 border-rose-300" };
    if (valLoa > valLdo) return { label: "Suplementada", class: "bg-blue-100 text-blue-800 border-blue-300" };
    if (valLoa < valLdo) return { label: "Reduzida", class: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Sem alteração", class: "bg-surface-container text-on-surface-variant border-outline-variant" };
  };

  // Funções de exportação
  const exportToExcel = () => {
    const exportData = filteredItems.map((item) => ({
      Secretaria: item.secretaria,
      Programa: item.programa,
      Ação: item.acao,
      Natureza: item.natureza,
      "Subelemento / Descrição": item.subelemento,
      Vínculo: item.fonteVinculo,
      "Valor LDO (R$)": item.valLdo,
      "Valor LOA (R$)": item.valLoa,
      "Diferença (R$)": item.valLoa - item.valLdo,
      "Variação (%)": item.valLdo > 0 ? ((item.valLoa - item.valLdo) / item.valLdo) * 100 : 0,
      Status: getStatusInfo(item.valLdo, item.valLoa).label,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analise_LDO_LOA");
    XLSX.writeFile(workbook, "analise-tecnica-ldo-loa.xlsx");
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Relatório Técnico de Análise LDO vs LOA 2027", 14, 15);
    const tableData = filteredItems.slice(0, 100).map((item) => [
      item.acao.slice(0, 20),
      item.natureza.slice(0, 20),
      (item.subelemento || item.secretaria).slice(0, 25),
      currency.format(item.valLdo),
      currency.format(item.valLoa),
      currency.format(item.valLoa - item.valLdo),
      getStatusInfo(item.valLdo, item.valLoa).label,
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["Ação", "Natureza", "Descrição", "Valor LDO", "Valor LOA", "Diferença", "Status"]],
      body: tableData,
    });
    doc.save("analise-tecnica-ldo-loa.pdf");
  };

  // Alternar nó expansível da árvore
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const expandAllNodes = () => {
    const all = new Set<string>();
    const collect = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        all.add(n.id);
        if (n.children) collect(n.children);
      });
    };
    collect(pivotTree);
    setExpandedNodes(all);
  };

  const collapseAllNodes = () => setExpandedNodes(new Set());

  // Renderização da Tree View Recursiva
  const renderTreeNodes = (nodes: TreeNode[]) => {
    return nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const diffTone = node.diff > 0 ? "text-emerald-600" : node.diff < 0 ? "text-rose-600" : "text-gray-400";

      return (
        <div key={node.id} className="text-xs">
          <div
            onClick={() => hasChildren && toggleNode(node.id)}
            className={`flex items-center justify-between p-2 rounded-lg hover:bg-surface-container/60 cursor-pointer transition-colors ${
              isExpanded ? "bg-surface-container/40 font-bold" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {hasChildren ? (
                <span className="material-symbols-outlined text-sm text-primary transition-transform">
                  {isExpanded ? "expand_more" : "chevron_right"}
                </span>
              ) : (
                <span className="w-4 h-4 inline-block" />
              )}
              <span className="truncate text-on-surface" title={node.name}>
                {node.name}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-right font-mono">
              <span className="text-on-surface-variant">{currency.format(node.valLoa)}</span>
              <span className={`font-semibold ${diffTone}`}>{node.diff > 0 ? `+${currency.format(node.diff)}` : currency.format(node.diff)}</span>
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div className="pl-4 border-l border-outline-variant/40 ml-3 my-1 space-y-0.5">
              {renderTreeNodes(node.children!)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Subtítulo e Breadcrumb */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
            <span>Planejamento Orçamentário</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Análise Técnica LDO x LOA</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            Análise da LOA
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Compare em tempo real os valores da LDO e LOA identificando diferenças, suplementações, reduções e distribuição orçamentária.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-surface border border-outline-variant text-primary hover:bg-surface-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Insights Inteligentes
          </button>
        </div>
      </header>

      {/* 2. Camadas de Cards Superiores (Camada 1: Receita | Camada 2: Despesa com Divisória) */}
      <div className="space-y-6">
        {/* === CAMADA 1: CARDS DE RECEITA === */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-emerald-600">account_balance_wallet</span>
            <span>Painel da Receita Orçamentária</span>
          </div>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Valor Previsto LDO (Receita) */}
            <div className="glass-card bg-surface p-4 border-l-4 border-l-emerald-600 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LDO</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {currency.format(ldoReceitaTotal)}
              </h3>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">Receita Planejada LDO</p>
            </div>

            {/* Card 2: Valor Previsto LOA (Receita) */}
            <div className="glass-card bg-surface p-4 border-l-4 border-l-blue-600 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LOA</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {currency.format(0)}
              </h3>
              <p className="text-[10px] text-blue-700 font-semibold mt-1">Receita Fixada LOA</p>
            </div>

            {/* Card 3: Diferença LOA - LDO (Receita) */}
            {(() => {
              const recLdo = ldoReceitaTotal;
              const recLoa = 0;
              const recDiff = recLoa - recLdo;
              const isGreater = recDiff > 0;
              const isSmaller = recDiff < 0;

              return (
                <div className={`glass-card bg-surface p-4 border-l-4 ${isGreater ? "border-l-rose-500 bg-rose-50/20" : isSmaller ? "border-l-emerald-500" : "border-l-gray-400"} shadow-sm`}>
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diferença (LOA - LDO)</p>
                  <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${isGreater ? "text-rose-600" : isSmaller ? "text-emerald-600" : "text-on-surface"}`}>
                    {isGreater ? "▲" : isSmaller ? "▼" : "—"} {currency.format(Math.abs(recDiff))}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    {isGreater ? "⚠️ LOA maior que a LDO (+ Excesso)" : isSmaller ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
                  </p>
                </div>
              );
            })()}

            {/* Card 4: Execução Planejamento (Receita) */}
            <div className="glass-card bg-surface p-4 border-l-4 border-l-purple-600 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Execução Planejamento</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {percent.format(ldoReceitaTotal > 0 ? 0 : 1)}
              </h3>
              <p className="text-[10px] text-purple-700 font-semibold mt-1">Transformado em LOA</p>
            </div>

            {/* Card 5: Maior Arrecadação LDO (Receita) */}
            <div className="glass-card bg-surface p-4 border-l-4 border-l-teal-600 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Maior Arrecadação LDO</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {currency.format(0)}
              </h3>
              <p className="text-[10px] text-teal-700 font-semibold mt-1">Maior Fonte LDO</p>
            </div>

            {/* Card 6: Total de Fontes / Vínculos (Receita) */}
            <div className="glass-card bg-surface p-4 border-l-4 border-l-amber-600 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Fontes / Vínculos</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {integer.format(61)}
              </h3>
              <p className="text-[10px] text-amber-700 font-semibold mt-1">Fontes de Recurso LDO</p>
            </div>
          </section>
        </div>

        {/* Divisória Sutil com Estilo de Linha Elegante */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-outline-variant/60"></div>
          <span className="flex-shrink mx-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full border border-outline-variant/40">
            Detalhamento Orçamentário
          </span>
          <div className="flex-grow border-t border-outline-variant/60"></div>
        </div>

        {/* === CAMADA 2: CARDS DE DESPESA === */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-blue-600">payments</span>
            <span>Painel da Despesa Orçamentária</span>
          </div>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="glass-card bg-surface p-4 border-l-4 border-l-emerald-500 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LDO</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {currency.format(metrics.valLdoTotal)}
              </h3>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">Despesa Planejada</p>
            </div>

            <div className="glass-card bg-surface p-4 border-l-4 border-l-blue-500 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LOA</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {currency.format(metrics.valLoaTotal)}
              </h3>
              <p className="text-[10px] text-blue-700 font-semibold mt-1">Despesa Fixada</p>
            </div>

            <div className={`glass-card bg-surface p-4 border-l-4 ${metrics.diff > 0 ? "border-l-rose-500 bg-rose-50/20" : metrics.diff < 0 ? "border-l-emerald-500" : "border-l-gray-400"} shadow-sm`}>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diferença (LOA - LDO)</p>
              <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${metrics.diff > 0 ? "text-rose-600" : metrics.diff < 0 ? "text-emerald-600" : "text-on-surface"}`}>
                {metrics.diff > 0 ? "▲" : metrics.diff < 0 ? "▼" : "—"} {currency.format(Math.abs(metrics.diff))}
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-1">
                {metrics.diff > 0 ? "⚠️ LOA maior que a LDO (+ Excesso)" : metrics.diff < 0 ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
              </p>
            </div>

            <div className="glass-card bg-surface p-4 border-l-4 border-l-purple-500 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Execução Planejamento</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {percent.format(metrics.percentExec / 100)}
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-1">Transformado em LOA</p>
            </div>

            <div className="glass-card bg-surface p-4 border-l-4 border-l-teal-500 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total de Ações</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {integer.format(metrics.totalAcoes)}
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-1">Ações distintas</p>
            </div>

            <div className="glass-card bg-surface p-4 border-l-4 border-l-amber-500 shadow-sm">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total de Naturezas</p>
              <h3 className="text-lg font-headline font-extrabold text-on-surface">
                {integer.format(metrics.totalNaturezas)}
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-1">Classificações econômicas</p>
            </div>
          </section>
        </div>
      </div>

      {/* 3. Área de Filtros em Formato Chips Completos */}
      <section className="glass-card p-5 bg-surface border border-outline-variant space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            <h3 className="text-sm font-headline font-bold text-on-surface">Filtros Avançados Orçamentários</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por código, ação, palavra-chave..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
            <button
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Grade de Select Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(Object.keys(filterOptions) as Array<keyof typeof filterOptions>).map((key) => {
            const labels: Record<string, string> = {
              secretaria: "Secretaria",
              orgao: "Órgão",
              unidade: "Unidade",
              programa: "Programa",
              acao: "Ação",
              natureza: "Natureza",
              fonteVinculo: "Fonte / Vínculo",
              categoriaEconomica: "Cat. Econômica",
              grupoNatureza: "Grupo Natureza",
              elemento: "Elemento",
              subelemento: "Subelemento",
              processo: "Processo",
              exercicio: "Exercício",
            };

            const selectedCount = (filters[key] || []).length;

            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant">{labels[key] || key}</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    setFilters((prev) => {
                      const arr = prev[key] || [];
                      return {
                        ...prev,
                        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
                      };
                    });
                  }}
                  className={`text-xs px-2 py-1.5 rounded-lg border bg-surface transition-colors cursor-pointer ${
                    selectedCount ? "border-primary font-bold text-primary bg-primary/5" : "border-outline-variant text-on-surface-variant"
                  }`}
                  value=""
                >
                  <option value="">{selectedCount ? `${selectedCount} sel.` : "Todos"}</option>
                  {(filterOptions[key] || []).slice(0, 100).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Painel Principal (Estrutura Hierárquica em cima, Tabela Dinâmica Editable embaixo) */}
      <div className="space-y-6">
        {/* Bloco 1 (CIMA): Estrutura Hierárquica (Pivot Table Tree View) */}
        <div className="glass-card p-5 bg-surface border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant">
            <div>
              <h3 className="text-sm font-headline font-bold text-on-surface">Estrutura Hierárquica (Pivot)</h3>
              <p className="text-[11px] text-on-surface-variant">Navegação em árvore da distribuição orçamentária</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAllNodes}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-outline-variant"
                title="Expandir Tudo"
              >
                Expandir Tudo
              </button>
              <button
                onClick={collapseAllNodes}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-outline-variant"
                title="Recolher Tudo"
              >
                Recolher Tudo
              </button>
            </div>
          </div>

          {/* Legend Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-surface-container/70 border border-outline-variant/60 text-[11px] font-bold text-on-surface-variant">
            <span>Estrutura / Agrupamento</span>
            <div className="flex items-center gap-6 pr-2">
              <span className="text-primary font-bold">Fixação LOA (R$)</span>
              <span className="text-on-surface-variant font-bold">Diferença (LOA - LDO)</span>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-1 space-y-1">
            {pivotTree.length === 0 ? (
              <p className="text-xs text-on-surface-variant p-4 text-center">Nenhum registro encontrado para a estrutura.</p>
            ) : (
              renderTreeNodes(pivotTree)
            )}
          </div>
        </div>

        {/* Bloco 2 (BAIXO): Tabela Analítica Editável de Detalhamento */}
        <div className="glass-card p-5 bg-surface border border-outline-variant flex flex-col min-h-[500px]">
          {/* Barra Superior da Tabela */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-outline-variant">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-headline font-bold text-on-surface">Detalhamento Analítico Editável</h3>
                <p className="text-[11px] text-on-surface-variant">Dê duplo clique ou edite os valores diretamente nas células</p>
              </div>
              <input
                type="text"
                placeholder="Filtrar por código ou descrição..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface w-56"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface font-semibold"
              >
                <option value="todos">Todos os Status</option>
                <option value="Suplementada">Suplementada</option>
                <option value="Reduzida">Reduzida</option>
                <option value="Nova Dotação">Nova Dotação</option>
                <option value="Removida">Removida</option>
                <option value="Sem alteração">Sem alteração</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Imprimir
              </button>
            </div>
          </div>

          {/* Data Grid Analítica Editável */}
          <div className="flex-1 overflow-auto max-h-[480px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container sticky top-0 z-10 text-[11px] font-bold text-on-surface-variant">
                <tr>
                  <th className="p-2.5 border-b border-outline-variant">Ação</th>
                  <th className="p-2.5 border-b border-outline-variant">Natureza</th>
                  <th className="p-2.5 border-b border-outline-variant text-right">Valor LDO</th>
                  <th className="p-2.5 border-b border-outline-variant text-right">Valor LOA (Editável)</th>
                  <th className="p-2.5 border-b border-outline-variant text-right">Diferença</th>
                  <th className="p-2.5 border-b border-outline-variant text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-mono">
                {filteredItems
                  .filter((item) => {
                    if (statusFilter !== "todos" && getStatusInfo(item.valLdo, item.valLoa).label !== statusFilter) return false;
                    if (tableSearch) {
                      const q = tableSearch.toLowerCase();
                      return (
                        item.acao.toLowerCase().includes(q) ||
                        item.natureza.toLowerCase().includes(q) ||
                        item.processo.toLowerCase().includes(q) ||
                        item.subelemento.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .slice(0, 150)
                  .map((item) => {
                    const diff = item.valLoa - item.valLdo;
                    const status = getStatusInfo(item.valLdo, item.valLoa);
                    const diffColor = diff > 0 ? "text-emerald-600 font-bold" : diff < 0 ? "text-rose-600 font-bold" : "text-gray-400";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-container/50 transition-colors"
                      >
                        <td className="p-2.5 font-sans font-medium text-on-surface max-w-[180px] truncate" title={item.acao}>
                          {item.acao}
                        </td>
                        <td className="p-2.5 text-on-surface-variant max-w-[150px] truncate" title={item.natureza}>
                          {item.natureza}
                        </td>
                        <td className="p-2.5 text-right font-mono text-on-surface-variant select-none bg-surface-container/20 cursor-not-allowed">
                          {formatBr(item.valLdo)}
                        </td>
                        <td className="p-2 border border-outline-variant/20 bg-surface text-right">
                          <input
                            type="text"
                            value={
                              editingCell?.id === item.id && editingCell?.field === "valLoa"
                                ? tempInputValue
                                : formatBr(item.valLoa)
                            }
                            onFocus={() => {
                              setEditingCell({ id: item.id, field: "valLoa" });
                              setTempInputValue(item.valLoa.toFixed(2).replace(".", ","));
                            }}
                            onChange={(e) => {
                              setTempInputValue(e.target.value);
                              const newLoa = parseBr(e.target.value);
                              setRawItems((prev) =>
                                prev.map((r) => (r.id === item.id ? { ...r, valLoa: newLoa } : r))
                              );
                            }}
                            onBlur={() => setEditingCell(null)}
                            className="w-32 text-right px-1.5 py-0.5 rounded border border-outline-variant/60 bg-surface font-mono font-bold text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                          />
                        </td>
                        <td className={`p-2.5 text-right ${diffColor}`}>
                          {diff > 0 ? `▲ ${currency.format(diff)}` : diff < 0 ? `▼ ${currency.format(Math.abs(diff))}` : "—"}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full border ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-surface-container sticky bottom-0 z-10 font-mono font-bold text-xs border-t-2 border-outline-variant">
                <tr>
                  <td colSpan={2} className="p-3 text-on-surface font-sans font-extrabold uppercase tracking-wider text-[11px]">
                    Total Geral Filtrado ({filteredItems.length} registros)
                  </td>
                  <td className="p-3 text-right text-on-surface-variant font-extrabold">
                    {formatBr(metrics.valLdoTotal)}
                  </td>
                  <td className="p-3 text-right text-primary font-extrabold">
                    {formatBr(metrics.valLoaTotal)}
                  </td>
                  <td className={`p-3 text-right font-extrabold ${metrics.diff > 0 ? "text-rose-600" : metrics.diff < 0 ? "text-emerald-600" : "text-on-surface"}`}>
                    {metrics.diff > 0 ? `▲ ${currency.format(metrics.diff)}` : metrics.diff < 0 ? `▼ ${currency.format(Math.abs(metrics.diff))}` : "—"}
                  </td>
                  <td className="p-3 text-center text-on-surface-variant text-[10px]">
                    TOTALIZADOR
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Dashboards Analíticos Inferiores */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking Top 5 Maiores Aumentos */}
        <div className="glass-card p-5 bg-surface border border-outline-variant space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-emerald-600">trending_up</span>
            <h3 className="text-sm font-headline font-bold text-on-surface">Top 5 Maiores Aumentos (LOA &gt; LDO)</h3>
          </div>
          <div className="space-y-2">
            {filteredItems
              .map((i) => ({ ...i, diff: i.valLoa - i.valLdo }))
              .sort((a, b) => b.diff - a.diff)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-on-surface truncate">{item.acao}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{item.subelemento || item.natureza}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 shrink-0">+{currency.format(item.diff)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Ranking Top 5 Maiores Reduções */}
        <div className="glass-card p-5 bg-surface border border-outline-variant space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-rose-600">trending_down</span>
            <h3 className="text-sm font-headline font-bold text-on-surface">Top 5 Maiores Reduções (LOA &lt; LDO)</h3>
          </div>
          <div className="space-y-2">
            {filteredItems
              .map((i) => ({ ...i, diff: i.valLoa - i.valLdo }))
              .sort((a, b) => a.diff - b.diff)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-rose-50/50 rounded-lg border border-rose-100">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-on-surface truncate">{item.acao}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{item.subelemento || item.natureza}</p>
                  </div>
                  <span className="font-mono font-bold text-rose-700 shrink-0">{currency.format(item.diff)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Distribuição por Categoria Econômica */}
        <div className="glass-card p-5 bg-surface border border-outline-variant space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-primary">pie_chart</span>
            <h3 className="text-sm font-headline font-bold text-on-surface">Resumo por Categoria Econômica</h3>
          </div>
          <div className="space-y-3 pt-2">
            {["3.1", "3.3", "4.4", "4.6"].map((code) => {
              const val = filteredItems
                .filter((i) => i.natureza.includes(code))
                .reduce((s, i) => s + i.valLoa, 0);
              const share = metrics.valLoaTotal > 0 ? (val / metrics.valLoaTotal) * 100 : 0;
              const labels: Record<string, string> = {
                "3.1": "3.1 — Pessoal e Encargos",
                "3.3": "3.3 — Outras Despesas Correntes",
                "4.4": "4.4 — Investimentos",
                "4.6": "4.6 — Amortização da Dívida",
              };
              return (
                <div key={code} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">{labels[code]}</span>
                    <span className="font-mono text-primary">{currency.format(val)} ({percent.format(share / 100)})</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, share)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Painel Drawer Lateral Inteligente (Insights) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between border-l border-outline-variant">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">psychology</span>
                  <h3 className="text-lg font-headline font-bold">Insights do Orçamento</h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 mt-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800 uppercase">Maior Aumento Encontrado</p>
                  <p className="text-sm font-bold text-emerald-950 mt-1">{insights.maiorAumento.item || "Sem registro"}</p>
                  <p className="text-lg font-mono font-extrabold text-emerald-700 mt-1">+{currency.format(insights.maiorAumento.val)}</p>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-xs font-bold text-rose-800 uppercase">Maior Redução Encontrada</p>
                  <p className="text-sm font-bold text-rose-950 mt-1">{insights.maiorReducao.item || "Sem registro"}</p>
                  <p className="text-lg font-mono font-extrabold text-rose-700 mt-1">{currency.format(insights.maiorReducao.val)}</p>
                </div>

                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Aderência LDO x LOA:</span>
                    <span className="font-bold text-primary">{percent.format(insights.aderencia / 100)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Novas Dotações Criadas:</span>
                    <span className="font-bold text-emerald-600">{insights.novasDotacoes}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Dotações Removidas:</span>
                    <span className="font-bold text-rose-600">{insights.dotacoesRemovidas}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Total Suplementado:</span>
                    <span className="font-bold text-emerald-600">+{currency.format(insights.suplementado)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Total Reduzido:</span>
                    <span className="font-bold text-rose-600">-{currency.format(insights.reduzido)}</span>
                  </div>
                </div>

                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant space-y-2">
                  <p className="text-xs font-bold text-on-surface uppercase">Concentração de Recursos</p>
                  <p className="text-xs text-on-surface-variant">
                    <strong>Maior Secretaria:</strong> {insights.secretariaMaiorOrcamento}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <strong>Programa Mais Impactado:</strong> {insights.programaMaisImpactado}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDrawerOpen(false)}
              className="w-full py-2.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
            >
              Fechar Painel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
