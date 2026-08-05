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
  isSpecialBottom?: boolean;
  children?: TreeNode[];
  parentContext?: {
    secretaria?: string;
    programa?: string;
    acao?: string;
    natureza?: string;
  };
}

export function AnaliseLoaView() {
  const [loading, setLoading] = useState(true);
  const [rawItems, setRawItems] = useState<RawBudgetItem[]>([]);
  const [ldoReceitaTotal, setLdoReceitaTotal] = useState<number>(0);
  const [filters, setFilters] = useState<TechnicalFilterState>(INITIAL_FILTERS);

  // Estados da Tree View, Tabela e Alterações
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItemForInsights, setSelectedItemForInsights] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  // Estados adicionais para os cards de Sub-elementos e Iniciativas Estratégicas
  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loadingIniciativas, setLoadingIniciativas] = useState(false);

  // Buscar Iniciativas Estratégicas sempre que qualquer filtro mudar
  useEffect(() => {
    async function loadIniciativas() {
      try {
        setLoadingIniciativas(true);
        const params = new URLSearchParams();

        if (filters.secretaria.length > 0) {
          const sec = filters.secretaria[0].replace(/^\.+/, "").trim();
          params.append("secretaria", sec);
        }
        if (filters.programa.length > 0) {
          params.append("programa", filters.programa[0].trim());
        }
        if (filters.acao.length > 0) {
          params.append("acao", filters.acao[0].trim());
        }
        if (filters.natureza.length > 0) {
          const rawNat = filters.natureza[0].trim();
          const codeMatch = rawNat.match(/\d+(\.\d+)*/);
          params.append("despesa", codeMatch ? codeMatch[0] : rawNat);
        }
        if (filters.fonteVinculo.length > 0) {
          params.append("vinculo", filters.fonteVinculo[0].trim());
        }
        if (filters.search) {
          params.append("search", filters.search);
        }

        const res = await fetch(`/api/iniciativas?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setIniciativas(data.iniciativas || []);
        }
      } catch (err) {
        console.error("Erro ao carregar iniciativas:", err);
      } finally {
        setLoadingIniciativas(false);
      }
    }

    loadIniciativas();
  }, [
    filters.secretaria,
    filters.orgao,
    filters.unidade,
    filters.programa,
    filters.acao,
    filters.natureza,
    filters.fonteVinculo,
    filters.elemento,
    filters.subelemento,
    filters.search,
  ]);

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

        // Carregar nomenclaturas de despesa do banco de dados
        let nomMap: Record<string, string> = {};
        try {
          const nomRes = await fetch("/api/nomenclaturas-despesa");
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            nomMap = nomData.mapa || {};
          }
        } catch (nomErr) {
          console.warn("Não foi possível carregar nomenclaturas de despesa via API:", nomErr);
        }

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
          let natureStr = String(r[14] || "").trim().replace(/^\.+/, "").replace(/\.\./g, ".");
          // Correção de códigos de despesa truncados
          natureStr = natureStr
            .replace(/^3\.50\.39/, "3.3.50.39")
            .replace(/^3\.90\.35/, "3.3.90.35")
            .replace(/^4\.90\.52/, "4.4.90.52");
          const subelemStr = String(r[15] || "").trim().replace(/^\.+/, "");
          const processStr = String(r[16] || "").trim().replace(/^\.+/, "");
          const valor = Number(r[17]) || 0;

          // Enriquecer natureza com a descrição oficial da NomenclaturaDespesa se disponível
          const natCodeClean = natureStr.split("-")[0].trim();
          const natCodeRaw = natCodeClean.replace(/\D/g, "");
          const officialDesc = nomMap[natCodeClean] || nomMap[natCodeRaw];
          if (officialDesc) {
            natureStr = `${natCodeClean} - ${officialDesc}`;
          }

          // Extração de Categoria, Grupo e Elemento a partir do código de Natureza (ex: 3.3.90.39.00)
          const parts = natCodeClean.split(".");
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

        // Carregar alterações de LOA salvas no localStorage (se existirem)
        let itemsArray = [...loaMap.values()];
        try {
          const savedCustomLoa = localStorage.getItem("painel_loa_custom_edits_v1");
          if (savedCustomLoa) {
            const customMap: Record<string, number> = JSON.parse(savedCustomLoa);
            itemsArray = itemsArray.map((item) => {
              if (customMap[item.id] !== undefined) {
                return { ...item, valLoa: customMap[item.id] };
              }
              return item;
            });
          }
        } catch (e) {
          console.warn("Erro ao carregar edições salvas do localStorage:", e);
        }

        setRawItems(itemsArray);

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

  // Salvar alterações de LOA persistentemente no localStorage
  const handleSaveEdits = () => {
    try {
      setSavingState("saving");
      const customMap: Record<string, number> = {};
      rawItems.forEach((item) => {
        customMap[item.id] = item.valLoa;
      });
      localStorage.setItem("painel_loa_custom_edits_v1", JSON.stringify(customMap));
      setHasChanges(false);
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 3000);
    } catch (err) {
      console.error("Erro ao salvar alterações:", err);
      setSavingState("idle");
    }
  };

  // Restaurar valores padrão da planilha original
  const handleResetEdits = () => {
    if (confirm("Deseja desfazer todas as edições manuais e restaurar os valores originais?")) {
      localStorage.removeItem("painel_loa_custom_edits_v1");
      window.location.reload();
    }
  };

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

  // Agrupamento dos Sub-elementos dos itens filtrados
  const subelementosBreakdown = useMemo(() => {
    const map = new Map<string, { subelemento: string; acao: string; secretaria: string; natureza: string; ldo: number; loa: number; diff: number; count: number }>();

    filteredItems.forEach((item) => {
      const name = item.subelemento && item.subelemento.trim() !== "" ? item.subelemento : item.natureza || "Outros / Sem Subelemento";
      const key = `${item.secretaria}_${item.acao}_${item.natureza || ""}_${name}`;

      if (!map.has(key)) {
        map.set(key, {
          subelemento: name,
          acao: item.acao || "",
          secretaria: item.secretaria || "",
          natureza: item.natureza || "",
          ldo: 0,
          loa: 0,
          diff: 0,
          count: 0,
        });
      }
      const entry = map.get(key)!;
      entry.ldo += item.valLdo;
      entry.loa += item.valLoa;
      entry.diff = entry.loa - entry.ldo;
      entry.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.loa - a.loa);
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
          parentContext: { secretaria: item.secretaria },
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
          parentContext: { secretaria: item.secretaria, programa: item.programa },
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
          parentContext: { secretaria: item.secretaria, programa: item.programa, acao: item.acao },
        };
        acaoNode.children!.push(natNode);
      }
      natNode.valLdo += item.valLdo;
      natNode.valLoa += item.valLoa;
      natNode.diff = natNode.valLoa - natNode.valLdo;
    });

    // Função para extrair o código numérico inicial da secretaria (ex: "08" -> 8, "01- CMO" -> 1)
    const getSecCode = (name: string): number => {
      const match = name.trim().match(/^\d+/);
      return match ? parseInt(match[0], 10) : 999;
    };

    // Secretarias especiais que devem ir separadas para a parte de baixo (01 - CMO, 21 - IPMO, 22 - FITO)
    const isSpecialBottom = (name: string): boolean => {
      const clean = name.trim().toUpperCase();
      const code = getSecCode(clean);
      return (
        clean.includes("CMO") ||
        clean.includes("IPMO") ||
        clean.includes("FITO") ||
        code === 1 ||
        code === 21 ||
        code === 22
      );
    };

    const regularNodes = rootNodes
      .filter((n) => !isSpecialBottom(n.name))
      .sort((a, b) => getSecCode(a.name) - getSecCode(b.name));

    const bottomNodes = rootNodes
      .filter((n) => isSpecialBottom(n.name))
      .sort((a, b) => getSecCode(a.name) - getSecCode(b.name))
      .map((n) => ({ ...n, isSpecialBottom: true }));

    return [...regularNodes, ...bottomNodes];
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

  // Filtrar automaticamente ao clicar em um nó da árvore hierárquica
  const handleNodeSelect = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();

    // Se tiver filhos, expande/recolhe a árvore
    if (node.children && node.children.length > 0) {
      toggleNode(node.id);
    }

    setFilters((prev) => {
      const next = { ...prev };
      if (node.level === "secretaria") {
        next.secretaria = [node.name];
        next.programa = [];
        next.acao = [];
        next.natureza = [];
      } else if (node.level === "programa") {
        if (node.parentContext?.secretaria) next.secretaria = [node.parentContext.secretaria];
        next.programa = [node.name];
        next.acao = [];
        next.natureza = [];
      } else if (node.level === "acao") {
        if (node.parentContext?.secretaria) next.secretaria = [node.parentContext.secretaria];
        if (node.parentContext?.programa) next.programa = [node.parentContext.programa];
        next.acao = [node.name];
        next.natureza = [];
      } else if (node.level === "natureza") {
        if (node.parentContext?.secretaria) next.secretaria = [node.parentContext.secretaria];
        if (node.parentContext?.programa) next.programa = [node.parentContext.programa];
        if (node.parentContext?.acao) next.acao = [node.parentContext.acao];
        next.natureza = [node.name];
      }
      return next;
    });
  };

  // Renderização da Tree View Recursiva
  const renderTreeNodes = (nodes: TreeNode[]) => {
    return nodes.map((node, index) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const diffTone = node.diff > 0 ? "text-emerald-600" : node.diff < 0 ? "text-rose-600" : "text-gray-400";
      const isFirstSpecial = node.isSpecialBottom && (index === 0 || !nodes[index - 1].isSpecialBottom);

      // Verificar se este nó está selecionado nos filtros atuais
      const isSelected =
        (node.level === "secretaria" && filters.secretaria.includes(node.name)) ||
        (node.level === "programa" && filters.programa.includes(node.name)) ||
        (node.level === "acao" && filters.acao.includes(node.name)) ||
        (node.level === "natureza" && filters.natureza.includes(node.name));

      return (
        <div key={node.id} className="text-xs">
          {isFirstSpecial && (
            <div className="my-2 border-t border-dashed border-outline-variant/60 pt-1 text-[10px] font-extrabold uppercase text-on-surface-variant/70 tracking-wider">
              Entidades e Fundos Especiais
            </div>
          )}
          <div
            onClick={(e) => handleNodeSelect(node, e)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? "bg-primary/15 font-bold text-primary border border-primary/30 shadow-sm"
                : isExpanded
                ? "bg-surface-container/60 font-semibold"
                : "hover:bg-surface-container/50"
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
          {(Object.keys(filterOptions) as Array<keyof typeof filterOptions>)
            .filter((key) => key !== "orgao")
            .map((key) => {
              const labels: Record<string, string> = {
                secretaria: "Secretaria",
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
            const isDisabled = key === "fonteVinculo";

            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant flex items-center justify-between">
                  <span>{labels[key] || key}</span>
                  {isDisabled && (
                    <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-tighter bg-amber-50 px-1.5 rounded border border-amber-200">
                      Em breve
                    </span>
                  )}
                </label>
                <select
                  disabled={isDisabled}
                  onChange={(e) => {
                    if (isDisabled) return;
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
                  className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                    isDisabled
                      ? "bg-surface-container/40 border-outline-variant/40 text-gray-400 cursor-not-allowed opacity-75"
                      : selectedCount
                      ? "bg-primary/5 border-primary font-bold text-primary cursor-pointer"
                      : "bg-surface border-outline-variant text-on-surface-variant cursor-pointer hover:bg-surface-container/50"
                  }`}
                  value=""
                  title={isDisabled ? "Aguardando importação da planilha de Fonte / Vínculo" : undefined}
                >
                  <option value="">{isDisabled ? "Aguardando importação" : selectedCount ? `${selectedCount} sel.` : "Todos"}</option>
                  {!isDisabled &&
                    (filterOptions[key] || []).slice(0, 100).map((opt) => (
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 font-semibold transition-colors bg-surface ${
                    statusFilters.length > 0
                      ? "border-primary text-primary bg-primary/5 font-bold"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">filter_alt</span>
                  <span>
                    {statusFilters.length === 0
                      ? "Todos os Status"
                      : statusFilters.length === 1
                      ? statusFilters[0]
                      : `${statusFilters.length} status sel.`}
                  </span>
                  <span className="material-symbols-outlined text-xs">
                    {statusDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {statusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setStatusDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-1.5 w-52 bg-surface rounded-xl shadow-xl border border-outline-variant p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between px-2 py-1 border-b border-outline-variant/60 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Filtrar por Status</span>
                        {statusFilters.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setStatusFilters([])}
                            className="text-[10px] font-bold text-rose-600 hover:underline"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      {[
                        { label: "Suplementada", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" },
                        { label: "Reduzida", badge: "bg-rose-100 text-rose-800 border-rose-300" },
                        { label: "Nova Dotação", badge: "bg-blue-100 text-blue-800 border-blue-300" },
                        { label: "Removida", badge: "bg-amber-100 text-amber-800 border-amber-300" },
                        { label: "Sem alteração", badge: "bg-gray-100 text-gray-700 border-gray-300" },
                      ].map((st) => {
                        const checked = statusFilters.includes(st.label);
                        return (
                          <label
                            key={st.label}
                            className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              checked ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-container text-on-surface"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setStatusFilters((prev) =>
                                    prev.includes(st.label)
                                      ? prev.filter((s) => s !== st.label)
                                      : [...prev, st.label]
                                  );
                                }}
                                className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span>{st.label}</span>
                            </div>
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full border ${st.badge}`}>
                              •
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 animate-pulse">
                  Alterações não salvas
                </span>
              )}
              <button
                onClick={handleSaveEdits}
                disabled={savingState === "saving"}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
                  hasChanges
                    ? "bg-primary text-on-primary ring-2 ring-primary/40 hover:bg-primary/90"
                    : savingState === "saved"
                    ? "bg-emerald-600 text-white"
                    : "bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {savingState === "saving" ? "sync" : savingState === "saved" ? "check_circle" : "save"}
                </span>
                <span>
                  {savingState === "saving" ? "Salvando..." : savingState === "saved" ? "Salvo com sucesso!" : "Salvar Alterações"}
                </span>
              </button>
              <button
                onClick={handleResetEdits}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1"
                title="Restaurar valores originais da planilha"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Restaurar
              </button>
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
                    if (statusFilters.length > 0 && !statusFilters.includes(getStatusInfo(item.valLdo, item.valLoa).label)) return false;
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
                              setHasChanges(true);
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

        {/* 4.1. Cards Dinâmicos: Sub-elementos (Esquerda) e Iniciativas Estratégicas (Direita) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Esquerdo: Detalhamento por Sub-elementos */}
          <div className="glass-card p-5 bg-surface border border-outline-variant flex flex-col h-[380px]">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                <div>
                  <h3 className="text-sm font-headline font-bold text-on-surface">Sub-elementos de Despesa</h3>
                  <p className="text-[10px] text-on-surface-variant">Filtrados pela seleção atual ({subelementosBreakdown.length} sub-elementos)</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Subelementos
              </span>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {subelementosBreakdown.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-4 text-center">Nenhum sub-elemento encontrado para os filtros selecionados.</p>
              ) : (
                subelementosBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-surface-container/50 border border-outline-variant/60 hover:bg-surface-container transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {item.acao && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Ação {item.acao}
                          </span>
                        )}
                        {item.natureza && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-blue-50 text-blue-800 border border-blue-200">
                            Despesa {item.natureza.trim().match(/\d+(\.\d+)*/)?.[0] || item.natureza}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-on-surface-variant truncate">
                          {item.secretaria}
                        </span>
                      </div>
                      <p className="font-bold text-on-surface truncate" title={item.subelemento}>
                        {item.subelemento}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono truncate mt-0.5">
                        {item.count} dotação(ões) • LDO: {formatBr(item.ldo)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <p className="font-extrabold text-primary">{formatBr(item.loa)}</p>
                      <p className={`text-[10px] font-bold ${item.diff > 0 ? "text-emerald-600" : item.diff < 0 ? "text-rose-600" : "text-gray-400"}`}>
                        {item.diff > 0 ? `+${formatBr(item.diff)}` : formatBr(item.diff)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card Direito: Iniciativas Estratégicas Vinculadas */}
          <div className="glass-card p-5 bg-surface border border-outline-variant flex flex-col h-[380px]">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">stars</span>
                <div>
                  <h3 className="text-sm font-headline font-bold text-on-surface">Iniciativas Estratégicas</h3>
                  <p className="text-[10px] text-on-surface-variant">Projetos & Ações Estratégicas ({iniciativas.length} iniciativas)</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                PLDO 2027
              </span>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {loadingIniciativas ? (
                <div className="p-8 text-center space-y-2">
                  <span className="material-symbols-outlined animate-spin text-amber-600">sync</span>
                  <p className="text-xs text-on-surface-variant">Buscando iniciativas correspondentes...</p>
                </div>
              ) : iniciativas.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-4 text-center">Nenhuma iniciativa estratégica encontrada para esta seleção.</p>
              ) : (
                iniciativas.map((ini) => (
                  <div
                    key={ini.id}
                    className="p-2.5 rounded-xl bg-surface-container/50 border border-outline-variant/60 hover:bg-surface-container transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Ação {ini.acao}
                        </span>
                        {ini.despesa && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-blue-50 text-blue-800 border border-blue-200">
                            Despesa {ini.despesa}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-on-surface-variant truncate">
                          {ini.secretaria}
                        </span>
                      </div>
                      <p className="font-bold text-on-surface truncate" title={ini.dsIniciativa}>
                        {ini.dsIniciativa}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono truncate mt-0.5">
                        {ini.programaticaLdo} • Vinculo: {ini.vinculo} {ini.despesa ? `• Despesa: ${ini.despesa}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <span className="text-[10px] text-on-surface-variant uppercase block">Valor PLDO</span>
                      <span className="font-extrabold text-amber-700">{currency.format(ini.valorFinalPldo27)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
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
