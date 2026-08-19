"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { currency, integer, percent } from "@/lib/format";
import * as XLSX from "xlsx";
import { BancoProjetosCard } from "./banco-projetos-card";
import { AddElementExpenseDialog, VINCULO_OPTIONS, formatVinculoComAplicacao } from "./add-element-expense-dialog";
import {
  AnaliseLoaCardsConfigDialog,
  DEFAULT_LAYOUT_CONFIG,
  type AnaliseLoaLayoutConfig,
} from "./analise-loa-cards-config-dialog";
import { LOA_EXPECTATIVA, LOA_EXPECTATIVA_TOTAL, normalizeLoaExpectativaSecretaria } from "@/lib/loa-expectativa";

// --- Tipos de Filtro ---
export interface TechnicalFilterState {
  secretaria: string[];
  orgao: string[];
  unidade: string[];
  programa: string[];
  tipoAcao: string[];
  acao: string[];
  natureza: string[];
  fonteVinculo: string[];
  categoriaEconomica: string[];
  grupoNatureza: string[];
  elemento: string[];
  subelemento: string[];
  processo: string[];
  search: string;
}

const INITIAL_FILTERS: TechnicalFilterState = {
  secretaria: [],
  orgao: [],
  unidade: [],
  programa: [],
  tipoAcao: [],
  acao: [],
  natureza: [],
  fonteVinculo: [],
  categoriaEconomica: [],
  grupoNatureza: [],
  elemento: [],
  subelemento: [],
  processo: [],
  search: "",
};

export interface RawBudgetItem {
  id: string;
  progKey: string;
  secretaria: string;
  orgao: string;
  unidade: string;
  programa: string;
  tipoAcao: string;
  acao: string;
  natureza: string;
  fonteVinculo: string;
  categoriaEconomica: string;
  grupoNatureza: string;
  elemento: string;
  subelemento: string;
  processo: string;
  codigoAplicacao?: string;
  projetoIniciado?: string;
  observacao?: string;
  valLdo: number;
  valLoa: number;
  origem?: "Banco de Projetos";
  bancoProjetoKey?: string;
}

interface EditableGroup {
  id: string;
  secretaria: string;
  programa: string;
  acao: string;
  elemento: string;
  fonteVinculo: string;
  processo: string;
  children: RawBudgetItem[];
  valLdo: number;
  valLoa: number;
}

type TableSortColumn = "acao" | "elemento" | "valLdo" | "valLoa" | "diff" | "status" | "adjusted";
type NaturezaOption = { codigo: string; nome: string };
type Iniciativa = { id?: string | number; acao?: string; secretaria?: string; programa?: string; despesa?: string; dsIniciativa?: string; programaticaLdo?: string; vinculo?: string; valorFinalPldo27?: number };
const ADDED_EXPENSES_STORAGE_KEY = "painel_loa_added_expenses_v1";

const ACTION_CANONICAL_MAP: Record<string, string> = {
  "0.001": "0.001 - Serviços da Dívida Pública",
  "0.002": "0.002 - Obrigações Tributárias e Contributivas",
  "0.003": "0.003 - Precatórios e Sentenças Judiciais",
  "1.001": "1.001 - Estudos, Pesquisas, Planos e Projetos",
  "1.002": "1.002 - Reforma e Ampliação de Unidades",
  "1.003": "1.003 - Implantação de Novas Unidades",
  "1.004": "1.004 - Expansão do Turismo",
  "1.005": "1.005 - Desenvolvimento da Infraestrutura Urbana",
  "1.006": "1.006 - Desenvolvimento da Infraestrutura Viária",
  "1.007": "1.007 - Drenagem Urbana",
  "1.008": "1.008 - Microdrenagem Urbana",
  "1.009": "1.009 - Urbanização de Favelas e Comunidades",
  "1.010": "1.010 - Requalificação de Favelas e Comunidades",
  "1.011": "1.011 - Regularização Fundiária de Assentamentos Precários, Loteamentos e Conjuntos Habitacionais",
  "1.012": "1.012 - Construção de Unidades Habitacionais",
  "1.013": "1.013 - Melhoria das Unidades Habitacionais",
  "1.014": "1.014 - Recuperação de Conjuntos Habitacionais",
  "2.001": "2.001 - Remuneração, Benefícios e Encargos",
  "2.002": "2.002 - Abastecimento de Frota",
  "2.003": "2.003 - Qualificação de Servidores e Processos Institucionais",
  "2.004": "2.004 - Qualificação Socioprofissional",
  "2.005": "2.005 - Promoção de Eventos, Comunicação e Participação Social",
  "2.006": "2.006 - Representações Oficiais",
  "2.007": "2.007 - Ampliação e Manutenção de Sistemas de Inteligência, Fiscalização e Tecnologia",
  "2.008": "2.008 - Estágio e Aprendizagem",
  "2.009": "2.009 - Locação de Imóveis",
  "2.010": "2.010 - Manutenção do Transporte Coletivo",
  "2.011": "2.011 - Manutenção de Equipamentos Públicos",
  "2.012": "2.012 - Manutenção de Equipamentos Públicos - Atenção Primária",
  "2.013": "2.013 - Manutenção de Equipamentos Públicos - Atenção Especializada",
  "2.014": "2.014 - Manutenção de Equipamentos Públicos - Atenção Hospitalar e Urgência e Emergência",
  "2.015": "2.015 - Manutenção de Equipamentos Públicos - Proteção Básica",
  "2.016": "2.016 - Manutenção de Equipamentos Públicos - Proteção Especial",
  "2.017": "2.017 - Suporte ao Aluno",
  "2.018": "2.018 - Conectividade e Tecnologia na Educação",
  "2.019": "2.019 - Ações Pedagógicas Complementares",
  "2.020": "2.020 - Transporte de Alunos",
  "2.021": "2.021 - Educação Cidadã",
  "2.022": "2.022 - Parcerias para Criação de Vagas",
  "2.023": "2.023 - Gestão Compartilhada de Equipamentos Públicos",
  "2.024": "2.024 - Distribuição de Alimentos e Benefícios para as Famílias em Situação de Vulnerabilidade",
  "2.025": "2.025 - Auxílio para Inclusão no Mercado de Trabalho",
  "2.026": "2.026 - Residências e Internações Compulsórias",
  "2.027": "2.027 - Intermediação Profissional",
  "2.028": "2.028 - Disseminação de Atividades Culturais e Esportivas Descentralizadas",
  "2.029": "2.029 - Valorização do Patrimônio Histórico-Cultural",
  "2.030": "2.030 - Apoio ao Esporte de Alto Rendimento",
  "2.031": "2.031 - Esporte Amador",
  "2.032": "2.032 - Iniciação Esportiva",
  "2.033": "2.033 - Fortalecimento da Economia Criativa e Solidária",
  "2.034": "2.034 - Manutenção da Infraestrutura Viária",
  "2.035": "2.035 - Manutenção e Serviços de Drenagem Urbana",
  "2.036": "2.036 - Manutenção da Mobilidade Ativa",
  "2.037": "2.037 - Ampliação e Manutenção de Áreas Verdes",
  "2.038": "2.038 - Iluminação Pública",
  "2.039": "2.039 - Limpeza Urbana e Gestão de Resíduos Sólidos",
  "2.040": "2.040 - Auxílio para Acesso à Moradia",
  "2.041": "2.041 - Ação Transversal de Garantia de Direitos",
  "2.042": "2.042 - Manutenção das Atividades Legislativas",
  "2.043": "2.043 - Benefícios Previdenciários",
  "2.044": "2.044 - Reserva de Contingência",
  "9.999": "9.999 - Reserva de Contingência",
};

function normalizeActionLabel(value: string) {
  if (!value) return value;
  const clean = value.trim();
  const match = clean.match(/^(\d+[\.\d]*|\d+)/);
  const code = match ? match[1] : null;
  if (code && ACTION_CANONICAL_MAP[code]) {
    return ACTION_CANONICAL_MAP[code];
  }
  return clean.replace(/^(\d+[\.\d]*)\s*[-—–]+\s*/, "$1 - ").replace(/\s+/g, " ");
}

function normalizeProgramLabel(value: string) {
  if (!value) return value;
  const program = value.trim();
  if (program === "0021" || program.startsWith("0021")) return "0021 - Encargos Especiais";
  return program.replace(/^(\d+)\s*[-—–]*\s*/, "$1 - ").replace(/\s+/g, " ");
}

function getActionTypeLabel(action: string): string {
  if (!action) return "Outros";
  const clean = action.trim();
  const firstChar = clean.charAt(0);
  if (firstChar === "0") return "0. Operação Especial";
  if (firstChar === "1") return "1. Projeto";
  if (firstChar === "2") return "2. Atividade";
  return "Outros";
}

function getStatusLabel(valLdo: number, valLoa: number) {
  if (valLdo === 0 && valLoa > 0) return "Nova Dotação";
  if (valLdo > 0 && valLoa === 0) return "Removida";
  if (valLoa > valLdo) return "Suplementada";
  if (valLoa < valLdo) return "Reduzida";
  return "Sem alteração";
}

import ldoPlanningJson from "@/lib/ldo-planning-data.json";

interface LdoPlanningData {
  indicador: string;
  unidadeMedida: string;
  custoFisico2027: number | string;
  produto?: string;
  custoFinanceiro2027?: number;
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
  const [rawItems, setRawItems] = useState<RawBudgetItem[]>([]);
  const [dataLoadState, setDataLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [dataLoadError, setDataLoadError] = useState("");
  const [dataReloadKey, setDataReloadKey] = useState(0);
  const [ldoReceitaTotal, setLdoReceitaTotal] = useState<number>(0);
  const [filters, setFilters] = useState<TechnicalFilterState>(INITIAL_FILTERS);

  const loaExpectativaTotal = useMemo(() => {
    if (filters.secretaria.length === 0) return LOA_EXPECTATIVA_TOTAL;
    const selected = new Set(filters.secretaria.map(normalizeLoaExpectativaSecretaria));
    return LOA_EXPECTATIVA.reduce((total, item) => {
      const name = normalizeLoaExpectativaSecretaria(item.secretaria);
      return total + (selected.has(name) ? item.valor : 0);
    }, 0);
  }, [filters.secretaria]);

  // Estados da Tree View, Tabela, Alterações e Justificativas
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedEditGroups, setExpandedEditGroups] = useState<Set<string>>(new Set());
  const [expandedNatureGroups, setExpandedNatureGroups] = useState<Set<string>>(new Set());
  const [collapsedLdoPlanningGroups, setCollapsedLdoPlanningGroups] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState("");
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState<Record<string, string>>({});
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [tableSort, setTableSort] = useState<{ column: TableSortColumn; direction: "asc" | "desc" }>({ column: "acao", direction: "asc" });
  const [natureSort, setNatureSort] = useState<{ column: "natureza" | "subelementos" | "valLdo" | "valLoa" | "diff" | "status"; direction: "asc" | "desc" }>({ column: "natureza", direction: "asc" });
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");
  const [savedRawItems, setSavedRawItems] = useState<RawBudgetItem[]>([]);
  const [originalRawItems, setOriginalRawItems] = useState<RawBudgetItem[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const saveModalDialogRef = useRef<HTMLDivElement>(null);
  const saveModalTriggerRef = useRef<HTMLElement | null>(null);
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [naturezaOptions, setNaturezaOptions] = useState<NaturezaOption[]>([]);
  const [addExpenseGroup, setAddExpenseGroup] = useState<EditableGroup | null>(null);
  const [addElementContext, setAddElementContext] = useState<{ group: EditableGroup; natureza: string } | null>(null);
  const [newExpenseNatureza, setNewExpenseNatureza] = useState("");
  const [newExpenseSubelemento, setNewExpenseSubelemento] = useState("");
  const originalValuesById = useMemo(() => new Map(originalRawItems.map((item) => [item.id, item.valLoa])), [originalRawItems]);
  const [newExpenseVinculo, setNewExpenseVinculo] = useState("01");
  const [newExpenseCodigoAplicacao, setNewExpenseCodigoAplicacao] = useState("");
  const [newExpenseProcesso, setNewExpenseProcesso] = useState("");
  const [newExpenseProjetoIniciado, setNewExpenseProjetoIniciado] = useState("");
  const [newExpenseObservacao, setNewExpenseObservacao] = useState("");
  const [newExpenseValor, setNewExpenseValor] = useState("");
  // Estado para Edição de Subelemento via Modal
  const [editingSubelementItem, setEditingSubelementItem] = useState<RawBudgetItem | null>(null);
  const [editSubelementName, setEditSubelementName] = useState("");
  const [editSubelementVinculo, setEditSubelementVinculo] = useState("");
  const [editSubelementCodigoAplicacao, setEditSubelementCodigoAplicacao] = useState("");
  const [editSubelementProcesso, setEditSubelementProcesso] = useState("");
  const [editSubelementProjetoIniciado, setEditSubelementProjetoIniciado] = useState("");
  const [editSubelementObservacao, setEditSubelementObservacao] = useState("");
  const [editSubelementValor, setEditSubelementValor] = useState("");
  // Estado para Rastrear Subelementos/Dotações Excluídos
  const [removedRawItems, setRemovedRawItems] = useState<RawBudgetItem[]>([]);
  const addNatureDialogRef = useRef<HTMLDivElement>(null);
  const editSubelementDialogRef = useRef<HTMLDivElement>(null);
  const addNatureTriggerRef = useRef<HTMLElement | null>(null);
  const editSubelementTriggerRef = useRef<HTMLElement | null>(null);
  // Estado para Rastrear Linhas Validadas pelo Usuário (sem alteração)
  const [validatedRows, setValidatedRows] = useState<Record<string, boolean>>({});

  const toggleValidateRow = async (rowId: string) => {
    const nextState = !validatedRows[rowId];
    const updated = { ...validatedRows, [rowId]: nextState };
    if (!nextState) {
      delete updated[rowId];
    }
    setValidatedRows(updated);

    try {
      localStorage.setItem("painel_loa_validated_rows_v1", JSON.stringify(updated));
    } catch { }

    try {
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chave: "painel_loa_validated_rows",
          valor: updated,
        }),
      });
    } catch (err) {
      console.error("Erro ao persistir validações no banco:", err);
    }
  };

  // Estados para o Planejamento LDO - 2027 (Indicador, Meta Física, Custo Físico 2027)
  const [ldoPlanningMap, setLdoPlanningMap] = useState<Record<string, LdoPlanningData>>({});
  const [editingLdoPlanningGroupKey, setEditingLdoPlanningGroupKey] = useState<string | null>(null);
  const [editLdoIndicador, setEditLdoIndicador] = useState("");
  const [editLdoUnidadeMedida, setEditLdoUnidadeMedida] = useState("");
  const [editLdoCustoFisico, setEditLdoCustoFisico] = useState("");
  const [editLdoCustoFinanceiro, setEditLdoCustoFinanceiro] = useState("");

  const handleStartEditLdoPlanning = (group: EditableGroup) => {
    const currentData = getLdoPlanningForGroup(group);
    setEditLdoIndicador(currentData.indicador || "");
    setEditLdoUnidadeMedida(currentData.unidadeMedida || "Percentual (%)");
    setEditLdoCustoFisico(
      currentData.custoFisico2027 != null
        ? currentData.custoFisico2027.toString().replace(".", ",")
        : "0"
    );
    setEditLdoCustoFinanceiro(
      currentData.custoFinanceiro2027 != null
        ? formatBr(currentData.custoFinanceiro2027)
        : formatBr(group.valLoa)
    );
    setEditingLdoPlanningGroupKey(group.id);
  };

  const handleSaveLdoPlanning = async (group: EditableGroup) => {
    const custoFisicoNum = parseBr(editLdoCustoFisico);
    const custoFinNum = parseBr(editLdoCustoFinanceiro);

    const updatedMap: Record<string, LdoPlanningData> = {
      ...ldoPlanningMap,
      [group.id]: {
        indicador: editLdoIndicador.trim() || "Gestão dos compromissos e execução das atividades da ação",
        unidadeMedida: editLdoUnidadeMedida.trim() || "Percentual (%)",
        custoFisico2027: custoFisicoNum,
        produto: editLdoIndicador.trim(),
        custoFinanceiro2027: custoFinNum,
      },
      [group.acao]: {
        indicador: editLdoIndicador.trim() || "Gestão dos compromissos e execução das atividades da ação",
        unidadeMedida: editLdoUnidadeMedida.trim() || "Percentual (%)",
        custoFisico2027: custoFisicoNum,
        produto: editLdoIndicador.trim(),
        custoFinanceiro2027: custoFinNum,
      },
    };

    setLdoPlanningMap(updatedMap);
    try {
      localStorage.setItem("painel_loa_ldo_planning_v1", JSON.stringify(updatedMap));
    } catch { }

    try {
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chave: "painel_loa_ldo_planning",
          valor: updatedMap,
        }),
      });
    } catch (err) {
      console.error("Erro ao persistir LDO planning no banco:", err);
    }

    setEditingLdoPlanningGroupKey(null);
  };

  // Estado para Personalização de Cards e Ordenação do Layout
  const [layoutConfig, setLayoutConfig] = useState<AnaliseLoaLayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [cardsConfigModalOpen, setCardsConfigModalOpen] = useState(false);

  // Carregar configuração de cards do Banco de Dados (com fallback no localStorage)
  useEffect(() => {
    let isMounted = true;
    const loadLayout = async () => {
      try {
        const res = await fetch("/api/configuracoes/layout?chave=analise_loa_cards_layout");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.valor && isMounted) {
            const parsed = data.valor;
            setLayoutConfig({
              sectionsOrder: Array.isArray(parsed.sectionsOrder) && parsed.sectionsOrder.length > 0
                ? parsed.sectionsOrder
                : DEFAULT_LAYOUT_CONFIG.sectionsOrder,
              receitaKpisOrder: Array.isArray(parsed.receitaKpisOrder) && parsed.receitaKpisOrder.length > 0
                ? parsed.receitaKpisOrder
                : DEFAULT_LAYOUT_CONFIG.receitaKpisOrder,
              despesaKpisOrder: Array.isArray(parsed.despesaKpisOrder) && parsed.despesaKpisOrder.length > 0
                ? parsed.despesaKpisOrder
                : DEFAULT_LAYOUT_CONFIG.despesaKpisOrder,
              visibility: { ...DEFAULT_LAYOUT_CONFIG.visibility, ...(parsed.visibility || {}) },
            });
            return;
          }
        }
      } catch (err) {
        console.warn("Falha ao carregar layout do banco, tentando localStorage:", err);
      }

      // Fallback localstorage
      try {
        const savedLayout = localStorage.getItem("painel_loa_cards_config_v1");
        if (savedLayout && isMounted) {
          const parsed = JSON.parse(savedLayout);
          setLayoutConfig({
            sectionsOrder: Array.isArray(parsed.sectionsOrder) && parsed.sectionsOrder.length > 0
              ? parsed.sectionsOrder
              : DEFAULT_LAYOUT_CONFIG.sectionsOrder,
            receitaKpisOrder: Array.isArray(parsed.receitaKpisOrder) && parsed.receitaKpisOrder.length > 0
              ? parsed.receitaKpisOrder
              : DEFAULT_LAYOUT_CONFIG.receitaKpisOrder,
            despesaKpisOrder: Array.isArray(parsed.despesaKpisOrder) && parsed.despesaKpisOrder.length > 0
              ? parsed.despesaKpisOrder
              : DEFAULT_LAYOUT_CONFIG.despesaKpisOrder,
            visibility: { ...DEFAULT_LAYOUT_CONFIG.visibility, ...(parsed.visibility || {}) },
          });
        }
      } catch { }
    };

    loadLayout();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveLayoutConfig = async (newConfig: AnaliseLoaLayoutConfig) => {
    setLayoutConfig(newConfig);
    // Salva no localStorage imediatamente para UX instantânea
    try {
      localStorage.setItem("painel_loa_cards_config_v1", JSON.stringify(newConfig));
    } catch { }

    // Salva no Banco de Dados
    try {
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chave: "analise_loa_cards_layout",
          valor: newConfig,
        }),
      });
    } catch (err) {
      console.error("Erro ao persistir configuração no banco:", err);
    }
  };

  const handleResetLayoutConfig = async () => {
    setLayoutConfig(DEFAULT_LAYOUT_CONFIG);
    try {
      localStorage.removeItem("painel_loa_cards_config_v1");
    } catch { }

    try {
      await fetch("/api/configuracoes/layout?chave=analise_loa_cards_layout", {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Erro ao resetar configuração no banco:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadLdoPlanning = async () => {
      try {
        const res = await fetch("/api/configuracoes/layout?chave=painel_loa_ldo_planning");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.valor && isMounted) {
            setLdoPlanningMap(data.valor);
            return;
          }
        }
      } catch { }

      try {
        const saved = localStorage.getItem("painel_loa_ldo_planning_v1");
        if (saved && isMounted) {
          setLdoPlanningMap(JSON.parse(saved));
        }
      } catch { }
    };

    loadLdoPlanning();
    return () => {
      isMounted = false;
    };
  }, []);

  const getLdoPlanningForGroup = (group: EditableGroup): LdoPlanningData => {
    // 1. Verificar se o usuário já salvou manualmente uma edição para este grupo/ação
    const customUserSaved = ldoPlanningMap[group.id] ?? ldoPlanningMap[group.acao];
    if (customUserSaved) return customUserSaved;

    // Extrair códigos da secretaria, programa e ação do grupo
    const secCodeMatch = (group.secretaria || "").match(/^(\d+)/);
    const secCode = secCodeMatch ? secCodeMatch[1].padStart(2, "0") : "";

    const progCodeMatch = (group.programa || "").match(/^(\d+)/);
    const progCode = progCodeMatch ? progCodeMatch[1].padStart(4, "0") : "";

    const acaoClean = (group.acao || "").trim();
    const acaoCodeMatch = acaoClean.match(/^(\d+[\.\d]*|\d+)/);
    const acaoCode = acaoCodeMatch ? acaoCodeMatch[1] : acaoClean;

    const dataIndexes = ldoPlanningJson as {
      bySecProgAcao: Record<string, any>;
      byProgAcao: Record<string, any>;
      byAcao: Record<string, any>;
    };

    // 2. Busca exata por Secretaria + Programa + Ação
    const keySecProgAcao = `${secCode}|${progCode}|${acaoCode}`;
    const exactMatch = dataIndexes.bySecProgAcao?.[keySecProgAcao];
    if (exactMatch) {
      return {
        indicador: exactMatch.indicador || exactMatch.produto || "Não informado",
        unidadeMedida: exactMatch.unidMedida || "Unidade",
        custoFisico2027: exactMatch.custoFisico2027 ?? 0,
        produto: exactMatch.produto,
        custoFinanceiro2027: exactMatch.custoFinanceiro2027,
      };
    }

    // 3. Busca por Secretaria + Ação (útil quando o programa na LOA foi cadastrado diferente da LDO)
    const keySecAcao = `${secCode}|${acaoCode}`;
    const secAcaoMatch = (dataIndexes as any).bySecAcao?.[keySecAcao];
    if (secAcaoMatch) {
      return {
        indicador: secAcaoMatch.indicador || secAcaoMatch.produto || "Não informado",
        unidadeMedida: secAcaoMatch.unidMedida || "Unidade",
        custoFisico2027: secAcaoMatch.custoFisico2027 ?? 0,
        produto: secAcaoMatch.produto,
        custoFinanceiro2027: secAcaoMatch.custoFinanceiro2027,
      };
    }

    // 4. Busca por Programa + Ação
    const keyProgAcao = `${progCode}|${acaoCode}`;
    const progAcaoMatch = dataIndexes.byProgAcao?.[keyProgAcao];
    if (progAcaoMatch) {
      return {
        indicador: progAcaoMatch.indicador || progAcaoMatch.produto || "Não informado",
        unidadeMedida: progAcaoMatch.unidMedida || "Unidade",
        custoFisico2027: progAcaoMatch.custoFisico2027 ?? 0,
        produto: progAcaoMatch.produto,
        custoFinanceiro2027: progAcaoMatch.custoFinanceiro2027,
      };
    }

    // 5. Busca por Código da Ação Geral
    const acaoMatch = dataIndexes.byAcao?.[acaoCode];
    if (acaoMatch) {
      return {
        indicador: acaoMatch.indicador || acaoMatch.produto || "Não informado",
        unidadeMedida: acaoMatch.unidMedida || "Unidade",
        custoFisico2027: acaoMatch.custoFisico2027 ?? 0,
        produto: acaoMatch.produto,
        custoFinanceiro2027: acaoMatch.custoFinanceiro2027,
      };
    }

    // Fallback padrão
    return {
      indicador: "Gestão dos compromissos e execução das atividades da ação",
      unidadeMedida: "Percentual (%)",
      custoFisico2027: 100,
    };
  };

  // Estados adicionais para os cards de Sub-elementos e Iniciativas Estratégicas
  const [cardSubelementosAcao, setCardSubelementosAcao] = useState<string>("");
  const [cardIniciativasAcao, setCardIniciativasAcao] = useState<string>("");
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([]);
  const [loadingIniciativas, setLoadingIniciativas] = useState(false);

  useEffect(() => {
    if (addExpenseGroup && !addElementContext) {
      addNatureTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => addNatureDialogRef.current?.querySelector<HTMLElement>("select, input, button:not([aria-label^='Fechar'])")?.focus());
    } else if (!addExpenseGroup && !addElementContext) {
      addNatureTriggerRef.current?.focus();
      addNatureTriggerRef.current = null;
    }
  }, [addExpenseGroup, addElementContext]);

  useEffect(() => {
    if (editingSubelementItem) {
      editSubelementTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => editSubelementDialogRef.current?.querySelector<HTMLElement>("input, button:not([aria-label^='Fechar'])")?.focus());
    } else {
      editSubelementTriggerRef.current?.focus();
      editSubelementTriggerRef.current = null;
    }
  }, [editingSubelementItem]);

  useEffect(() => {
    if (saveModalOpen) {
      saveModalTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => saveModalDialogRef.current?.querySelector<HTMLElement>("textarea, button:not([aria-label^='Fechar'])")?.focus());
    } else {
      saveModalTriggerRef.current?.focus();
      saveModalTriggerRef.current = null;
    }
  }, [saveModalOpen]);

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
  const [editingCell, setEditingCell] = useState<{ id: string; field: "valLdo" | "valLoa" | "groupValLoa" } | null>(null);
  const [tempInputValue, setTempInputValue] = useState<string>("");

  const toggleTableSort = (column: TableSortColumn) => {
    setTableSort((current) => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const numberFormatter = useMemo(() => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), []);

  const formatBr = (num: number) => numberFormatter.format(num);

  const parseBr = (text: string) => {
    if (!text) return 0;
    const cleanStr = text.replace(/\./g, "").replace(",", ".");
    const val = parseFloat(cleanStr);
    return Number.isFinite(val) ? Math.max(0, val) : 0;
  };

  // Carregar dados de ambos os cenários e consolidar
  useEffect(() => {
    async function loadTechnicalData() {
      setDataLoadState("loading");
      setDataLoadError("");
      try {

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

        setNaturezaOptions(Object.entries(nomMap).map(([codigo, nome]) => ({ codigo, nome })).sort((left, right) => left.codigo.localeCompare(right.codigo, "pt-BR", { numeric: true })));
        const loaMap = new Map<string, RawBudgetItem>();

        // Tentar carregar registros reais atualizados via API /api/loa?all=true
        try {
          const apiLoaRes = await fetch("/api/loa?all=true");
          if (apiLoaRes.ok) {
            const apiLoaData = await apiLoaRes.json();
            if (false && apiLoaData && Array.isArray(apiLoaData.records) && apiLoaData.records.length > 0) {
              apiLoaData.records.forEach((r: { id?: string; organ?: string; budgetUnit?: string; program?: string; action?: string; expenseNature?: string; subelement?: string; administrativeProcess?: string; value?: number }) => {
                const organStr = String(r.organ || "").trim();
                const unitStr = String(r.budgetUnit || "").trim();
                const programStr = normalizeProgramLabel(String(r.program || ""));
                const actionStr = normalizeActionLabel(String(r.action || ""));
                let natureStr = String(r.expenseNature || "").trim();
                const subelemStr = String(r.subelement || "").trim();
                const processStr = String(r.administrativeProcess || "").trim();
                const valor = Number(r.value) || 0;
                const vinculo = "Tesouro / Próprio";

                const natCodeClean = natureStr.split("-")[0].trim();
                const natCodeRaw = natCodeClean.replace(/\D/g, "");
                const officialDesc = nomMap[natCodeClean] || nomMap[natCodeRaw];
                if (officialDesc) {
                  natureStr = `${natCodeClean} - ${officialDesc}`;
                }

                const parts = natCodeClean.split(".");
                const catDespesaMap: Record<string, string> = {
                  "3": "3 — DESPESAS CORRENTES",
                  "4": "4 — DESPESAS DE CAPITAL",
                  "9": "9 — RESERVA DE CONTINGÊNCIA",
                };
                const catEcon = parts[0] ? (catDespesaMap[parts[0]] || `${parts[0]} — Despesa`) : "Outras";
                const grupoDespesaMap: Record<string, string> = {
                  "0": "RESTOS A PAGAR",
                  "1": "PESSOAL E ENCARGOS SOCIAIS",
                  "2": "JUROS E ENCARGOS DA DÍVIDA",
                  "3": "OUTRAS DESPESAS CORRENTES",
                  "4": "INVESTIMENTOS",
                  "5": "INVERSÕES FINANCEIRAS",
                  "6": "AMORTIZAÇÃO DA DÍVIDA",
                  "8": "EXTRAORÇAMENTÁRIA",
                  "9": "RESERVA DE CONTINGÊNCIA",
                };
                const grupoNome = parts[1] ? grupoDespesaMap[parts[1]] : undefined;
                const grpNat = parts[1]
                  ? (grupoNome ? `${parts[0]}.${parts[1]} — ${grupoNome}` : `${parts[0]}.${parts[1]} — Grupo`)
                  : "Outros";
                const elem = parts.length >= 4 ? parts.slice(0, 4).join(".") : parts[2] ? `${parts[0]}.${parts[1]}.${parts[2]}` : "Outros";

                const groupKey = `${organStr}|${programStr}|${actionStr}|${natureStr}|${vinculo}|${processStr}|${subelemStr}`;

                loaMap.set(groupKey, {
                  id: groupKey,
                  progKey: programStr || groupKey,
                  secretaria: organStr,
                  orgao: organStr,
                  unidade: unitStr,
                  programa: programStr,
                  tipoAcao: getActionTypeLabel(actionStr),
                  acao: actionStr,
                  natureza: natureStr,
                  fonteVinculo: vinculo,
                  categoriaEconomica: catEcon,
                  grupoNatureza: grpNat,
                  elemento: elem,
                  subelemento: subelemStr,
                  processo: processStr || "—",
                  valLdo: 0,
                  valLoa: valor,
                });
              });
            }
          }
        } catch (apiError) {
          console.warn("Não foi possível carregar registros via API:", apiError);
        }
        const res = await fetch(`/loa_new.xlsx?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) throw new Error("Planilha não encontrada");
        const buffer = await res.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
        const headers = (rows[0] ?? []) as unknown[];
        const findCol = (...aliases: string[]) => {
          const targets = aliases.map((a) => a.toLowerCase().trim());
          for (let idx = headers.length - 1; idx >= 0; idx--) {
            const h = String(headers[idx] ?? "").toLowerCase().trim();
            if (targets.includes(h)) return idx;
          }
          return -1;
        };

        const columns = {
          piece: findCol("peça orçamentária", "peca orcamentaria", "peça", "peca"),
          programKey: findCol("programática_loa", "programatica_loa", "programatica"),
          organ: findCol("secretaria", "orgao", "órgão", "secretaria_nome"),
          unit: findCol("unidade", "unid", "cd_unid.-ds_unid."),
          program: findCol("programa", "cd_programa-ds_programa"),
          action: findCol("acao", "ação", "cd_ação-ds_ação", "cd_acao-ds_acao"),
          nature: findCol("natureza", "natureza de despesa", "natureza da despesa"),
          subelement: findCol("desc_sub", "desc sub", "subelemento", "descrição subelemento", "descricao subelemento"),
          process: findCol("processo", "processo administrativo", "proc.", "proc", "processo_administrativo"),
          value: findCol("valor", "val_loa", "valor loa", "valor_loa"),
          link: findCol("vínculo", "vinculo", "fonte", "fonte de recursos", "fonte/vínculo", "fonte/vinculo"),
          appCode: findCol("codigo_aplicacao", "cod_aplicacao", "codigo de aplicacao", "código de aplicação", "cod. aplicacao", "cod aplicacao", "aplicacao", "aplicação", "cd_aplicacao"),
          obs: findCol("obs.", "obs", "observacao", "observação", "observacoes", "observações", "justificativa"),
          iniciado: findCol("iniciado", "projeto iniciado", "projeto_iniciado"),
        };

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          const peca = String(r[columns.piece] || "").trim();
          const progKey = String(r[columns.programKey] || "").trim().replace(/^\.+/, "");
          let organStr = String(r[columns.organ] || "").trim().replace(/^\.+/, "");
          organStr = organStr.replace(/^(\d+)\s*-\s*/, (match, code) => `${code.padStart(2, "0")} - `);
          if (organStr === "01 - CMO" || organStr === "01- CMO") organStr = "01 - CMO";
          const unitStr = String(r[columns.unit] || "").trim().replace(/^\.+/, "");
          const programStr = normalizeProgramLabel(String(r[columns.program] || "").trim().replace(/^\.+/, ""));
          const actionStr = normalizeActionLabel(String(r[columns.action] || "").trim().replace(/^\.+/, ""));
          if (!organStr && !programStr && !actionStr) continue;
          let natureStr = String(r[columns.nature] || "").trim().replace(/^\.+/, "").replace(/\.\./g, ".");
          natureStr = natureStr
            .replace(/^3\.50\.39/, "3.3.50.39")
            .replace(/^3\.90\.35/, "3.3.90.35")
            .replace(/^4\.90\.52/, "4.4.90.52");
          const subelemStr = String(r[columns.subelement] || "").trim().replace(/^\.+/, "");
          const processStr = String(r[columns.process] || "").trim().replace(/^\.+/, "");
          const obsStr = columns.obs >= 0 ? String(r[columns.obs] || "").trim() : "";
          const iniciadoRaw = columns.iniciado >= 0 ? String(r[columns.iniciado] || "").trim().toUpperCase() : "";
          const projetoIniciado = iniciadoRaw === "SIM" || iniciadoRaw === "NÃO" || iniciadoRaw === "NAO"
            ? (iniciadoRaw === "NAO" ? "NÃO" : iniciadoRaw)
            : undefined;
          const valor = Number(r[columns.value]) || 0;
          const realVinculoStr = String(r[columns.link] || "").trim();
          let extractedFonte = realVinculoStr;
          let extractedCodigoAplicacao: string | undefined = columns.appCode >= 0 ? String(r[columns.appCode] || "").trim() || undefined : undefined;

          // Se o vínculo vier no formato composto por pontos (ex.: 01.110.0000)
          if (realVinculoStr.includes(".") && !extractedCodigoAplicacao) {
            const vParts = realVinculoStr.split(".");
            if (vParts.length >= 2) {
              extractedFonte = vParts[0];
              extractedCodigoAplicacao = vParts.slice(1).join(".");
            }
          }

          const natCodeClean = natureStr.split("-")[0].trim();
          const natCodeRaw = natCodeClean.replace(/\D/g, "");
          const officialDesc = nomMap[natCodeClean] || nomMap[natCodeRaw];
          if (officialDesc) {
            natureStr = `${natCodeClean} - ${officialDesc}`;
          }

          const parts = natCodeClean.split(".");
          const catDespesaMap: Record<string, string> = {
            "3": "3 — DESPESAS CORRENTES",
            "4": "4 — DESPESAS DE CAPITAL",
            "9": "9 — RESERVA DE CONTINGÊNCIA",
          };
          const catEcon = parts[0] ? (catDespesaMap[parts[0]] || `${parts[0]} — Despesa`) : "Outras";
          const grupoDespesaMap: Record<string, string> = {
            "0": "RESTOS A PAGAR",
            "1": "PESSOAL E ENCARGOS SOCIAIS",
            "2": "JUROS E ENCARGOS DA DÍVIDA",
            "3": "OUTRAS DESPESAS CORRENTES",
            "4": "INVESTIMENTOS",
            "5": "INVERSÕES FINANCEIRAS",
            "6": "AMORTIZAÇÃO DA DÍVIDA",
            "8": "EXTRAORÇAMENTÁRIA",
            "9": "RESERVA DE CONTINGÊNCIA",
          };
          const grupoNome = parts[1] ? grupoDespesaMap[parts[1]] : undefined;
          const grpNat = parts[1]
            ? (grupoNome ? `${parts[0]}.${parts[1]} — ${grupoNome}` : `${parts[0]}.${parts[1]} — Grupo`)
            : "Outros";
          const elem = parts.length >= 4 ? parts.slice(0, 4).join(".") : parts[2] ? `${parts[0]}.${parts[1]}.${parts[2]}` : "Outros";
          const vinculo = extractedFonte || (parts[3] ? `${parts[2]}.${parts[3]}` : "Tesouro / Próprio");
          const codApp = extractedCodigoAplicacao;

          const groupKey = `${organStr}|${actionStr}|${natureStr}|${vinculo}|${codApp || ""}|${processStr}|${subelemStr}`;

          if (!loaMap.has(groupKey)) {
            loaMap.set(groupKey, {
              id: groupKey,
              progKey: progKey || groupKey,
              secretaria: organStr,
              orgao: organStr,
              unidade: unitStr,
              programa: programStr,
              tipoAcao: getActionTypeLabel(actionStr),
              acao: actionStr,
              natureza: natureStr,
              fonteVinculo: vinculo,
              codigoAplicacao: codApp,
              categoriaEconomica: catEcon,
              grupoNatureza: grpNat,
              elemento: elem,
              subelemento: subelemStr,
              processo: processStr || "—",
              projetoIniciado: projetoIniciado,
              observacao: obsStr || undefined,
              valLdo: 0,
              valLoa: 0,
            });
          }

          const item = loaMap.get(groupKey)!;
          if (peca === "LDO") item.valLdo += valor;
          else if (peca === "LOA") item.valLoa += valor;
        }

        // Guardar cópia original inalterada para comparação em modificações
        setOriginalRawItems(JSON.parse(JSON.stringify([...loaMap.values()])));

        // Carregar alterações de LOA salvas no Banco de Dados / localStorage (se existirem)
        let itemsArray = [...loaMap.values()];

        // 1. Carregar despesas adicionadas manualmente
        try {
          let apiAddedList: RawBudgetItem[] = [];
          const resAdded = await fetch("/api/configuracoes/layout?chave=painel_loa_added_expenses");
          if (resAdded.ok) {
            const data = await resAdded.json();
            if (data.success && Array.isArray(data.valor)) apiAddedList = data.valor;
          }
          const savedAddedExpenses = localStorage.getItem(ADDED_EXPENSES_STORAGE_KEY);
          const localAddedList = savedAddedExpenses ? JSON.parse(savedAddedExpenses) as RawBudgetItem[] : [];
          const addedById = new Map([...apiAddedList, ...localAddedList].map((item) => [item.id, item]));
          const addedList = [...addedById.values()];
          if (addedList.length) {
            itemsArray = [...itemsArray, ...addedList.map(item => ({ ...item, tipoAcao: item.tipoAcao || getActionTypeLabel(item.acao) }))];
          }
        } catch {
          // Registros adicionais inválidos não impedem o carregamento da análise.
        }

        // 2. Carregar e aplicar exclusões permanentes
        try {
          let removedIds: string[] = [];
          const resRemoved = await fetch("/api/configuracoes/layout?chave=painel_loa_removed_expenses");
          if (resRemoved.ok) {
            const data = await resRemoved.json();
            if (data.success && Array.isArray(data.valor)) removedIds = data.valor;
          }
          if (!removedIds.length) {
            const savedRemoved = localStorage.getItem("painel_loa_removed_expenses_v1");
            if (savedRemoved) removedIds = JSON.parse(savedRemoved) as string[];
          }
          if (removedIds.length > 0) {
            const removedSet = new Set(removedIds);
            itemsArray = itemsArray.filter((item) => !removedSet.has(item.id));
          }
        } catch { }

        // 3. Carregar e aplicar edições de valores
        try {
          let customMap: Record<string, number> = {};
          const resCustom = await fetch("/api/configuracoes/layout?chave=painel_loa_custom_edits");
          if (resCustom.ok) {
            const data = await resCustom.json();
            if (data.success && data.valor) customMap = data.valor;
          }
          if (!Object.keys(customMap).length) {
            const savedCustomLoa = localStorage.getItem("painel_loa_custom_edits_v1");
            if (savedCustomLoa) customMap = JSON.parse(savedCustomLoa);
          }

          if (Object.keys(customMap).length > 0) {
            itemsArray = itemsArray.map((item) => {
              if (customMap[item.id] !== undefined) {
                return { ...item, valLoa: customMap[item.id] };
              }
              return item;
            });
          }

          let loadedJustifications: Record<string, string> = {};
          const resJust = await fetch("/api/configuracoes/layout?chave=painel_loa_justifications");
          if (resJust.ok) {
            const data = await resJust.json();
            if (data.success && data.valor) loadedJustifications = data.valor;
          }
          if (!Object.keys(loadedJustifications).length) {
            const savedJustifications = localStorage.getItem("painel_loa_justifications_v1");
            if (savedJustifications) loadedJustifications = JSON.parse(savedJustifications);
          }
          if (Object.keys(loadedJustifications).length > 0) {
            setJustifications(loadedJustifications);
          }
        } catch (e) {
          console.warn("Erro ao carregar edições salvas:", e);
        }

        // 3.5. Carregar e aplicar edições personalizadas de subelementos (vínculo, código de aplicação, processo, projeto iniciado, observação)
        try {
          let subelementEdits: Record<string, Partial<RawBudgetItem>> = {};
          const resSub = await fetch("/api/configuracoes/layout?chave=painel_loa_subelement_edits");
          if (resSub.ok) {
            const data = await resSub.json();
            if (data.success && data.valor) subelementEdits = data.valor;
          }
          if (!Object.keys(subelementEdits).length) {
            const savedSub = localStorage.getItem("painel_loa_subelement_edits_v1");
            if (savedSub) subelementEdits = JSON.parse(savedSub);
          }
          if (Object.keys(subelementEdits).length > 0) {
            itemsArray = itemsArray.map((item) => {
              if (subelementEdits[item.id]) {
                return { ...item, ...subelementEdits[item.id] };
              }
              return item;
            });
          }
        } catch (e) {
          console.warn("Erro ao carregar customizações de subelementos:", e);
        }

        // 4. Carregar linhas validadas pelo usuário
        try {
          let loadedValidated: Record<string, boolean> = {};
          const resVal = await fetch("/api/configuracoes/layout?chave=painel_loa_validated_rows");
          if (resVal.ok) {
            const data = await resVal.json();
            if (data.success && data.valor) loadedValidated = data.valor;
          }
          if (!Object.keys(loadedValidated).length) {
            const savedVal = localStorage.getItem("painel_loa_validated_rows_v1");
            if (savedVal) loadedValidated = JSON.parse(savedVal);
          }
          if (Object.keys(loadedValidated).length > 0) {
            setValidatedRows(loadedValidated);
          }
        } catch { }

        setRawItems(itemsArray);
        setSavedRawItems(JSON.parse(JSON.stringify(itemsArray)));

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
        setDataLoadState("error");
        setDataLoadError(err instanceof Error ? err.message : "Não foi possível carregar os dados da análise.");
      } finally {
        setDataLoadState((current) => current === "loading" ? "ready" : current);
      }
    }

    loadTechnicalData();
  }, [dataReloadKey]);

  // Obter a lista de itens modificados em relação aos valores da última gravação
  const modifiedItems = useMemo(() => {
    const savedMap = new Map(savedRawItems.map((item) => [item.id, item.valLoa]));
    return rawItems.filter((item) => {
      const savedVal = savedMap.get(item.id);
      return savedVal !== undefined && Math.abs(item.valLoa - savedVal) > 0.001;
    });
  }, [rawItems, savedRawItems]);

  // Abrir o Modal de Justificativa ao clicar em Salvar
  const handleSaveEdits = () => {
    if (modifiedItems.length === 0 && removedRawItems.length === 0 && !hasChanges) {
      return;
    }
    setSaveError("");
    setSaveModalOpen(true);
  };

  const openAddExpense = (group: EditableGroup, natureza?: string) => {
    setAddExpenseGroup(group);
    const nat = natureza || group.children[0]?.natureza || group.children[0]?.elemento || "";
    setAddElementContext(natureza ? { group, natureza } : null);
    setNewExpenseNatureza(nat);
    setNewExpenseSubelemento("");
    setNewExpenseVinculo("01");
    setNewExpenseCodigoAplicacao("");
    setNewExpenseProcesso("");
    setNewExpenseValor("");
  };

  // Cancelar a edição e reverter todos os campos editados ao valor anterior (antes de abrir o modal)
  const handleCancelSaveModal = () => {
    setRawItems(JSON.parse(JSON.stringify(savedRawItems)));
    setRemovedRawItems([]);
    setHasChanges(false);
    setSaveModalOpen(false);
  };

  const handleAddExpense = () => {
    if (!addExpenseGroup) return;
    const value = parseBr(newExpenseValor);
    if (value <= 0) return;

    const naturezaFinal = addElementContext ? addElementContext.natureza : newExpenseNatureza;
    if (!naturezaFinal) return;

    const subelementoFinal = newExpenseSubelemento.trim() || "Subelemento Adicional";
    const template = addExpenseGroup.children[0];
    const naturezaCodigo = naturezaFinal.split("-")[0].trim();
    const elemento = template?.elemento || naturezaCodigo.split(".").slice(0, 4).join(".");

    const newItem: RawBudgetItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      progKey: `${addExpenseGroup.acao}|${elemento}|${subelementoFinal}`,
      secretaria: addExpenseGroup.secretaria,
      orgao: template?.orgao || addExpenseGroup.secretaria,
      unidade: template?.unidade || "01",
      programa: addExpenseGroup.programa,
      tipoAcao: getActionTypeLabel(addExpenseGroup.acao),
      acao: addExpenseGroup.acao,
      natureza: naturezaFinal,
      fonteVinculo: newExpenseVinculo || "01",
      categoriaEconomica: template?.categoriaEconomica || (naturezaCodigo.startsWith("4") ? "4 — DESPESAS DE CAPITAL" : "3 — DESPESAS CORRENTES"),
      grupoNatureza: template?.grupoNatureza || naturezaCodigo,
      elemento,
      subelemento: subelementoFinal,
      processo: newExpenseProcesso.trim() || (newExpenseCodigoAplicacao.trim() ? `CA: ${newExpenseCodigoAplicacao.trim()}` : "—"),
      codigoAplicacao: newExpenseCodigoAplicacao.trim() || undefined,
      projetoIniciado: newExpenseProjetoIniciado || undefined,
      observacao: newExpenseObservacao.trim() || undefined,
      valLdo: 0,
      valLoa: value,
    };

    setRawItems((previous) => [...previous, newItem]);
    try {
      const saved = JSON.parse(localStorage.getItem(ADDED_EXPENSES_STORAGE_KEY) || "[]") as RawBudgetItem[];
      const addedList = [...saved, newItem];
      localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify(addedList));
      void fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "painel_loa_added_expenses", valor: addedList }),
      });
    } catch {
      localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify([newItem]));
      void fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "painel_loa_added_expenses", valor: [newItem] }),
      });
    }
    setExpandedEditGroups((previous) => new Set(previous).add(addExpenseGroup.id));
    setHasChanges(true);
    setAddExpenseGroup(null);
    setAddElementContext(null);
    setNewExpenseNatureza("");
    setNewExpenseSubelemento("");
    setNewExpenseVinculo("01");
    setNewExpenseCodigoAplicacao("");
    setNewExpenseProcesso("");
    setNewExpenseValor("");
  };

  const handleAllocateBancoProjeto = (project: { secretaria: string; objeto: string; natureza: string; valor: number }) => {
    const naturezaCodigo = project.natureza.split("-")[0].trim();
    const item: RawBudgetItem = {
      id: `banco-projeto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      progKey: `banco-projeto|${project.secretaria}|${project.objeto}`,
      secretaria: project.secretaria,
      orgao: project.secretaria,
      unidade: "",
      programa: "Banco de Projetos",
      tipoAcao: getActionTypeLabel(project.objeto),
      acao: project.objeto,
      natureza: project.natureza,
      fonteVinculo: "Tesouro / Próprio",
      categoriaEconomica: naturezaCodigo.startsWith("4") ? "4 — DESPESAS DE CAPITAL" : "3 — DESPESAS CORRENTES",
      grupoNatureza: naturezaCodigo,
      elemento: naturezaCodigo.split(".").slice(0, 4).join("."),
      subelemento: "",
      processo: "—",
      valLdo: 0,
      valLoa: project.valor,
      origem: "Banco de Projetos",
      bancoProjetoKey: [project.secretaria, project.objeto, project.natureza, project.valor].join("|"),
    };
    setRawItems((previous) => [...previous, item]);
    setHasChanges(true);
  };

  const handleRemoveBancoProjeto = (item: RawBudgetItem) => {
    setRawItems((previous) => previous.filter((entry) => entry.id !== item.id));
    setHasChanges(true);
  };

  // Confirmar e Gravar Alterações + Justificativas no localStorage
  const confirmSaveEdits = async () => {
    try {
      // Separar os itens modificados em: com justificativa e sem justificativa
      const savedMap = new Map(savedRawItems.map((item) => [item.id, item.valLoa]));

      const itemsToRevert: string[] = [];
      const validJustifications: Record<string, string> = { ...justifications };

      modifiedItems.forEach((item) => {
        const text = (justifications[item.id] || "").trim();
        if (!text) {
          itemsToRevert.push(item.id);
        } else {
          validJustifications[item.id] = text;
        }
      });

      // Tratar itens excluídos: se não possuírem justificativa, restaurá-los!
      const restoredFromRemoval: RawBudgetItem[] = [];
      removedRawItems.forEach((item) => {
        const text = (justifications[item.id] || "").trim();
        if (!text) {
          restoredFromRemoval.push(item);
        } else {
          validJustifications[item.id] = text;
        }
      });

      // Atualizar lista final de itens (revertendo os sem justificativa ao valor salvo + restaurando removidos sem justificativa)
      let finalItems = rawItems.map((item) => {
        if (itemsToRevert.includes(item.id)) {
          const savedVal = savedMap.get(item.id) ?? item.valLdo;
          return { ...item, valLoa: savedVal };
        }
        return item;
      });

      if (restoredFromRemoval.length > 0) {
        finalItems = [...finalItems, ...restoredFromRemoval];
      }

      setRawItems(finalItems);
      setSavedRawItems(JSON.parse(JSON.stringify(finalItems)));
      setRemovedRawItems([]);

      setSavingState("saving");

      // Gravar no localStorage e Banco de Dados
      const customMap: Record<string, number> = {};
      finalItems.forEach((item) => {
        customMap[item.id] = item.valLoa;
      });

      localStorage.setItem("painel_loa_custom_edits_v1", JSON.stringify(customMap));
      localStorage.setItem("painel_loa_justifications_v1", JSON.stringify(validJustifications));
      setJustifications(validJustifications);

      // Persistir no Banco de Dados
      try {
        await Promise.all([
          fetch("/api/configuracoes/layout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chave: "painel_loa_custom_edits",
              valor: customMap,
            }),
          }),
          fetch("/api/configuracoes/layout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chave: "painel_loa_justifications",
              valor: validJustifications,
            }),
          }),
        ]);
      } catch (err) {
        console.error("Erro ao persistir edições no banco:", err);
      }

      setHasChanges(false);
      setSaveModalOpen(false);
      setSavingState("saved");

      if (itemsToRevert.length > 0) {
        alert(
          `${itemsToRevert.length} linha(s) sem justificativa preenchida tiveram seus valores revertidos automaticamente aos valores anteriores!`
        );
      }

      setTimeout(() => setSavingState("idle"), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Não foi possível salvar as alterações.");
      setSavingState("idle");
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
        if (fieldToIgnore !== "tipoAcao" && !match(filters.tipoAcao, item.tipoAcao)) return false;
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
      tipoAcao: ["0. Operação Especial", "1. Projeto", "2. Atividade"],
      acao: getOptions("acao", getItemsForField("acao")),
      natureza: getOptions("natureza", getItemsForField("natureza")),
      fonteVinculo: getOptions("fonteVinculo", getItemsForField("fonteVinculo")).filter(
        (opt) => {
          const trimmed = opt.trim();
          return !/^\d{4}$/.test(trimmed) && !/^\d{2}\.\d{2}$/.test(trimmed);
        }
      ),
      categoriaEconomica: getOptions("categoriaEconomica", getItemsForField("categoriaEconomica")),
      grupoNatureza: getOptions("grupoNatureza", getItemsForField("grupoNatureza")),
      elemento: getOptions("elemento", getItemsForField("elemento")),
      subelemento: getOptions("subelemento", getItemsForField("subelemento")),
      processo: getOptions("processo", getItemsForField("processo")),
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
      if (!match(filters.tipoAcao, item.tipoAcao)) return false;
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

  const tableItems = useMemo(() => {
    return filteredItems.filter((item) => {
      if (statusFilters.length > 0) {
        const original = originalValuesById.get(item.id) ?? item.valLdo;
        const adjusted = Math.abs(item.valLoa - original) > 0.001;
        const matchesFilter = statusFilters.some((filter) =>
          filter === "Ajustado" ? adjusted : filter === getStatusLabel(item.valLdo, item.valLoa)
        );
        if (!matchesFilter) return false;
      }
      if (!tableSearch) return true;
      const query = tableSearch.toLowerCase();
      return (
        item.secretaria.toLowerCase().includes(query) ||
        item.acao.toLowerCase().includes(query) ||
        item.elemento.toLowerCase().includes(query) ||
        item.natureza.toLowerCase().includes(query) ||
        item.processo.toLowerCase().includes(query) ||
        item.subelemento.toLowerCase().includes(query)
      );
    });
  }, [filteredItems, originalValuesById, statusFilters, tableSearch]);

  const editableGroups = useMemo<EditableGroup[]>(() => {
    const groups = new Map<string, EditableGroup>();

    tableItems.forEach((item) => {
      const groupKey = [item.programa, item.acao].join("|");
      const group = groups.get(groupKey) ?? {
        id: `edit-group-${groupKey}`,
        secretaria: item.secretaria,
        programa: item.programa,
        acao: item.acao,
        elemento: "Despesas da ação",
        fonteVinculo: item.fonteVinculo,
        processo: item.processo,
        children: [],
        valLdo: 0,
        valLoa: 0,
      };
      group.children.push(item);
      group.valLdo += item.valLdo;
      group.valLoa += item.valLoa;
      groups.set(groupKey, group);
    });

    const getAdjusted = (item: RawBudgetItem) => {
      const original = originalValuesById.get(item.id) ?? item.valLdo;
      return Math.abs(item.valLoa - original) > 0.001 ? 1 : 0;
    };
    const compareText = (left: string, right: string) => left.localeCompare(right, "pt-BR", { numeric: true, sensitivity: "base" });
    const compareGroup = (left: EditableGroup, right: EditableGroup) => {
      const leftFromBank = left.children.some((item) => item.origem === "Banco de Projetos");
      const rightFromBank = right.children.some((item) => item.origem === "Banco de Projetos");
      if (leftFromBank !== rightFromBank) return leftFromBank ? 1 : -1;
      let result = 0;
      if (tableSort.column === "acao") result = compareText(left.acao, right.acao);
      else if (tableSort.column === "elemento") result = compareText(left.elemento, right.elemento);
      else if (tableSort.column === "valLdo") result = left.valLdo - right.valLdo;
      else if (tableSort.column === "valLoa") result = left.valLoa - right.valLoa;
      else if (tableSort.column === "diff") result = (left.valLoa - left.valLdo) - (right.valLoa - right.valLdo);
      else if (tableSort.column === "status") result = compareText(getStatusLabel(left.valLdo, left.valLoa), getStatusLabel(right.valLdo, right.valLoa));
      else result = left.children.reduce((sum, item) => sum + getAdjusted(item), 0) - right.children.reduce((sum, item) => sum + getAdjusted(item), 0);
      return tableSort.direction === "asc" ? result : -result;
    };
    const compareChild = (left: RawBudgetItem, right: RawBudgetItem) => {
      let result = 0;
      if (tableSort.column === "acao") result = compareText(left.natureza || left.elemento, right.natureza || right.elemento);
      else if (tableSort.column === "elemento") result = compareText(left.elemento, right.elemento);
      else if (tableSort.column === "valLdo") result = left.valLdo - right.valLdo;
      else if (tableSort.column === "valLoa") result = left.valLoa - right.valLoa;
      else if (tableSort.column === "diff") result = (left.valLoa - left.valLdo) - (right.valLoa - right.valLdo);
      else if (tableSort.column === "status") result = compareText(getStatusLabel(left.valLdo, left.valLoa), getStatusLabel(right.valLdo, right.valLoa));
      else result = getAdjusted(left) - getAdjusted(right);
      return tableSort.direction === "asc" ? result : -result;
    };

    return Array.from(groups.values()).map((group) => ({
      ...group,
      children: [...group.children].sort(compareChild),
    })).sort(compareGroup);
  }, [originalValuesById, tableItems, tableSort]);

  const totalTablePages = useMemo(
    () => Math.max(1, Math.ceil(editableGroups.length / tablePageSize)),
    [editableGroups.length, tablePageSize]
  );

  const paginatedEditableGroups = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return editableGroups.slice(start, start + tablePageSize);
  }, [editableGroups, tablePage, tablePageSize]);

  // Métricas Recalculadas Instantaneamente para os Cards Superiores
  const metrics = useMemo(() => {
    let valLdoTotal = 0;
    let valLoaTotal = 0;
    const acoesSet = new Set<string>();
    const naturezasSet = new Set<string>();

    tableItems.forEach((item) => {
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
  }, [tableItems]);

  // Agrupamento dos Sub-elementos dos itens filtrados
  const subelementosBreakdown = useMemo(() => {
    const map = new Map<string, { subelemento: string; acao: string; secretaria: string; natureza: string; fonteVinculo: string; codigoAplicacao: string; processo: string; projetoIniciado: string; observacao: string; ldo: number; loa: number; diff: number; count: number }>();

    filteredItems.forEach((item) => {
      const name = item.subelemento && item.subelemento.trim() !== "" ? item.subelemento : item.natureza || "Outros / Sem Subelemento";
      const vinculo = item.fonteVinculo || "01";
      const codApp = item.codigoAplicacao || "";
      const proc = item.processo && item.processo !== "—" ? item.processo : "";
      const key = `${item.secretaria}_${item.acao}_${item.natureza || ""}_${vinculo}_${codApp}_${proc}_${name}`;

      if (!map.has(key)) {
        map.set(key, {
          subelemento: name,
          acao: item.acao || "",
          secretaria: item.secretaria || "",
          natureza: item.natureza || "",
          fonteVinculo: vinculo,
          codigoAplicacao: codApp,
          processo: proc,
          projetoIniciado: item.projetoIniciado || "",
          observacao: item.observacao || "",
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

    const items = Array.from(map.values());
    if (cardSubelementosAcao) {
      return items.filter((i) => i.acao === cardSubelementosAcao).sort((a, b) => b.loa - a.loa);
    }
    return items.sort((a, b) => b.loa - a.loa);
  }, [filteredItems, cardSubelementosAcao]);

  // Ações disponíveis nos sub-elementos para o filtro do card
  const availableSubelementosAcoes = useMemo(() => {
    const set = new Set<string>();
    filteredItems.forEach((item) => {
      if (item.acao) set.add(item.acao);
    });
    return Array.from(set).sort();
  }, [filteredItems]);

  // Ações disponíveis nas iniciativas estratégicas para o filtro do card
  const availableIniciativasAcoes = useMemo(() => {
    const set = new Set<string>();
    iniciativas.forEach((ini) => {
      if (ini.acao) set.add(ini.acao);
    });
    return Array.from(set).sort();
  }, [iniciativas]);

  // Iniciativas Estratégicas Filtradas por Ação do Card
  const displayIniciativas = useMemo(() => {
    if (cardIniciativasAcao) {
      return iniciativas.filter((ini) => ini.acao === cardIniciativasAcao);
    }
    return iniciativas;
  }, [iniciativas, cardIniciativasAcao]);

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

  const applyGroupLoa = (group: EditableGroup, newTotal: number) => {
    const currentTotal = group.children.reduce((sum, item) => sum + item.valLoa, 0);
    const basisTotal = currentTotal > 0
      ? currentTotal
      : group.children.reduce((sum, item) => sum + item.valLdo, 0);
    const equalShare = group.children.length ? newTotal / group.children.length : 0;
    let assigned = 0;
    const allocations = new Map<string, number>();

    group.children.forEach((item, index) => {
      const basis = currentTotal > 0 ? item.valLoa : item.valLdo;
      const value = index === group.children.length - 1
        ? Math.max(0, Math.round((newTotal - assigned) * 100) / 100)
        : Math.max(0, Math.round((basisTotal > 0 ? newTotal * (basis / basisTotal) : equalShare) * 100) / 100);
      assigned += value;
      allocations.set(item.id, value);
    });

    setRawItems((previous) => previous.map((item) => {
      const value = allocations.get(item.id);
      return value === undefined ? item : { ...item, valLoa: value };
    }));
    setHasChanges(true);
  };

  const applyNatureLoa = (items: RawBudgetItem[], newTotal: number) => {
    const currentTotal = items.reduce((sum, item) => sum + item.valLoa, 0);
    const basisTotal = currentTotal > 0 ? currentTotal : items.reduce((sum, item) => sum + item.valLdo, 0);
    const equalShare = items.length ? newTotal / items.length : 0;
    let assigned = 0;
    const allocations = new Map<string, number>();
    items.forEach((item, index) => {
      const basis = currentTotal > 0 ? item.valLoa : item.valLdo;
      const value = index === items.length - 1
        ? Math.max(0, Math.round((newTotal - assigned) * 100) / 100)
        : Math.max(0, Math.round((newTotal * (basisTotal > 0 ? basis / basisTotal : 0) || equalShare) * 100) / 100);
      assigned += value;
      allocations.set(item.id, value);
    });
    setRawItems((previous) => previous.map((item) => allocations.has(item.id) ? { ...item, valLoa: allocations.get(item.id)! } : item));
    setHasChanges(true);
  };

  const getNatureLabel = (value: string, fallback: string) => {
    const label = (value || fallback || "Outros").trim();
    const separator = label.indexOf("-");
    return separator >= 0 ? label.slice(0, separator).trim() + " — " + label.slice(separator + 1).trim() : label;
  };

  const getSubelementLabel = (item: RawBudgetItem) => {
    const subelement = item.subelemento.trim();
    if (subelement) return subelement;
    const label = (item.natureza || item.elemento || "Outros").trim();
    const separator = label.indexOf("-");
    return separator >= 0 ? label.slice(separator + 1).trim() : label;
  };

  const availableElements = useMemo(() => {
    if (!addElementContext) return [];
    const natureCode = addElementContext.natureza.split("-")[0].trim();
    const elements = new Map<string, { code: string; label: string }>();
    addElementContext.group.children
      .filter((item) => (item.natureza || item.elemento).split("-")[0].trim() === natureCode)
      .forEach((item) => {
        const label = getSubelementLabel(item);
        const match = label.match(/^(\d{1,2})\s*[-–]\s*(.+)$/);
        const code = match?.[1] ?? "";
        const description = match?.[2]?.trim() ?? label;
        const key = `${code}|${description}`;
        if (description && !elements.has(key)) elements.set(key, { code, label: description });
      });
    return [...elements.values()];
  }, [addElementContext]);

  const removeSubelement = async (item: RawBudgetItem) => {
    if (!window.confirm("Remover este subelemento da Natureza da Despesa?")) return;

    // 1. Atualizar o estado da tela removendo o item
    setRawItems((previous) => previous.filter((entry) => entry.id !== item.id));
    setSavedRawItems((previous) => previous.filter((entry) => entry.id !== item.id));

    // 2. Se for um item adicionado manualmente, remover do storage de adicionados
    try {
      const savedAdded = (JSON.parse(localStorage.getItem(ADDED_EXPENSES_STORAGE_KEY) || "[]") as RawBudgetItem[])
        .filter((entry) => entry.id !== item.id);
      localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify(savedAdded));
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chave: "painel_loa_added_expenses",
          valor: savedAdded,
        }),
      });
    } catch { }

    // 3. Registrar o item na lista de itens removidos permanentemente
    try {
      const savedRemoved = (JSON.parse(localStorage.getItem("painel_loa_removed_expenses_v1") || "[]") as string[]);
      if (!savedRemoved.includes(item.id)) {
        const nextRemoved = [...savedRemoved, item.id];
        localStorage.setItem("painel_loa_removed_expenses_v1", JSON.stringify(nextRemoved));

        // Sincronizar com o banco de dados
        await fetch("/api/configuracoes/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chave: "painel_loa_removed_expenses",
            valor: nextRemoved,
          }),
        });
      }
    } catch { }

    // 4. Se tiver edição de valor gravada para esse ID, limpar
    try {
      const customMap = JSON.parse(localStorage.getItem("painel_loa_custom_edits_v1") || "{}");
      if (customMap[item.id] !== undefined) {
        delete customMap[item.id];
        localStorage.setItem("painel_loa_custom_edits_v1", JSON.stringify(customMap));
        await fetch("/api/configuracoes/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chave: "painel_loa_custom_edits",
            valor: customMap,
          }),
        });
      }
    } catch { }

    setRemovedRawItems((prev) => [...prev.filter((entry) => entry.id !== item.id), item]);
    setHasChanges(false);
  };

  const handleModalKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, dialogRef: RefObject<HTMLDivElement | null>, onClose: () => void) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled])")];
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

  const renderSortHeader = (column: TableSortColumn, label: string, alignment = "text-left") => (
    <button
      type="button"
      onClick={() => toggleTableSort(column)}
      className={`inline-flex items-center gap-1 font-bold hover:text-primary transition-colors ${alignment}`}
      aria-label={`Ordenar por ${label}`}
    >
      <span>{label}</span>
      <span className={`material-symbols-outlined text-[15px] ${tableSort.column === column ? "text-primary" : "text-outline"}`}>
        {tableSort.column === column ? (tableSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
      </span>
    </button>
  );

  // Funções de exportação
  const exportToExcel = () => {
    // 1. Aba: Visão Geral das Ações Orçamentárias
    const acoesData = editableGroups.map((group) => {
      const ldoData = getLdoPlanningForGroup(group);
      return {
        Secretaria: group.secretaria,
        Programa: group.programa,
        Ação: group.acao,
        "Valor LDO (R$)": group.valLdo,
        "Valor LOA (R$)": group.valLoa,
        "Diferença Nominal (R$)": group.valLoa - group.valLdo,
        "Variação (%)": group.valLdo > 0 ? ((group.valLoa - group.valLdo) / group.valLdo) * 100 : 0,
        Status: getStatusInfo(group.valLdo, group.valLoa).label,
        Indicador: ldoData.indicador || "Não informado",
        "Unidade de Medida": ldoData.unidadeMedida || "Unidade",
        "Meta Física 2027": ldoData.custoFisico2027 ?? 0,
      };
    });

    // 2. Aba: Detalhamento Analítico Completo
    const analiticoData = editableGroups.flatMap((group) =>
      group.children.map((item) => {
        const original = originalValuesById.get(item.id) ?? item.valLdo;
        const adjusted = Math.abs(item.valLoa - original) > 0.001;
        return {
          Secretaria: item.secretaria,
          Programa: item.programa,
          Ação: item.acao,
          "Natureza da Despesa": item.natureza || item.elemento,
          Elemento: item.elemento,
          Subelemento: item.subelemento || "—",
          "Fonte/Vínculo": item.fonteVinculo || "01",
          Processo: item.processo || "—",
          "Valor Original (R$)": original,
          "Valor LOA Editável (R$)": item.valLoa,
          "Diferença (R$)": item.valLoa - original,
          "Item Ajustado": adjusted ? "SIM" : "NÃO",
          "Justificativa do Ajuste": (justifications[item.id] || "").trim() || "—",
        };
      })
    );

    // 3. Aba: Memória de Ajustes e Exclusões (Auditoria)
    const pendingItems = [
      ...modifiedItems.map((item) => ({ item, isRemoved: false })),
      ...removedRawItems.map((item) => ({ item, isRemoved: true })),
    ];
    const auditoriaData = pendingItems.map(({ item, isRemoved }) => {
      const origVal = originalValuesById.get(item.id) ?? item.valLdo;
      return {
        Tipo: isRemoved ? "EXCLUSÃO DE SUBELEMENTO" : "ALTERAÇÃO DE VALOR",
        Secretaria: item.secretaria,
        Programa: item.programa,
        Ação: item.acao,
        "Natureza da Despesa": item.natureza || item.elemento,
        Subelemento: item.subelemento || "—",
        "Fonte/Vínculo": item.fonteVinculo || "01",
        "Valor Original (R$)": origVal,
        "Novo Valor LOA (R$)": isRemoved ? 0 : item.valLoa,
        "Diferença (R$)": isRemoved ? -origVal : item.valLoa - origVal,
        "Justificativa Técnica": (justifications[item.id] || "").trim() || "Sem justificativa detalhada",
      };
    });

    const workbook = XLSX.utils.book_new();
    const wsAcoes = XLSX.utils.json_to_sheet(acoesData);
    const wsAnalitico = XLSX.utils.json_to_sheet(analiticoData);
    XLSX.utils.book_append_sheet(workbook, wsAcoes, "Resumo_Acoes_LOA");
    XLSX.utils.book_append_sheet(workbook, wsAnalitico, "Detalhamento_Analitico");

    if (auditoriaData.length > 0) {
      const wsAuditoria = XLSX.utils.json_to_sheet(auditoriaData);
      XLSX.utils.book_append_sheet(workbook, wsAuditoria, "Memoria_Ajustes");
    }

    XLSX.writeFile(workbook, "relatorio-tecnico-orcamento-osasco-2027.xlsx");
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const reportDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date());
    type ReportCell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
    type ReportRow = ReportCell[];

    // Carregar imagem do brasão para converter em base64 se disponível
    try {
      const img = new Image();
      img.src = "/brasao.png";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      if (img.complete && img.naturalWidth > 0) {
        doc.addImage(img, "PNG", margin, 6, 20, 20);
      }
    } catch { }

    const programs = Array.from(editableGroups.reduce((map, group) => {
      const key = group.programa || "Programa não informado";
      map.set(key, [...(map.get(key) ?? []), group]);
      return map;
    }, new Map<string, EditableGroup[]>()));
    const secretariats = [...new Set(editableGroups.map((group) => group.secretaria).filter(Boolean))];
    const reportSecretariat = filters.secretaria.length === 1
      ? filters.secretaria[0]
      : secretariats.length === 1
        ? secretariats[0]
        : secretariats.length > 0 ? secretariats.join(" · ") : "Prefeitura do Município de Osasco";

    // Cabeçalho Institucional
    doc.setFillColor(0, 52, 111);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("PREFEITURA DO MUNICÍPIO DE OSASCO", margin + 24, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`SECRETARIA: ${reportSecretariat.toUpperCase()}`, margin + 24, 17);
    doc.text(`RELATÓRIO TÉCNICO ORÇAMENTÁRIO — ANÁLISE LDO x LOA 2027  •  Emitido em: ${reportDate}`, margin + 24, 23);

    // Sumário Executivo
    doc.setTextColor(24, 28, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("1. Detalhamento Analítico e Metas Físicas da LOA 2027", margin, 36);

    let cursorY = 40;
    programs.forEach(([programa, groups], programIndex) => {
      if (cursorY > pageHeight - 45) { doc.addPage(); cursorY = 18; }
      const programHasAdjustment = groups.some((group) => group.children.some((item) => {
        const original = originalValuesById.get(item.id) ?? item.valLdo;
        return Math.abs(item.valLoa - original) > 0.001;
      }));
      doc.setTextColor(0, 52, 111);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`Programa: ${programa}${programHasAdjustment ? "  • [POSSUI AJUSTES TÉCNICOS]" : ""}`, margin, cursorY);
      doc.setDrawColor(0, 52, 111);
      doc.setLineWidth(0.3);
      doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);

      const reportBody: ReportRow[] = [];
      groups.forEach((group) => {
        const ldoData = getLdoPlanningForGroup(group);
        const totalFill = [238, 243, 250];
        const totalText = [0, 52, 111];
        reportBody.push([
          { content: `AÇÃO: ${group.acao}\nMeta Física 2027: ${ldoData.custoFisico2027 ?? "—"} (${ldoData.unidadeMedida || "unid."}) • Indicador: ${ldoData.indicador || "—"}`, styles: { fontStyle: "bold", fillColor: totalFill, textColor: totalText } },
          { content: "TOTAL DA AÇÃO", styles: { fontStyle: "bold", fillColor: totalFill, textColor: totalText } },
          { content: currency.format(group.valLdo), styles: { fontStyle: "bold", fillColor: totalFill, textColor: totalText } },
          { content: currency.format(group.valLoa), styles: { fontStyle: "bold", fillColor: totalFill, textColor: totalText } },
          { content: currency.format(group.valLoa - group.valLdo), styles: { fontStyle: "bold", fillColor: totalFill, textColor: totalText } },
          { content: getStatusInfo(group.valLdo, group.valLoa).label, styles: { fontStyle: "bold", fillColor: totalFill, textColor: totalText } },
        ]);
        group.children.forEach((item) => {
          const original = originalValuesById.get(item.id) ?? item.valLdo;
          const adjusted = Math.abs(item.valLoa - original) > 0.001;
          const diff = item.valLoa - original;
          reportBody.push([
            `  ↳ ${item.subelemento || item.elemento || "Dotação"}${item.fonteVinculo ? ` (Vínculo: ${item.fonteVinculo})` : ""}${item.processo && item.processo !== "—" ? ` [Proc: ${item.processo}]` : ""}`,
            item.natureza || item.elemento,
            currency.format(item.valLdo),
            currency.format(item.valLoa),
            diff > 0 ? `+${currency.format(diff)}` : currency.format(diff),
            adjusted ? "Ajustado" : "Conforme LDO",
          ]);
          if (adjusted && justifications[item.id]) {
            reportBody.push([{
              content: `Motivação Técnica / Justificativa: ${justifications[item.id]}`,
              colSpan: 6,
              styles: { fontStyle: "italic", textColor: [91, 63, 12], fillColor: [255, 250, 235] },
            }]);
          }
        });
      });

      autoTable(doc, {
        startY: cursorY + 6,
        margin: { left: margin, right: margin },
        head: [["AÇÃO / SUBELEMENTO & METAS", "NATUREZA DA DESPESA", "VALOR LDO", "VALOR LOA", "DIFERENÇA", "STATUS"]],
        body: reportBody,
        theme: "grid",
        headStyles: { fillColor: [235, 238, 242], textColor: [20, 24, 30], fontStyle: "bold", fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [35, 38, 42], cellPadding: 2, valign: "middle" },
        alternateRowStyles: { fillColor: [252, 252, 253] },
        columnStyles: {
          0: { cellWidth: 85 },
          1: { cellWidth: 70 },
          2: { cellWidth: 28, halign: "right" },
          3: { cellWidth: 28, halign: "right" },
          4: { cellWidth: 28, halign: "right" },
          5: { cellWidth: 30, halign: "center" },
        },
      });
      cursorY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY + 40;
      if (programIndex < programs.length - 1) cursorY += 8;
    });

    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 55;
    const signatureY = Math.min(finalY + 22, pageHeight - 24);
    doc.setDrawColor(90, 95, 102);
    doc.setLineWidth(0.3);
    doc.line(margin, signatureY, margin + 70, signatureY);
    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin, signatureY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(35, 38, 42);
    doc.text("Técnico Responsável pelo Planejamento", margin, signatureY + 4, { align: "left" });
    doc.text("Secretário / Ordenador de Despesa", pageWidth - margin, signatureY + 4, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(90, 95, 102);
    doc.text("Assinatura e Matrícula", margin, signatureY + 8);
    doc.text("Assinatura e Carimbo", pageWidth - margin, signatureY + 8, { align: "right" });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(6.5);
      doc.setTextColor(120, 125, 130);
      doc.text(`Prefeitura de Osasco • Painel LOA 2027 • Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: "right" });
    }
    doc.save("relatorio-tecnico-ldo-loa-osasco-2027.pdf");
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
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isSelected
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
    <div className="space-y-6 pb-12 print:space-y-4 print:p-0">
      {/* Cabeçalho Oficial exclusivo para Impressão com Brasão de Osasco */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-primary/80 pb-4 mb-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brasao.png" alt="Brasão de Osasco" className="h-16 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold font-headline text-on-surface uppercase tracking-wide">
              Prefeitura do Município de Osasco
            </h1>
            <p className="text-xs font-semibold text-on-surface-variant">
              Secretaria de Planejamento e Gestão • Departamento de Orçamento
            </p>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Análise Técnica do Orçamento — LDO x LOA 2027
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-on-surface-variant">
          <p>Data de Emissão: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}</p>
          <p>Relatório de Planejamento e Metas Físicas</p>
        </div>
      </div>

      {/* 1. Subtítulo e Breadcrumb */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brasao.png" alt="Brasão de Osasco" className="h-12 w-auto object-contain shrink-0 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
              <span>Planejamento Orçamentário</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Análise Técnica LDO x LOA</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
              Análise LOA (subelemento)
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Compare em tempo real os valores da LDO e LOA identificando diferenças, suplementações, reduções e distribuição orçamentária.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCardsConfigModalOpen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-surface border border-outline-variant text-on-surface hover:bg-surface-container transition-colors shadow-sm sm:w-auto"
          >
            <span className="material-symbols-outlined text-base text-primary">dashboard_customize</span>
            Personalizar Cards
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-surface border border-outline-variant text-primary hover:bg-surface-container transition-colors shadow-sm sm:w-auto"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Insights Inteligentes
          </button>
        </div>
      </header>

      {dataLoadState === "loading" && rawItems.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant" role="status" aria-live="polite">
          <span className="material-symbols-outlined animate-spin text-primary" aria-hidden="true">progress_activity</span>
          <span>Carregando dados da análise...</span>
        </div>
      )}
      {dataLoadState === "error" && (
        <div className="flex flex-col gap-3 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div>
            <p className="font-semibold">Não foi possível carregar todos os dados da análise.</p>
            <p className="mt-1 text-xs">{dataLoadError || "Verifique a conexão e tente novamente."}</p>
          </div>
          <button type="button" onClick={() => setDataReloadKey((value) => value + 1)} className="min-h-11 shrink-0 rounded-lg border border-error/40 bg-surface px-4 py-2 text-xs font-bold text-on-error-container hover:bg-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Renderização Dinâmica de Seções e Cards Baseada em layoutConfig */}
      {layoutConfig.sectionsOrder.map((sectionId) => {
        if (layoutConfig.visibility[sectionId] === false) return null;

        // Seção 1: Painel da Receita Orçamentária
        if (sectionId === "painel-receita") {
          return (
            <div key="painel-receita" className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm text-emerald-600">account_balance_wallet</span>
                <span>Painel da Receita Orçamentária</span>
              </div>
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {layoutConfig.receitaKpisOrder.map((kpiId) => {
                  if (layoutConfig.visibility[kpiId] === false) return null;

                  if (kpiId === "rec-ldo") {
                    return (
                      <div key="rec-ldo" className="glass-card bg-surface p-4 border-t-2 border-t-emerald-600 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LDO</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {currency.format(ldoReceitaTotal)}
                        </h3>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">Receita Planejada LDO</p>
                      </div>
                    );
                  }

                  if (kpiId === "rec-loa") {
                    return (
                      <div key="rec-loa" className="glass-card bg-surface p-4 border-t-2 border-t-blue-600 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LOA</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {currency.format(0)}
                        </h3>
                        <p className="text-[10px] text-blue-700 font-semibold mt-1">Receita Fixada LOA</p>
                      </div>
                    );
                  }

                  if (kpiId === "rec-diff") {
                    const recLdo = ldoReceitaTotal;
                    const recLoa = 0;
                    const recDiff = recLoa - recLdo;
                    const isGreater = recDiff > 0;
                    const isSmaller = recDiff < 0;

                    return (
                      <div key="rec-diff" className={`glass-card bg-surface p-4 border-t-2 ${isGreater ? "border-t-rose-500 bg-rose-50/20" : isSmaller ? "border-t-emerald-500" : "border-t-gray-400"} shadow-sm`}>
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diferença (LOA - LDO)</p>
                        <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${isGreater ? "text-rose-600" : isSmaller ? "text-emerald-600" : "text-on-surface"}`}>
                          {isGreater ? "▲" : isSmaller ? "▼" : "—"} {currency.format(Math.abs(recDiff))}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant mt-1">
                          {isGreater ? "⚠️ LOA maior que a LDO (+ Excesso)" : isSmaller ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
                        </p>
                      </div>
                    );
                  }

                  if (kpiId === "rec-exec") {
                    return (
                      <div key="rec-exec" className="glass-card bg-surface p-4 border-t-2 border-t-purple-600 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Execução Planejamento</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {percent.format(ldoReceitaTotal > 0 ? 0 : 1)}
                        </h3>
                        <p className="text-[10px] text-purple-700 font-semibold mt-1">Transformado em LOA</p>
                      </div>
                    );
                  }

                  if (kpiId === "rec-maior") {
                    return (
                      <div key="rec-maior" className="glass-card bg-surface p-4 border-t-2 border-t-teal-600 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Maior Arrecadação LDO</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {currency.format(0)}
                        </h3>
                        <p className="text-[10px] text-teal-700 font-semibold mt-1">Maior Fonte LDO</p>
                      </div>
                    );
                  }

                  if (kpiId === "rec-fontes") {
                    return (
                      <div key="rec-fontes" className="glass-card bg-surface p-4 border-t-2 border-t-amber-600 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Fontes / Vínculos</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {integer.format(61)}
                        </h3>
                        <p className="text-[10px] text-amber-700 font-semibold mt-1">Fontes de Recurso LDO</p>
                      </div>
                    );
                  }

                  return null;
                })}
              </section>
            </div>
          );
        }

        // Seção 2: Painel da Despesa Orçamentária
        if (sectionId === "painel-despesa") {
          return (
            <div key="painel-despesa" className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm text-blue-600">payments</span>
                <span>Painel da Despesa Orçamentária</span>
              </div>
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {layoutConfig.despesaKpisOrder.map((kpiId) => {
                  if (layoutConfig.visibility[kpiId] === false) return null;

                  if (kpiId === "desp-ldo") {
                    return (
                      <div key="desp-ldo" className="glass-card bg-surface p-4 border-t-2 border-t-emerald-500 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LDO</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {currency.format(metrics.valLdoTotal)}
                        </h3>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">Despesa Planejada</p>
                      </div>
                    );
                  }

                  if (kpiId === "desp-loa") {
                    return (
                      <div key="desp-loa" className="glass-card bg-surface p-4 border-t-2 border-t-blue-500 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Previsto LOA</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {currency.format(metrics.valLoaTotal)}
                        </h3>
                        <p className="text-[10px] text-blue-700 font-semibold mt-1">Despesa Fixada</p>
                      </div>
                    );
                  }

                  if (kpiId === "desp-diff") {
                    return (
                      <div key="desp-diff" className={`glass-card bg-surface p-4 border-t-2 ${metrics.diff > 0 ? "border-t-rose-500 bg-rose-50/20" : metrics.diff < 0 ? "border-t-emerald-500" : "border-t-gray-400"} shadow-sm`}>
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Diferença (LOA - LDO)</p>
                        <h3 className={`text-lg font-headline font-extrabold flex items-center gap-1 ${metrics.diff > 0 ? "text-rose-600" : metrics.diff < 0 ? "text-emerald-600" : "text-on-surface"}`}>
                          {metrics.diff > 0 ? "▲" : metrics.diff < 0 ? "▼" : "—"} {currency.format(Math.abs(metrics.diff))}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant mt-1">
                          {metrics.diff > 0 ? "⚠️ LOA maior que a LDO (+ Excesso)" : metrics.diff < 0 ? "LOA menor que a LDO (- Redução)" : "Valores equivalentes"}
                        </p>
                      </div>
                    );
                  }

                  if (kpiId === "desp-expectativa") {
                    return (
                      <div key="desp-expectativa" className="glass-card bg-surface p-4 border-t-2 border-t-purple-500 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor Expectativa LOA</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {currency.format(loaExpectativaTotal)}
                        </h3>
                        <p className="text-[10px] text-purple-700 font-semibold mt-1">Expectativa LOA Fixada</p>
                      </div>
                    );
                  }

                  if (kpiId === "desp-exec") {
                    return (
                      <div key="desp-exec" className="glass-card bg-surface p-4 border-t-2 border-t-teal-500 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Execução Planejamento</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {percent.format(metrics.percentExec / 100)}
                        </h3>
                        <p className="text-[10px] text-teal-700 font-semibold mt-1">Transformado em LOA</p>
                      </div>
                    );
                  }

                  if (kpiId === "desp-naturezas") {
                    return (
                      <div key="desp-naturezas" className="glass-card bg-surface p-4 border-t-2 border-t-amber-500 shadow-sm">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total de Naturezas</p>
                        <h3 className="text-lg font-headline font-extrabold text-on-surface">
                          {integer.format(metrics.totalNaturezas)}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant mt-1">Classificações econômicas</p>
                      </div>
                    );
                  }

                  return null;
                })}
              </section>
            </div>
          );
        }

        // Seção 3: Filtros Avançados Orçamentários
        if (sectionId === "filtros-avancados") {
          return (
            <section key="filtros-avancados" className="glass-card p-5 bg-surface border border-outline-variant space-y-4">
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

              {/* Grade de Filtros Popover Multi-Select */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(Object.keys(filterOptions) as Array<keyof typeof filterOptions>)
                  .filter((key) => key !== "orgao")
                  .map((key) => {
                    const labels: Record<string, string> = {
                      secretaria: "Secretaria",
                      unidade: "Unidade",
                      programa: "Programa",
                      tipoAcao: "Tipo de Ação",
                      acao: "Ação",
                      natureza: "Natureza",
                      fonteVinculo: "Fonte / Vínculo",
                      categoriaEconomica: "Cat. Despesa",
                      grupoNatureza: "Grupo Despesa",
                      elemento: "Mod. Aplicação",
                      subelemento: "Subelemento",
                      processo: "Processo",
                    };

                    const fieldLabel = labels[key] || key;
                    const selectedValues = (filters[key] || []) as string[];
                    const selectedCount = selectedValues.length;
                    const allOptions = filterOptions[key] || [];
                    const searchQ = (filterSearchQuery[key] || "").toLowerCase();
                    const visibleOptions = allOptions.filter((opt) => opt.toLowerCase().includes(searchQ));
                    const isOpen = openFilterKey === key;

                    return (
                      <div key={key} className="relative flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-on-surface-variant flex items-center justify-between">
                          <span>{fieldLabel}</span>
                          {selectedCount > 0 && (
                            <span className="text-[10px] text-primary font-extrabold">{selectedCount}</span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => setOpenFilterKey(isOpen ? null : key)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1 transition-colors w-full font-medium ${selectedCount
                              ? "bg-primary/10 border-primary font-bold text-primary"
                              : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container/60"
                            }`}
                        >
                          <span className="truncate">
                            {selectedCount === 0
                              ? "Todos"
                              : selectedCount === 1
                                ? selectedValues[0]
                                : `${selectedCount} sel.`}
                          </span>
                          <span className="material-symbols-outlined text-xs shrink-0">
                            {isOpen ? "expand_less" : "expand_more"}
                          </span>
                        </button>

                        {isOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenFilterKey(null)}
                            />
                            <div className="absolute left-0 top-full mt-1 w-64 max-w-xs bg-surface rounded-xl shadow-2xl border border-outline-variant p-2.5 z-40 space-y-2 animate-in fade-in zoom-in-95">
                              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
                                <span className="text-[11px] font-bold text-on-surface">Filtrar {fieldLabel}</span>
                                {selectedCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({ ...prev, [key]: [] }));
                                    }}
                                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>

                              <input
                                type="text"
                                placeholder={`Buscar ${fieldLabel.toLowerCase()}...`}
                                value={filterSearchQuery[key] || ""}
                                onChange={(e) =>
                                  setFilterSearchQuery((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                className="w-full px-2 py-1 text-xs rounded-md border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              />

                              <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                                {visibleOptions.length === 0 ? (
                                  <p className="text-[11px] text-on-surface-variant p-2 text-center">Nenhuma opção encontrada</p>
                                ) : (
                                  visibleOptions.map((opt) => {
                                    const isChecked = selectedValues.includes(opt);
                                    return (
                                      <label
                                        key={opt}
                                        className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${isChecked
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "hover:bg-surface-container/60 text-on-surface"
                                          }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            setFilters((prev) => {
                                              const current = (prev[key] || []) as string[];
                                              return {
                                                ...prev,
                                                [key]: isChecked
                                                  ? current.filter((v) => v !== opt)
                                                  : [...current, opt],
                                              };
                                            });
                                          }}
                                          className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                                        />
                                        <span className="truncate min-w-0" title={opt}>{opt}</span>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Badges de Filtros Ativos */}
              {(() => {
                const activeFilterCount =
                  Object.keys(filterOptions)
                    .filter((k) => k !== "orgao")
                    .reduce((sum, k) => sum + (filters[k as keyof TechnicalFilterState]?.length || 0), 0) +
                  Number(Boolean(filters.search));

                if (!activeFilterCount) return null;

                const labelsMap: Record<string, string> = {
                  secretaria: "Secretaria",
                  unidade: "Unidade",
                  programa: "Programa",
                  tipoAcao: "Tipo de Ação",
                  acao: "Ação",
                  natureza: "Natureza",
                  fonteVinculo: "Fonte / Vínculo",
                  categoriaEconomica: "Cat. Despesa",
                  grupoNatureza: "Grupo Despesa",
                  elemento: "Mod. Aplicação",
                  subelemento: "Subelemento",
                  processo: "Processo",
                };

                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/40">
                    <span className="text-[11px] font-bold text-on-surface-variant mr-1">Filtros ativos:</span>
                    {(Object.keys(filterOptions) as Array<keyof typeof filterOptions>)
                      .filter((k) => k !== "orgao")
                      .flatMap((k) =>
                        ((filters[k] || []) as string[]).map((val) => (
                          <span
                            key={`${k}-${val}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20"
                          >
                            <strong>{labelsMap[k] || k}:</strong> {val}
                            <button
                              type="button"
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  [k]: (prev[k] as string[]).filter((v) => v !== val),
                                }));
                              }}
                              className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    {filters.search && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                        <strong>Busca:</strong> "{filters.search}"
                        <button
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                          className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                );
              })()}
            </section>
          );
        }

        // Seção 4: Estrutura Hierárquica (Pivot Table Tree View)
        if (sectionId === "estrutura-hierarquica") {
          return (
            <div key="estrutura-hierarquica" className="glass-card p-5 bg-surface border border-outline-variant flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant">
                <div>
                  <h3 className="text-sm font-headline font-bold text-on-surface">Estrutura Hierárquica (Pivot)</h3>
                  <p className="text-[11px] text-on-surface-variant">Navegação em árvore da distribuição orçamentária</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
          );
        }

        // Seção 5: Detalhamento Analítico Editável
        if (sectionId === "detalhamento-analitico") {
          return (
            <div key="detalhamento-analitico" className="glass-card p-5 bg-surface border border-outline-variant flex flex-col">
              {/* Barra Superior da Tabela */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-headline font-bold text-on-surface">Detalhamento Analítico Editável</h3>
                    <p className="text-[11px] text-on-surface-variant">Dê duplo clique ou edite os valores diretamente nas células</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar ação, elemento, subelemento ou processo..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface w-56"
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 font-semibold transition-colors bg-surface ${statusFilters.length > 0
                          ? "border-primary text-primary bg-primary/5 font-bold"
                          : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">filter_alt</span>
                      <span>
                        {statusFilters.length === 0
                          ? "Status/Ajustado"
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
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Filtrar por Status/Ajustado</span>
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
                            { label: "Ajustado", badge: "bg-amber-100 text-amber-800 border-amber-300" },
                          ].map((st) => {
                            const checked = statusFilters.includes(st.label);
                            return (
                              <label
                                key={st.label}
                                className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${checked ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-container text-on-surface"
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
                                  <span className="text-xs">{st.label}</span>
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
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      Alterações não salvas
                    </span>
                  )}
                  <button
                    onClick={handleSaveEdits}
                    disabled={savingState === "saving"}
                    className={`min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${hasChanges
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
                    onClick={exportToExcel}
                    className="min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">description</span>
                    Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    Imprimir
                  </button>
                </div>
              </div>

              {/* Data Grid Analítica Editável */}
              <p className="mb-2 text-[11px] text-on-surface-variant sm:hidden">Deslize horizontalmente para visualizar todas as colunas.</p>
              <div className="w-full overflow-x-auto overscroll-x-contain rounded-lg border border-sky-100 dark:border-sky-900/40 shadow-sm" tabIndex={0} aria-label="Tabela de detalhamento analítico, deslize horizontalmente para ver todas as colunas">
                <table className="w-full min-w-[760px] text-left border-collapse text-xs sm:min-w-[980px]">
                  <thead className="bg-sky-50/70 dark:bg-sky-950/40 sticky top-0 z-10 text-[11px] font-bold text-sky-900 dark:text-sky-200 border-b border-sky-100 dark:border-sky-900/50">
                    <tr>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 w-[300px] min-w-[260px] sm:w-[450px] sm:min-w-[350px]">{renderSortHeader("acao", "Ação")}</th>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 w-[100px] min-w-[90px] sm:w-[110px] sm:min-w-[100px]">{renderSortHeader("elemento", "Elemento de Despesa")}</th>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valLdo", "Valor LDO", "text-right")}</th>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valLoa", "Valor LOA (Editável)", "text-right")}</th>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("diff", "Diferença", "text-right")}</th>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-center">{renderSortHeader("status", "Status", "text-center")}</th>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-center">{renderSortHeader("adjusted", "Ajustado / Validado", "text-center")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/60 dark:divide-sky-900/20 font-mono">
                    {paginatedEditableGroups.map((group) => {
                      const isExpanded = expandedEditGroups.has(group.id);
                      const diff = group.valLoa - group.valLdo;
                      const status = getStatusInfo(group.valLdo, group.valLoa);
                      const diffColor = diff > 0 ? "text-emerald-600 font-bold" : diff < 0 ? "text-rose-600 font-bold" : "text-gray-400";
                      const groupAdjusted = group.children.some((item) => {
                        const original = originalValuesById.get(item.id) ?? item.valLdo;
                        return Math.abs(item.valLoa - original) > 0.001;
                      });
                      const natureGroups = Array.from(group.children.reduce((map, item) => {
                        const key = item.natureza || item.elemento || "Outros";
                        map.set(key, [...(map.get(key) ?? []), item]);
                        return map;
                      }, new Map<string, RawBudgetItem[]>())).sort(([keyA, itemsA], [keyB, itemsB]) => {
                        const ldoA = itemsA.reduce((sum, item) => sum + item.valLdo, 0);
                        const ldoB = itemsB.reduce((sum, item) => sum + item.valLdo, 0);
                        const loaA = itemsA.reduce((sum, item) => sum + item.valLoa, 0);
                        const loaB = itemsB.reduce((sum, item) => sum + item.valLoa, 0);
                        const diffA = loaA - ldoA;
                        const diffB = loaB - ldoB;

                        let res = 0;
                        if (natureSort.column === "natureza") {
                          res = keyA.localeCompare(keyB, "pt-BR", { numeric: true, sensitivity: "base" });
                        } else if (natureSort.column === "subelementos") {
                          res = itemsA.length - itemsB.length;
                        } else if (natureSort.column === "valLdo") {
                          res = ldoA - ldoB;
                        } else if (natureSort.column === "valLoa") {
                          res = loaA - loaB;
                        } else if (natureSort.column === "diff") {
                          res = diffA - diffB;
                        } else if (natureSort.column === "status") {
                          res = getStatusLabel(ldoA, loaA).localeCompare(getStatusLabel(ldoB, loaB), "pt-BR");
                        }
                        return natureSort.direction === "asc" ? res : -res;
                      });

                      return (
                        <Fragment key={group.id}>
                          {/* NÍVEL 1: LINHA DA AÇÃO (PAI) - AZUL MAIS CLARO E SUAVE */}
                          <tr className={`border-t border-sky-200/60 dark:border-sky-900/40 transition-colors ${isExpanded
                              ? "bg-sky-100/50 dark:bg-sky-950/60 border-b border-sky-200/80 shadow-xs"
                              : "bg-sky-50/40 hover:bg-sky-50/90 dark:bg-sky-950/25 dark:hover:bg-sky-950/40"
                            }`}>
                            <td className="p-3 font-sans font-bold text-on-surface w-[320px] min-w-[280px] sm:w-[450px] sm:min-w-[350px]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isExpanding = !expandedEditGroups.has(group.id);
                                    setExpandedEditGroups((previous) => {
                                      const next = new Set(previous);
                                      if (next.has(group.id)) next.delete(group.id);
                                      else next.add(group.id);
                                      return next;
                                    });
                                    if (isExpanding) {
                                      setExpandedNatureGroups((prev) => {
                                        const next = new Set(prev);
                                        natureGroups.forEach(([natureza]) => {
                                          next.add(`${group.id}|${natureza}`);
                                        });
                                        return next;
                                      });
                                    }
                                  }}
                                  className={`min-h-9 min-w-9 rounded-lg flex items-center justify-center shrink-0 transition-all font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${isExpanded
                                      ? "bg-sky-700 text-white shadow-sm ring-2 ring-sky-400/40"
                                      : "border border-sky-300 bg-white text-sky-700 hover:bg-sky-100 dark:bg-slate-900 dark:text-sky-300 dark:border-sky-700"
                                    }`}
                                  aria-label={isExpanded ? "Recolher subelementos" : "Expandir subelementos"}
                                >
                                  <span className="material-symbols-outlined text-base">{isExpanded ? "expand_less" : "expand_more"}</span>
                                </button>
                                <div className="min-w-0 flex-1 truncate" title={`${group.programa} · ${group.acao}`}>
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                    {group.programa || "Programa não informado"}
                                  </span>
                                  <span className="block whitespace-normal text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                    {group.acao || "Sem Ação"}
                                  </span>
                                  {group.children.some((item) => item.origem === "Banco de Projetos") && (
                                    <span className="mt-1 inline-flex rounded-full bg-secondary-container px-2 py-0.5 text-[9px] font-bold text-on-secondary-container">
                                      Banco de Projetos
                                    </span>
                                  )}
                                </div>
                                {group.children.filter((item) => item.origem === "Banco de Projetos").map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleRemoveBancoProjeto(item)}
                                    className="ml-auto shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                    title="Remover este projeto da LOA"
                                  >
                                    Remover
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => { setAddElementContext(null); setAddExpenseGroup(group); }}
                                  aria-label={`Adicionar Natureza da Despesa em ${group.acao}`}
                                  title="Adicionar Natureza da Despesa"
                                  className="ml-auto flex min-h-8 px-2 items-center gap-1 rounded-lg border border-primary/30 bg-surface text-primary hover:bg-primary/10 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
                                >
                                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                                  <span className="hidden sm:inline">Natureza</span>
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-on-surface-variant font-sans w-[100px] max-w-[100px] truncate sm:w-[110px] sm:max-w-[110px]" title={group.elemento}>
                              {group.elemento}
                            </td>
                            <td className="p-3 text-right font-mono text-on-surface-variant font-medium select-none bg-surface-container-low/60">
                              {formatBr(group.valLdo)}
                            </td>
                            <td className="p-2 border border-outline-variant/20 bg-surface text-right">
                              <input
                                type="text"
                                value={editingCell?.id === group.id && editingCell.field === "groupValLoa" ? tempInputValue : formatBr(group.valLoa)}
                                onFocus={() => {
                                  setEditingCell({ id: group.id, field: "groupValLoa" });
                                  setTempInputValue(group.valLoa.toFixed(2).replace(".", ","));
                                }}
                                onChange={(event) => setTempInputValue(event.target.value.replace(/-/g, ""))}
                                onBlur={() => {
                                  applyGroupLoa(group, parseBr(tempInputValue));
                                  setEditingCell(null);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") event.currentTarget.blur();
                                }}
                                className="w-32 text-right px-2 py-1 rounded-lg border border-primary/50 bg-surface font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none shadow-sm dark:bg-surface-container-high dark:text-white dark:border-primary/60"
                              />
                            </td>
                            <td className={`p-3 text-right font-semibold ${diffColor}`}>
                              {diff > 0 ? `▲ ${currency.format(diff)}` : diff < 0 ? `▼ ${currency.format(Math.abs(diff))}` : "—"}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 text-[9.5px] font-bold rounded-full border ${status.class}`}>{status.label}</span>
                            </td>
                            <td className="p-3 text-center">
                              {groupAdjusted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-2xs">
                                  <span className="material-symbols-outlined text-[12px]">edit</span>
                                  <span>Ajustado</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleValidateRow(group.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${validatedRows[group.id]
                                      ? "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs"
                                      : "bg-surface text-on-surface-variant/70 border-outline-variant hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                                    }`}
                                  title={validatedRows[group.id] ? "Ação validada! Clique para desmarcar" : "Marcar esta ação como validada (sem alterações necessárias)"}
                                  aria-label={`Validar ação ${group.acao}`}
                                >
                                  <span className={`material-symbols-outlined text-[14px] ${validatedRows[group.id] ? "text-emerald-700 dark:text-emerald-400 font-black" : "text-gray-400"}`}>
                                    {validatedRows[group.id] ? "check_circle" : "radio_button_unchecked"}
                                  </span>
                                  <span>{validatedRows[group.id] ? "Validado" : "Validar"}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <Fragment>
                              {/* BLOCO PLANEJAMENTO LDO - 2027 */}
                              <tr className="bg-surface-container-lowest/80 border-b border-outline-variant/30">
                                <td colSpan={7} className="p-3 pl-8 sm:pl-12">
                                  {(() => {
                                    const isLdoPlanningCollapsed = collapsedLdoPlanningGroups.has(group.id);
                                    return (
                                      <div className="rounded-xl border border-primary/20 bg-surface p-3.5 shadow-sm dark:bg-surface-container-low transition-all">
                                        {/* Header do Accordion */}
                                        <div className={`flex items-center justify-between ${isLdoPlanningCollapsed ? "" : "border-b border-outline-variant/30 pb-2.5 mb-3"}`}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCollapsedLdoPlanningGroups((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(group.id)) next.delete(group.id);
                                                else next.add(group.id);
                                                return next;
                                              });
                                            }}
                                            className="flex items-center gap-2 text-left group/accordion cursor-pointer hover:opacity-85 transition-all focus-visible:outline-none"
                                            aria-expanded={!isLdoPlanningCollapsed}
                                          >
                                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform">
                                              <span className="material-symbols-outlined text-[16px] font-bold">
                                                {isLdoPlanningCollapsed ? "expand_more" : "expand_less"}
                                              </span>
                                            </div>
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary font-headline">
                                              Planejamento LDO — 2027
                                            </span>
                                            <span className="text-[10px] text-on-surface-variant font-mono bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/40">
                                              {isLdoPlanningCollapsed ? "Clique para expandir" : "Recolher"}
                                            </span>
                                          </button>

                                          {/* Ações de Edição */}
                                          <div className="flex items-center gap-2">
                                            {editingLdoPlanningGroupKey === group.id ? (
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingLdoPlanningGroupKey(null)}
                                                  className="rounded-lg border border-outline-variant px-3 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                                >
                                                  Cancelar
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveLdoPlanning(group)}
                                                  className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-on-primary hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                                                >
                                                  Salvar LDO
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setCollapsedLdoPlanningGroups((prev) => {
                                                    const next = new Set(prev);
                                                    next.delete(group.id);
                                                    return next;
                                                  });
                                                  handleStartEditLdoPlanning(group);
                                                }}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                              >
                                                <span className="material-symbols-outlined text-xs">edit</span>
                                                Editar LDO
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {/* Conteúdo do Accordion */}
                                        {!isLdoPlanningCollapsed && (
                                          editingLdoPlanningGroupKey === group.id ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                                              {/* Card 1: Indicador (Edição) */}
                                              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-3 space-y-1.5 focus-within:ring-2 focus-within:ring-indigo-500/30">
                                                <label htmlFor="edit-ldo-indicador" className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                    <span className="material-symbols-outlined text-xs">analytics</span>
                                                  </div>
                                                  <span>Indicador</span>
                                                </label>
                                                <input
                                                  id="edit-ldo-indicador"
                                                  type="text"
                                                  value={editLdoIndicador}
                                                  onChange={(e) => setEditLdoIndicador(e.target.value)}
                                                  placeholder="Ex: Taxa de atendimento..."
                                                  className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                <p className="text-[9px] text-on-surface-variant">Desempenho da Ação</p>
                                              </div>

                                              {/* Card 2: Unidade de Medida (Edição) */}
                                              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3 space-y-1.5 focus-within:ring-2 focus-within:ring-emerald-500/30">
                                                <label htmlFor="edit-ldo-unidade" className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    <span className="material-symbols-outlined text-xs">straighten</span>
                                                  </div>
                                                  <span>Unidade de Medida</span>
                                                </label>
                                                <input
                                                  id="edit-ldo-unidade"
                                                  type="text"
                                                  value={editLdoUnidadeMedida}
                                                  onChange={(e) => setEditLdoUnidadeMedida(e.target.value)}
                                                  placeholder="Ex: %, Unidade, Alunos..."
                                                  className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                                <p className="text-[9px] text-on-surface-variant">Métrica oficial Anexo VI</p>
                                              </div>

                                              {/* Card 3: Custo Físico 2027 (Edição) */}
                                              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3 space-y-1.5 focus-within:ring-2 focus-within:ring-amber-500/30">
                                                <label htmlFor="edit-ldo-custo-fisico" className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                    <span className="material-symbols-outlined text-xs">pie_chart</span>
                                                  </div>
                                                  <span>Custo Físico 2027</span>
                                                </label>
                                                <input
                                                  id="edit-ldo-custo-fisico"
                                                  type="text"
                                                  value={editLdoCustoFisico}
                                                  onChange={(e) => setEditLdoCustoFisico(e.target.value)}
                                                  placeholder="0"
                                                  className="w-full text-xs font-bold font-mono px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                />
                                                <p className="text-[9px] text-on-surface-variant">Meta física Anexo VI (LDO)</p>
                                              </div>

                                              {/* Card 4: Custo Financeiro LOA (Edição) */}
                                              {(() => {
                                                const valorCustoFin = group.valLoa;
                                                const totalNaturezas = group.children.reduce((sum, c) => sum + c.valLoa, 0);
                                                const diffValor = valorCustoFin - totalNaturezas;
                                                const hasDiff = Math.abs(diffValor) > 0.01;
                                                return (
                                                  <div className={`rounded-xl border ${hasDiff ? "border-amber-500/40 bg-amber-500/[0.06]" : "border-sky-500/20 bg-sky-500/[0.03]"} p-3 space-y-1.5 focus-within:ring-2 focus-within:ring-sky-500/30`}>
                                                    <div className="flex items-center justify-between">
                                                      <label htmlFor="edit-ldo-custo-fin" className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-[10px] uppercase tracking-wider">
                                                        <div className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                                          <span className="material-symbols-outlined text-xs">payments</span>
                                                        </div>
                                                        <span>Custo Financeiro LOA</span>
                                                      </label>
                                                      {hasDiff && (
                                                        <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[8px] font-bold dark:bg-amber-950/80 dark:text-amber-300">
                                                          <span className="material-symbols-outlined text-[10px]">warning</span>
                                                          Divergente
                                                        </span>
                                                      )}
                                                    </div>
                                                    <input
                                                      id="edit-ldo-custo-fin"
                                                      type="text"
                                                      value={editLdoCustoFinanceiro}
                                                      onChange={(e) => setEditLdoCustoFinanceiro(e.target.value)}
                                                      placeholder={formatBr(group.valLoa)}
                                                      className="w-full text-xs font-bold font-mono px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                    />
                                                    {hasDiff ? (
                                                      <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                                        Saldo difere das naturezas ({diffValor > 0 ? `+${formatBr(diffValor)}` : formatBr(diffValor)})
                                                      </p>
                                                    ) : (
                                                      <p className="text-[9px] text-on-surface-variant">Sincronizado com as naturezas</p>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                                              {(() => {
                                                const data = getLdoPlanningForGroup(group);
                                                const formattedCustoFisico = data.custoFisico2027 != null
                                                  ? data.custoFisico2027.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                                                  : "0";
                                                const valorCustoFin = group.valLoa;
                                                const totalNaturezas = group.children.reduce((sum, c) => sum + c.valLoa, 0);
                                                const diffValor = valorCustoFin - totalNaturezas;
                                                const hasDiff = Math.abs(diffValor) > 0.01;

                                                return (
                                                  <>
                                                    {/* Card 1: Indicador (Visualização) */}
                                                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-3.5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                                                      <div>
                                                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                                                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            <span className="material-symbols-outlined text-sm">analytics</span>
                                                          </div>
                                                          <span>Indicador</span>
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-on-surface leading-snug">
                                                          {data.indicador || "Não informado"}
                                                        </p>
                                                      </div>
                                                    </div>

                                                    {/* Card 2: Unidade de Medida (Visualização) */}
                                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                                                      <div>
                                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                            <span className="material-symbols-outlined text-sm">straighten</span>
                                                          </div>
                                                          <span>Unidade de Medida</span>
                                                        </div>
                                                        <p className="mt-2 text-base font-extrabold text-on-surface">
                                                          {data.unidadeMedida || "Não informado"}
                                                        </p>
                                                      </div>
                                                    </div>

                                                    {/* Card 3: Custo Físico 2027 (Visualização) */}
                                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3.5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
                                                      <div>
                                                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                                                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                            <span className="material-symbols-outlined text-sm">pie_chart</span>
                                                          </div>
                                                          <span>Custo Físico 2027</span>
                                                        </div>
                                                        <p className="mt-2 text-lg font-extrabold font-mono text-on-surface">
                                                          {formattedCustoFisico} <span className="text-xs font-normal text-on-surface-variant font-sans">({data.unidadeMedida || "unid."})</span>
                                                        </p>
                                                      </div>
                                                    </div>

                                                    {/* Card 4: Custo Financeiro LOA (Visualização) */}
                                                    <div className={`rounded-xl border ${hasDiff ? "border-amber-500/40 bg-amber-500/[0.06]" : "border-sky-500/20 bg-sky-500/[0.03]"} p-3.5 flex flex-col justify-between hover:border-sky-500/40 transition-colors`}>
                                                      <div>
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-[10px] uppercase tracking-wider">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                                              <span className="material-symbols-outlined text-sm">payments</span>
                                                            </div>
                                                            <span>Custo Financeiro LOA</span>
                                                          </div>
                                                          {hasDiff && (
                                                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold dark:bg-amber-950/80 dark:text-amber-300">
                                                              <span className="material-symbols-outlined text-[11px]">warning</span>
                                                              Divergente
                                                            </span>
                                                          )}
                                                        </div>
                                                        <p className="mt-2 text-lg font-extrabold font-mono text-on-surface">
                                                          {currency.format(valorCustoFin)}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </>
                                                );
                                              })()}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                              </tr>

                              {/* DETALHAMENTO ORÇAMENTÁRIO HEADER INTERATIVO COM ORDENAÇÃO */}
                              <tr className="bg-sky-50/50 dark:bg-sky-950/30 border-y border-sky-100 dark:border-sky-900/40 text-[10px] font-extrabold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                                <th className="p-2 pl-12 text-left">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "natureza", direction: curr.column === "natureza" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Natureza / Elemento"
                                  >
                                    <span>Natureza / Elemento</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "natureza" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "natureza" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>
                                <th className="p-2 text-left">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "subelementos", direction: curr.column === "subelementos" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Quantidade de Subelementos"
                                  >
                                    <span>Subelementos</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "subelementos" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "subelementos" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>
                                <th className="p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "valLdo", direction: curr.column === "valLdo" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 ml-auto hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Valor LDO"
                                  >
                                    <span>Valor LDO</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "valLdo" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "valLdo" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>
                                <th className="p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "valLoa", direction: curr.column === "valLoa" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 ml-auto hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Valor LOA"
                                  >
                                    <span>Valor LOA</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "valLoa" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "valLoa" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>
                                <th className="p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "diff", direction: curr.column === "diff" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 ml-auto hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Diferença"
                                  >
                                    <span>Diferença</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "diff" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "diff" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>
                                <th className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "status", direction: curr.column === "status" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 mx-auto hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Status"
                                  >
                                    <span>Status</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "status" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "status" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>
                                <th className="p-2 text-center text-sky-800/80 dark:text-sky-300/80">Ajustado</th>
                              </tr>

                              {/* NÍVEL 2: LINHAS DAS NATUREZAS DE DESPESA (FILHAS) */}
                              {natureGroups.map(([natureza, natureItems]) => {
                                const natureKey = `${group.id}|${natureza}`;
                                const natureExpanded = expandedNatureGroups.has(natureKey);
                                const natureLdo = natureItems.reduce((sum, item) => sum + item.valLdo, 0);
                                const natureLoa = natureItems.reduce((sum, item) => sum + item.valLoa, 0);
                                const natureDiff = natureLoa - natureLdo;
                                const natureStatus = getStatusInfo(natureLdo, natureLoa);
                                return (
                                  <Fragment key={natureKey}>
                                    <tr className="bg-surface hover:bg-surface-container/60 transition-colors border-b border-outline-variant/20">
                                      <td className="p-2.5 pl-8 sm:pl-12 font-sans font-medium text-on-surface" title={getNatureLabel(natureza, natureItems[0]?.elemento)}>
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Linha guia conectora da árvore */}
                                          <span className="text-outline-variant/80 font-mono text-xs select-none">├──</span>
                                          <button
                                            type="button"
                                            onClick={() => setExpandedNatureGroups((previous) => {
                                              const next = new Set(previous);
                                              if (next.has(natureKey)) next.delete(natureKey);
                                              else next.add(natureKey);
                                              return next;
                                            })}
                                            className={`flex min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${natureExpanded
                                                ? "border-primary/40 bg-primary/10 text-primary font-bold"
                                                : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                                              }`}
                                            aria-label={natureExpanded ? "Recolher subelementos da natureza" : "Expandir subelementos da natureza"}
                                          >
                                            <span className="material-symbols-outlined text-[14px]">{natureExpanded ? "expand_more" : "chevron_right"}</span>
                                          </button>
                                          <span className="truncate font-mono text-xs font-semibold text-on-surface">
                                            {getNatureLabel(natureza, natureItems[0]?.elemento)}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAddExpenseGroup(group);
                                              setAddElementContext({ group, natureza });
                                              setNewExpenseNatureza(natureza.split("-")[0].trim());
                                            }}
                                            className="ml-auto flex min-h-6 px-1.5 shrink-0 items-center gap-1 rounded-md border border-amber-300/80 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60"
                                            title="Adicionar Elemento de Despesa"
                                            aria-label={`Adicionar Elemento de Despesa em ${getNatureLabel(natureza, natureItems[0]?.elemento)}`}
                                          >
                                            <span className="material-symbols-outlined text-[13px]">add</span>
                                            <span className="hidden sm:inline">Elemento</span>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-on-surface-variant font-sans text-xs">
                                        <div className="flex flex-col gap-1 items-start">
                                          <span>{natureItems.length} subelemento{natureItems.length === 1 ? "" : "s"}</span>
                                          {natureItems.some((i) => i.processo && i.processo !== "—") && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 dark:text-sky-200 bg-sky-100/70 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 px-1.5 py-0.5 rounded shadow-2xs" title="Contém processos administrativos vinculados">
                                              <span className="material-symbols-outlined text-[11px]">folder</span>
                                              <span>Proc: {Array.from(new Set(natureItems.map((i) => i.processo).filter((p) => p && p !== "—"))).join(", ")}</span>
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-right font-mono text-on-surface-variant text-xs">{formatBr(natureLdo)}</td>
                                      <td className="p-1.5 border border-outline-variant/20 bg-surface text-right">
                                        <input
                                          type="text"
                                          value={editingCell?.id === natureKey && editingCell.field === "groupValLoa" ? tempInputValue : formatBr(natureLoa)}
                                          onFocus={() => {
                                            setEditingCell({ id: natureKey, field: "groupValLoa" });
                                            setTempInputValue(natureLoa.toFixed(2).replace(".", ","));
                                          }}
                                          onChange={(event) => setTempInputValue(event.target.value.replace(/-/g, ""))}
                                          onBlur={() => {
                                            applyNatureLoa(natureItems, parseBr(tempInputValue));
                                            setEditingCell(null);
                                          }}
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter") event.currentTarget.blur();
                                          }}
                                          className="w-32 text-right px-2 py-1 rounded-lg border border-primary/40 bg-surface font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary focus:outline-none shadow-sm text-xs"
                                        />
                                      </td>
                                      <td className={`p-2.5 text-right text-xs ${natureDiff > 0 ? "text-emerald-600 font-bold" : natureDiff < 0 ? "text-rose-600 font-bold" : "text-gray-400"}`}>
                                        {natureDiff > 0 ? `▲ ${currency.format(natureDiff)}` : natureDiff < 0 ? `▼ ${currency.format(Math.abs(natureDiff))}` : "—"}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${natureStatus.class}`}>{natureStatus.label}</span>
                                      </td>
                                      <td className="p-2.5 text-center text-xs text-on-surface-variant/60">—</td>
                                    </tr>

                                    {/* NÍVEL 3: LINHAS DOS SUBELEMENTOS (NETOS) */}
                                    {natureExpanded && natureItems.map((item) => {
                                      const original = originalValuesById.get(item.id) ?? item.valLdo;
                                      const childAdjusted = Math.abs(item.valLoa - original) > 0.001;

                                      return (
                                        <tr key={item.id} className="bg-surface-container-lowest hover:bg-primary/[0.04] transition-colors border-b border-outline-variant/10">
                                            <td colSpan={2} className="p-2.5 pl-12 sm:pl-16 text-on-surface-variant font-sans text-xs" title={getSubelementLabel(item)}>
                                              <div className="flex items-start gap-2">
                                                {/* Linha guia conectora da árvore */}
                                                <span className="text-outline-variant/80 font-mono text-xs select-none mt-0.5 shrink-0">│   └──</span>
                                                <div className="min-w-0 flex-1 flex flex-col items-start gap-1.5">
                                                  {/* Cabeçalho do Subelemento com Botões de Ação alinhados à direita */}
                                                  <div className="w-full flex items-center justify-between gap-2">
                                                    <span className="text-on-surface font-semibold text-xs leading-snug break-words">
                                                      {getSubelementLabel(item)}
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setEditingSubelementItem(item);
                                                          setEditSubelementName(getSubelementLabel(item));
                                                          setEditSubelementVinculo(item.fonteVinculo || "01");
                                                          setEditSubelementCodigoAplicacao(item.codigoAplicacao || item.processo.match(/^CA:\s*(.+)$/i)?.[1]?.trim() || "");
                                                          setEditSubelementProcesso(item.processo && item.processo !== "—" ? item.processo : "");
                                                          setEditSubelementProjetoIniciado(item.projetoIniciado || "");
                                                          setEditSubelementObservacao(item.observacao || justifications[item.id] || "");
                                                          setEditSubelementValor(item.valLoa.toFixed(2).replace(".", ","));
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-all cursor-pointer"
                                                        title="Editar subelemento"
                                                        aria-label={`Editar ${getSubelementLabel(item)}`}
                                                      >
                                                        <span className="material-symbols-outlined text-[13px]">edit</span>
                                                        <span>Editar</span>
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => removeSubelement(item)}
                                                        className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                                        title="Remover subelemento"
                                                        aria-label={`Remover ${getSubelementLabel(item)}`}
                                                      >
                                                        <span className="material-symbols-outlined text-[15px]">delete</span>
                                                      </button>
                                                    </div>
                                                  </div>

                                                  {/* Badges de Vínculo (com Código de Aplicação integrado) e Processo */}
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    {(item.fonteVinculo || item.codigoAplicacao) && (
                                                      <span
                                                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-teal-800 dark:text-teal-200 font-mono bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 px-2 py-0.5 rounded-md shadow-2xs"
                                                        title={`Fonte/Vínculo e Código de Aplicação: ${formatVinculoComAplicacao(item.fonteVinculo, item.codigoAplicacao)}`}
                                                      >
                                                        <span className="material-symbols-outlined text-[12px]">account_balance</span>
                                                        <span>Vínculo: {formatVinculoComAplicacao(item.fonteVinculo, item.codigoAplicacao)}</span>
                                                      </span>
                                                    )}
                                                    {item.processo && item.processo !== "—" && (
                                                      <span
                                                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-sky-800 dark:text-sky-200 font-mono bg-sky-100/70 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 px-2 py-0.5 rounded-md shadow-2xs"
                                                        title={`Processo Administrativo: ${item.processo}`}
                                                      >
                                                        <span className="material-symbols-outlined text-[12px]">folder</span>
                                                        <span>Processo: {item.processo}</span>
                                                      </span>
                                                    )}
                                                  </div>

                                                  {/* Bloco Enquadrado de Informações (Projeto Iniciado + Observação) */}
                                                  {(item.projetoIniciado || item.observacao || justifications[item.id]) && (
                                                    <div className="mt-2 w-full flex flex-col gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-low/90 dark:bg-surface-container-high/50 p-3 shadow-2xs">
                                                      {item.projetoIniciado && (
                                                        <div className="flex items-center gap-2 font-mono text-[11px]">
                                                          <span className="font-bold text-on-surface">Projeto Iniciado:</span>
                                                          <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                                                              item.projetoIniciado === "SIM"
                                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                                                : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                                            }`}
                                                          >
                                                            <span className="material-symbols-outlined text-[12px]">
                                                              {item.projetoIniciado === "SIM" ? "check_circle" : "cancel"}
                                                            </span>
                                                            {item.projetoIniciado}
                                                          </span>
                                                        </div>
                                                      )}
                                                      {(item.observacao || justifications[item.id]) && (
                                                        <div className="flex items-start gap-2 text-xs leading-relaxed text-on-surface-variant">
                                                          <span className="material-symbols-outlined text-[15px] text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">notes</span>
                                                          <div className="min-w-0 flex-1 break-words">
                                                            <strong className="font-semibold text-on-surface">Observação: </strong>
                                                            <span className="text-on-surface/90">{item.observacao || justifications[item.id]}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                          <td className="p-2 text-right font-mono text-on-surface-variant/60 text-xs">—</td>
                                          <td className="p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <input
                                              type="text"
                                              value={editingCell?.id === item.id && editingCell.field === "valLoa" ? tempInputValue : formatBr(item.valLoa)}
                                              onFocus={() => {
                                                setEditingCell({ id: item.id, field: "valLoa" });
                                                setTempInputValue(item.valLoa.toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, valLoa: value } : entry));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 text-right px-2 py-1 rounded-lg border border-outline-variant bg-surface font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none shadow-sm dark:bg-surface-container-high dark:text-white text-xs"
                                            />
                                          </td>
                                          <td className="p-2 text-right text-on-surface-variant/60 text-xs">—</td>
                                          <td className="p-2 text-center">
                                            <span className="inline-block px-2 py-0.5 text-[8.5px] font-bold rounded-full border border-outline-variant bg-surface-container text-on-surface-variant">Detalhamento LOA</span>
                                          </td>
                                          <td className="p-2 text-center">
                                            {childAdjusted ? (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9.5px] font-extrabold rounded-md bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-2xs">
                                                <span className="material-symbols-outlined text-[11px]">edit</span>
                                                <span>Ajustado</span>
                                              </span>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => toggleValidateRow(item.id)}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold rounded-lg border transition-all cursor-pointer ${validatedRows[item.id]
                                                    ? "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs"
                                                    : "bg-surface text-on-surface-variant/70 border-outline-variant hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                                                  }`}
                                                title={validatedRows[item.id] ? "Subelemento validado! Clique para desmarcar" : "Validar este subelemento (sem alterações)"}
                                                aria-label={`Validar subelemento ${getSubelementLabel(item)}`}
                                              >
                                                <span className={`material-symbols-outlined text-[13px] ${validatedRows[item.id] ? "text-emerald-700 dark:text-emerald-400 font-black" : "text-gray-400"}`}>
                                                  {validatedRows[item.id] ? "check_circle" : "radio_button_unchecked"}
                                                </span>
                                                <span>{validatedRows[item.id] ? "Validado" : "Validar"}</span>
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </Fragment>
                                );
                              })}
                            </Fragment>
                          )}
                        </Fragment>
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

              {/* Controles de Paginação (Padrão 10 linhas) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-2 border-t border-outline-variant text-xs">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span>
                    Exibindo <strong>{editableGroups.length > 0 ? (tablePage - 1) * tablePageSize + 1 : 0}</strong> a{" "}
                    <strong>{Math.min(tablePage * tablePageSize, editableGroups.length)}</strong> de <strong>{editableGroups.length}</strong> ações
                  </span>
                  <select
                    value={tablePageSize}
                    onChange={(e) => {
                      setTablePageSize(Number(e.target.value));
                      setTablePage(1);
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface ml-2 font-medium"
                  >
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                    <option value={editableGroups.length || 9999}>Todas</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={tablePage <= 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container font-semibold transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 font-semibold text-on-surface text-xs">
                    Página {tablePage} de {totalTablePages}
                  </span>
                  <button
                    type="button"
                    disabled={tablePage >= totalTablePages}
                    onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container font-semibold transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // Seção 6: Sub-elementos de Despesa & Iniciativas Estratégicas
        if (sectionId === "subelementos-iniciativas") {
          return (
            <section key="subelementos-iniciativas" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Esquerdo: Detalhamento por Sub-elementos */}
              <div className="glass-card p-5 bg-surface border border-outline-variant flex flex-col h-[400px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant pb-3 mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_tree</span>
                    <div>
                      <h3 className="text-sm font-headline font-bold text-on-surface">Sub-elementos de Despesa</h3>
                      <p className="text-[10px] text-on-surface-variant">Filtrados pela seleção atual ({subelementosBreakdown.length} sub-elementos)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={cardSubelementosAcao}
                      onChange={(e) => setCardSubelementosAcao(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:outline-none max-w-[140px] font-mono font-medium"
                    >
                      <option value="">Todas Ações</option>
                      {availableSubelementosAcoes.map((ac) => {
                        const codeOnly = ac.split("—")[0].split("-")[0].trim();
                        return (
                          <option key={ac} value={ac} title={ac}>
                            Ação {codeOnly}
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 dark:bg-primary/20 dark:text-tertiary-fixed-dim">
                      Subelementos
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto space-y-2 pr-1">
                  {subelementosBreakdown.length === 0 ? (
                    <p className="text-xs text-on-surface-variant p-4 text-center">Nenhum sub-elemento encontrado para a Ação / seleção escolhida.</p>
                  ) : (
                    subelementosBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-surface-container/50 border border-outline-variant/60 hover:bg-surface-container transition-colors flex items-center justify-between text-xs dark:bg-surface-container-low/70 dark:border-outline-variant/40"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            {item.acao && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60">
                                Ação {item.acao.split("—")[0].split("-")[0].trim()}
                              </span>
                            )}
                            {item.natureza && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60">
                                Despesa {item.natureza.trim().match(/\d+(\.\d+)*/)?.[0] || item.natureza}
                              </span>
                            )}
                            {(item.fonteVinculo || item.codigoAplicacao) && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700/60" title={`Fonte/Vínculo e Aplicação: ${formatVinculoComAplicacao(item.fonteVinculo, item.codigoAplicacao)}`}>
                                Vínculo {formatVinculoComAplicacao(item.fonteVinculo, item.codigoAplicacao)}
                              </span>
                            )}
                            {item.processo && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono rounded bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60" title={`Processo Administrativo: ${item.processo}`}>
                                Proc: {item.processo}
                              </span>
                            )}
                            {item.projetoIniciado && (
                              <span className={`px-1.5 py-0.2 text-[9px] font-bold font-mono rounded border ${
                                item.projetoIniciado === "SIM"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                              }`}>
                                Projeto Iniciado: {item.projetoIniciado}
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
                          <p className="font-extrabold text-primary dark:text-tertiary-fixed-dim">{formatBr(item.loa)}</p>
                          <p className={`text-[10px] font-bold ${item.diff > 0 ? "text-emerald-600 dark:text-emerald-400" : item.diff < 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}`}>
                            {item.diff > 0 ? `+${formatBr(item.diff)}` : formatBr(item.diff)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card Direito: Iniciativas Estratégicas Vinculadas */}
              <div className="glass-card p-5 bg-surface border border-outline-variant flex flex-col h-[400px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant pb-3 mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">stars</span>
                    <div>
                      <h3 className="text-sm font-headline font-bold text-on-surface">Iniciativas Estratégicas</h3>
                      <p className="text-[10px] text-on-surface-variant">Projetos & Ações Estratégicas ({displayIniciativas.length} iniciativas)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={cardIniciativasAcao}
                      onChange={(e) => setCardIniciativasAcao(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-amber-500 focus:outline-none max-w-[140px] font-mono font-medium"
                    >
                      <option value="">Todas Ações</option>
                      {availableIniciativasAcoes.map((ac) => {
                        const codeOnly = ac.split("—")[0].split("-")[0].trim();
                        return (
                          <option key={ac} value={ac} title={ac}>
                            Ação {codeOnly}
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60">
                      PLDO 2027
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto space-y-2 pr-1">
                  {loadingIniciativas ? (
                    <div className="p-8 text-center space-y-2">
                      <span className="material-symbols-outlined animate-spin text-amber-600 dark:text-amber-400">sync</span>
                      <p className="text-xs text-on-surface-variant">Buscando iniciativas correspondentes...</p>
                    </div>
                  ) : displayIniciativas.length === 0 ? (
                    <p className="text-xs text-on-surface-variant p-4 text-center">Nenhuma iniciativa estratégica encontrada para a Ação / seleção escolhida.</p>
                  ) : (
                    displayIniciativas.map((ini) => (
                      <div
                        key={ini.id}
                        className="p-2.5 rounded-xl bg-surface-container/50 border border-outline-variant/60 hover:bg-surface-container transition-colors flex items-center justify-between text-xs dark:bg-surface-container-low/70 dark:border-outline-variant/40"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60">
                              Ação {ini.acao}
                            </span>
                            {ini.despesa && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60">
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
                          <span className="font-extrabold text-amber-700 dark:text-amber-400">{currency.format(ini.valorFinalPldo27 ?? 0)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          );
        }

        // Seção 7: Banco de Projetos
        if (sectionId === "banco-projetos") {
          return (
            <BancoProjetosCard
              key="banco-projetos"
              filters={{ secretaria: filters.secretaria, natureza: filters.natureza, search: filters.search }}
              allocatedKeys={rawItems.flatMap((item) => item.bancoProjetoKey ? [item.bancoProjetoKey] : [])}
              onAllocate={handleAllocateBancoProjeto}
            />
          );
        }

        return null;
      })}



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
                  aria-label="Fechar painel de insights"
                  className="min-h-11 min-w-11 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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

      {/* 7. POPUP MODAL: Justificativa de Ajustes ao Salvar */}
      {saveModalOpen && (() => {
        const pendingItems = [
          ...modifiedItems.map((item) => ({ item, isRemoved: false })),
          ...removedRawItems.map((item) => ({ item, isRemoved: true })),
        ];

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-justification-title"
            onKeyDown={(event) => handleModalKeyDown(event, saveModalDialogRef, handleCancelSaveModal)}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) handleCancelSaveModal();
            }}
          >
            <div
              ref={saveModalDialogRef}
              tabIndex={-1}
              className="w-full max-w-2xl bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] outline-none"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-outline-variant bg-surface-container/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">edit_note</span>
                  <div>
                    <h3 id="save-justification-title" className="text-base font-headline font-bold text-on-surface">Justificativa de Ajuste / Exclusão Orçamentária</h3>
                    <p className="text-xs text-on-surface-variant">
                      {pendingItems.length} alteração(ões) ({modifiedItems.length} valor(es) alterado(s), {removedRawItems.length} subelemento(s) excluído(s))
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelSaveModal}
                  aria-label="Fechar justificativa de ajuste"
                  className="min-h-11 min-w-11 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Body - Lista de Linhas Alteradas/Excluídas com Detalhes */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs font-semibold">
                  <span className="material-symbols-outlined text-amber-600 text-base shrink-0">info</span>
                  <span>
                    <strong>Atenção:</strong> O preenchimento da justificativa é obrigatório para manter as alterações e exclusões. Caso a justificativa não seja informada em alguma linha, a alteração/exclusão será cancelada e o item restaurado.
                  </span>
                </div>
                {saveError && (
                  <div className="rounded-lg border border-error/40 bg-error-container px-3 py-2 text-xs text-on-error-container" role="alert">
                    Não foi possível salvar as alterações. {saveError}
                  </div>
                )}

                {pendingItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container/30 rounded-xl">
                    Nenhuma alteração ou exclusão pendente.
                  </div>
                ) : (
                  pendingItems.map(({ item, isRemoved }) => {
                    const origVal = originalValuesById.get(item.id) ?? item.valLdo;
                    const diff = isRemoved ? -origVal : item.valLoa - origVal;
                    const diffBadge = isRemoved
                      ? "text-rose-700 bg-rose-50 border-rose-200 font-extrabold"
                      : diff > 0
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-rose-700 bg-rose-50 border-rose-200";

                    return (
                      <div key={item.id} className="p-4 rounded-xl bg-surface-container/40 border border-outline-variant/60 space-y-3">
                        {/* Informações da Linha */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/40 pb-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-primary truncate" title={item.secretaria}>
                              {item.secretaria}
                            </p>
                            <p className="text-xs font-bold text-on-surface truncate mt-0.5">
                              Ação: {item.acao}
                            </p>
                            <p className="text-[10px] text-on-surface-variant font-mono truncate">
                              Natureza: {item.natureza} • Subelemento: {item.subelemento || "—"} • Vínculo: {item.fonteVinculo || "01"}
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-mono text-xs">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-on-surface-variant line-through">{currency.format(origVal)}</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              <span className={`font-extrabold ${isRemoved ? "text-rose-600 line-through" : "text-on-surface"}`}>
                                {isRemoved ? "Excluído (R$ 0,00)" : currency.format(item.valLoa)}
                              </span>
                            </div>
                            <span className={`inline-block mt-1 px-2 py-0.2 text-[10px] font-bold rounded border ${diffBadge}`}>
                              {isRemoved ? "EXCLUSÃO DE SUBELEMENTO" : diff > 0 ? `+${currency.format(diff)}` : currency.format(diff)}
                            </span>
                          </div>
                        </div>

                        {/* Campo de Texto para a Justificativa */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-on-surface flex items-center justify-between">
                            <span>
                              {isRemoved ? "Justificativa da Exclusão" : "Justificativa do Ajuste"}{" "}
                              <span className="text-rose-600">*</span>
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-normal">
                              {isRemoved ? "Descreva o motivo da exclusão deste subelemento" : "Descreva o motivo da alteração do valor"}
                            </span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder={
                              isRemoved
                                ? "Informe a motivação técnica/operacional para a exclusão deste subelemento..."
                                : "Informe a motivação técnica para a alteração do valor da dotação..."
                            }
                            value={justifications[item.id] || ""}
                            onChange={(e) =>
                              setJustifications((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="w-full p-2.5 text-xs rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/50"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse gap-2 px-6 py-4 border-t border-outline-variant bg-surface-container/50 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleCancelSaveModal}
                  className="min-h-11 w-full px-4 py-2 text-xs font-semibold rounded-xl bg-surface border border-outline-variant text-on-surface hover:bg-surface-container transition-colors sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSaveEdits}
                  disabled={savingState === "saving"}
                  className="min-h-11 w-full px-5 py-2 text-xs font-bold rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 sm:w-auto"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Confirmar e Salvar</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {addElementContext && <AddElementExpenseDialog
        actionLabel={addExpenseGroup?.acao ?? ""}
        natureLabel={getNatureLabel(addElementContext.natureza, "")}
        subelemento={newExpenseSubelemento}
        setSubelemento={setNewExpenseSubelemento}
        options={availableElements}
        value={newExpenseValor}
        setValue={setNewExpenseValor}
        vinculo={newExpenseVinculo}
        setVinculo={setNewExpenseVinculo}
        codigoAplicacao={newExpenseCodigoAplicacao}
        setCodigoAplicacao={setNewExpenseCodigoAplicacao}
        processo={newExpenseProcesso}
        setProcesso={setNewExpenseProcesso}
        projetoIniciado={newExpenseProjetoIniciado}
        setProjetoIniciado={setNewExpenseProjetoIniciado}
        observacao={newExpenseObservacao}
        setObservacao={setNewExpenseObservacao}
        onClose={() => {
          setAddExpenseGroup(null);
          setAddElementContext(null);
          setNewExpenseSubelemento("");
          setNewExpenseValor("");
          setNewExpenseCodigoAplicacao("");
          setNewExpenseProcesso("");
          setNewExpenseProjetoIniciado("");
          setNewExpenseObservacao("");
        }}
        onConfirm={handleAddExpense}
        parseValue={parseBr}
      />}
      {!addElementContext && addExpenseGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-expense-title"
          onKeyDown={(event) => handleModalKeyDown(event, addNatureDialogRef, () => setAddExpenseGroup(null))}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddExpenseGroup(null);
          }}
        >
          <div ref={addNatureDialogRef} tabIndex={-1} className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface shadow-2xl overflow-hidden outline-none">
            <div className="flex items-start justify-between border-b border-outline-variant bg-surface-container/50 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Nova natureza de despesa</p>
                <h2 id="add-expense-title" className="mt-1 text-lg font-bold text-on-surface">Adicionar Natureza da Despesa</h2>
                <p className="mt-1 text-xs text-on-surface-variant">{addExpenseGroup.acao} · {addExpenseGroup.elemento}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddExpenseGroup(null)}
                aria-label="Fechar adicionar despesa"
                className="min-h-10 min-w-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block text-xs font-bold text-on-surface">
                Natureza de despesa *
                <select
                  value={newExpenseNatureza}
                  onChange={(event) => setNewExpenseNatureza(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-normal focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">Selecione a natureza</option>
                  {naturezaOptions.map((item) => (
                    <option key={`${item.codigo}-${item.nome}`} value={item.codigo}>{item.codigo} — {item.nome}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-on-surface">
                Valor LOA *
                <input
                  value={newExpenseValor}
                  onChange={(event) => setNewExpenseValor(event.target.value.replace(/-/g, ""))}
                  inputMode="decimal"
                  placeholder="Ex.: 25.000,00"
                  className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-right font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-on-surface">
                Código de Aplicação
                <input
                  value={editSubelementCodigoAplicacao}
                  onChange={(event) => setEditSubelementCodigoAplicacao(event.target.value)}
                  placeholder="Ex.: 110000"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="block text-xs font-bold text-on-surface">
                Vínculo
                <select
                  value={newExpenseVinculo}
                  onChange={(event) => setNewExpenseVinculo(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-normal focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">Tesouro / Próprio</option>
                  <option value="01">01 — Tesouro</option>
                  <option value="02">02 — Transferências</option>
                  <option value="05">05 — Operações de crédito</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-on-surface">
                Processo
                <input
                  value={newExpenseProcesso}
                  onChange={(event) => setNewExpenseProcesso(event.target.value)}
                  placeholder="Opcional"
                  className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm font-normal focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container/40 p-4">
              <button
                type="button"
                onClick={() => setAddExpenseGroup(null)}
                className="min-h-11 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddExpense}
                disabled={!newExpenseNatureza || parseBr(newExpenseValor) <= 0}
                className="min-h-11 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                Adicionar despesa
              </button>
            </div>
          </div>
        </div>
      )}
      {editingSubelementItem && (
        <div
          className="fixed inset-0 z-[52] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-subelement-title"
          onKeyDown={(event) => handleModalKeyDown(event, editSubelementDialogRef, () => setEditingSubelementItem(null))}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingSubelementItem(null);
          }}
        >
          <div ref={editSubelementDialogRef} tabIndex={-1} className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface shadow-2xl overflow-hidden outline-none">
            <div className="flex items-start justify-between border-b border-outline-variant bg-surface-container/50 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Editar Subelemento</p>
                <h2 id="edit-subelement-title" className="mt-1 text-base font-bold text-on-surface">
                  {editingSubelementItem.acao}
                </h2>
                <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                  {getNatureLabel(editingSubelementItem.natureza, editingSubelementItem.elemento)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubelementItem(null)}
                aria-label="Fechar edição"
                className="min-h-10 min-w-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block text-xs font-bold text-on-surface">
                Nome / Descrição do Subelemento *
                <input
                  value={editSubelementName}
                  onChange={(event) => setEditSubelementName(event.target.value)}
                  placeholder="Descrição do subelemento"
                  className="mt-1 w-full rounded-lg border border-primary bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              {/* Bloco Unificado: Fonte / Vínculo & Código de Aplicação */}
              <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest/80 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Vínculo & Aplicação</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700 font-mono font-bold text-[11px]">
                    <span className="material-symbols-outlined text-[12px]">account_balance</span>
                    <span>{formatVinculoComAplicacao(editSubelementVinculo || "01", editSubelementCodigoAplicacao)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Fonte / Vínculo *
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={VINCULO_OPTIONS.some((opt) => opt.value === editSubelementVinculo) ? editSubelementVinculo : "custom"}
                        onChange={(event) => {
                          if (event.target.value !== "custom") {
                            setEditSubelementVinculo(event.target.value);
                          }
                        }}
                        className="w-full rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {VINCULO_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                        <option value="custom">Outro...</option>
                      </select>
                      {(!VINCULO_OPTIONS.some((opt) => opt.value === editSubelementVinculo) || editSubelementVinculo === "custom") && (
                        <input
                          value={editSubelementVinculo === "custom" ? "" : editSubelementVinculo}
                          onChange={(event) => setEditSubelementVinculo(event.target.value)}
                          placeholder="Ex.: 01"
                          className="w-16 rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-xs font-mono"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Código de Aplicação
                    </label>
                    <input
                      value={editSubelementCodigoAplicacao}
                      onChange={(event) => setEditSubelementCodigoAplicacao(event.target.value)}
                      placeholder="Ex.: 110.0000"
                      className="w-full rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-on-surface-variant font-normal">
                  Composição: <strong className="font-mono text-on-surface">{editSubelementVinculo || "01"}</strong> (Fonte) . <strong className="font-mono text-on-surface">{editSubelementCodigoAplicacao || "110.0000"}</strong> (Aplicação.Variável)
                </p>
              </div>

              <label className="block text-xs font-bold text-on-surface">
                Valor LOA *
                <input
                  value={editSubelementValor}
                  onChange={(event) => setEditSubelementValor(event.target.value.replace(/-/g, ""))}
                  inputMode="decimal"
                  placeholder="Ex.: 25.000,00"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right font-mono text-sm"
                />
              </label>

              <label className="block text-xs font-bold text-on-surface">
                Processo Administrativo
                <input
                  value={editSubelementProcesso}
                  onChange={(event) => setEditSubelementProcesso(event.target.value)}
                  placeholder="Opcional (Ex.: 1234/2026)"
                  className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-xs font-bold text-on-surface">
                Projeto Iniciado
                <select
                  value={editSubelementProjetoIniciado}
                  onChange={(event) => setEditSubelementProjetoIniciado(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Não informado</option>
                  <option value="SIM">SIM</option>
                  <option value="NÃO">NÃO</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-on-surface">
                Observação
                <textarea
                  value={editSubelementObservacao}
                  onChange={(event) => setEditSubelementObservacao(event.target.value)}
                  placeholder="Observação ou justificativa do subelemento..."
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container/40 p-4">
              <button
                type="button"
                onClick={() => setEditingSubelementItem(null)}
                className="min-h-11 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const newValor = parseBr(editSubelementValor);
                  const updatedPayload: Partial<RawBudgetItem> = {
                    subelemento: editSubelementName.trim() || editingSubelementItem.subelemento,
                    fonteVinculo: editSubelementVinculo.trim() || editingSubelementItem.fonteVinculo || "01",
                    codigoAplicacao: editSubelementCodigoAplicacao.trim() || undefined,
                    processo: editSubelementProcesso.trim() || "—",
                    projetoIniciado: editSubelementProjetoIniciado || undefined,
                    observacao: editSubelementObservacao.trim() || undefined,
                    valLoa: newValor,
                  };

                  setRawItems((previous) =>
                    previous.map((entry) =>
                      entry.id === editingSubelementItem.id
                        ? {
                          ...entry,
                          ...updatedPayload,
                        }
                        : entry
                    )
                  );

                  if (editSubelementObservacao.trim()) {
                    setJustifications((prev) => ({
                      ...prev,
                      [editingSubelementItem.id]: editSubelementObservacao.trim(),
                    }));
                  }

                  // Gravar no LocalStorage e no Banco de Dados
                  try {
                    const savedSubEdits = JSON.parse(localStorage.getItem("painel_loa_subelement_edits_v1") || "{}");
                    savedSubEdits[editingSubelementItem.id] = updatedPayload;
                    localStorage.setItem("painel_loa_subelement_edits_v1", JSON.stringify(savedSubEdits));
                    void fetch("/api/configuracoes/layout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        chave: "painel_loa_subelement_edits",
                        valor: savedSubEdits,
                      }),
                    });

                    // Se for item adicionado manualmente, atualizar também o registro
                    if (editingSubelementItem.id.startsWith("manual-")) {
                      const savedAdded = JSON.parse(localStorage.getItem(ADDED_EXPENSES_STORAGE_KEY) || "[]") as RawBudgetItem[];
                      const nextAdded = savedAdded.map((it) => it.id === editingSubelementItem.id ? { ...it, ...updatedPayload } : it);
                      localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify(nextAdded));
                      void fetch("/api/configuracoes/layout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          chave: "painel_loa_added_expenses",
                          valor: nextAdded,
                        }),
                      });
                    }
                  } catch (e) {
                    console.warn("Erro ao salvar customizações do subelemento:", e);
                  }

                  setHasChanges(true);
                  setEditingSubelementItem(null);
                }}
                className="min-h-11 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. POPUP MODAL: Configuração e Ordenação dos Cards e Seções */}
      <AnaliseLoaCardsConfigDialog
        isOpen={cardsConfigModalOpen}
        onClose={() => setCardsConfigModalOpen(false)}
        config={layoutConfig}
        onSaveConfig={handleSaveLayoutConfig}
        onResetConfig={handleResetLayoutConfig}
      />
    </div>
  );
}
