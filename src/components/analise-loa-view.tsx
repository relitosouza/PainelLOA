"use client";

import { Fragment, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from "react";
import { currency, percent } from "@/lib/format";
import * as XLSX from "xlsx";
import { BancoProjetosCard } from "./banco-projetos-card";
import { AddElementExpenseDialog, VINCULO_OPTIONS, formatVinculoComAplicacao } from "./add-element-expense-dialog";
import {
  AnaliseLoaCardsConfigDialog,
  DEFAULT_LAYOUT_CONFIG,
  withNewKpis,
  type AnaliseLoaLayoutConfig,
} from "./analise-loa-cards-config-dialog";
import { AuditoriaOrcamentariaModal } from "./auditoria-orcamentaria-modal";
import { AnaliseLoaAdvancedFilters } from "./analise-loa/analise-loa-advanced-filters";
import { AnaliseLoaReceitaKpis, AnaliseLoaDespesaKpis } from "./analise-loa/analise-loa-kpi-sections";
import { LOA_EXPECTATIVA, LOA_EXPECTATIVA_TOTAL, normalizeLoaExpectativaSecretaria } from "@/lib/loa-expectativa";
import { getActiveUser, DEFAULT_USER, type ActiveUser } from "@/lib/user-session";
import { openLoaReportWindow, shouldExcludeReportVinculo, type LoaReportData, type LoaReportGroup, type LoaReportSection } from "@/lib/loa-report-template";
import {
  buildAnaliseLoaItems,
  getActionTypeLabel,
  normalizeBancoProjetoAllocation,
  withAddedExpenses,
  withCustomEdits,
  withFinancialEdits,
  withSubelementEdits,
  withoutRemoved,
  type RawBudgetItem,
} from "@/lib/loa-analise-items";
import { normalizeUnidadeOrcamentaria } from "@/lib/unidades-orcamentarias-catalogo";
import { notifyAnaliseLoaSaved } from "@/lib/live-refresh";
import { normalizeActionLabel, normalizeProgramLabel } from "@/lib/loa-labels";
import {
  allocateLoa2026Initial,
  calculateAnalyticalValues,
  createBancoProjetoValues,
  parseLoa2026InitialWorkbook,
} from "@/lib/loa-analytical-values";

// --- Tipos de Filtro ---
export interface TechnicalFilterState {
  secretaria: string[];
  orgao: string[];
  unidade: string[];
  funcao: string[];
  subfuncao: string[];
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
  contrato: string[];
  observacao: string[];
  search: string;
}

const INITIAL_FILTERS: TechnicalFilterState = {
  secretaria: [],
  orgao: [],
  unidade: [],
  funcao: [],
  subfuncao: [],
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
  contrato: [],
  observacao: [],
  search: "",
};

export type { RawBudgetItem } from "@/lib/loa-analise-items";

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
  valLoa2026: number;
  valorReajuste: number;
  vigenteReajuste: number;
  valorAditamento: number;
  valorSugestaoSf: number;
  valorCorteGp: number;
  valorTotal: number;
}

type TableSortColumn = "acao" | "elemento" | "valLdo" | "valLoa2026" | "valLoa" | "valorReajuste" | "vigenteReajuste" | "valorAditamento" | "valorSugestaoSf" | "valorCorteGp" | "valorTotal" | "diff" | "status" | "adjusted";
type AnalyticalColumn = TableSortColumn;
type NaturezaOption = { codigo: string; nome: string };
type VinculoAllocation = { id: string; vinculo: string; codigoAplicacao: string; valor: string };
type NatureValidationStatus = "Pendente" | "Parcial" | "Validada";
type Iniciativa = { id?: string | number; acao?: string; secretaria?: string; programa?: string; despesa?: string; dsIniciativa?: string; programaticaLdo?: string; vinculo?: string; valorFinalPldo27?: number };
const ADDED_EXPENSES_STORAGE_KEY = "painel_loa_added_expenses_v1";
const ANALYTICAL_COLUMNS: Array<{ key: AnalyticalColumn; label: string; required?: boolean }> = [
  { key: "acao", label: "Ação", required: true },
  { key: "elemento", label: "Elemento de Despesa" },
  { key: "valLdo", label: "Valor LDO" },
  { key: "valLoa2026", label: "LOA 2026 (Inicial)" },
  { key: "valorTotal", label: "LOA 2027" },
  { key: "valLoa", label: "Vigente" },
  { key: "valorReajuste", label: "Reajuste" },
  { key: "vigenteReajuste", label: "Vigente + Reajuste" },
  { key: "valorAditamento", label: "Aditamento" },
  { key: "valorSugestaoSf", label: "Sugestão SF" },
  { key: "valorCorteGp", label: "Corte GP" },
  { key: "diff", label: "Diferença" },
  { key: "status", label: "Status" },
  { key: "adjusted", label: "Validação" },
];

// Ação e Elemento formam a coluna da árvore e ficam fixas no início; as demais podem mudar de posição.
const FIXED_ANALYTICAL_COLUMNS: AnalyticalColumn[] = ["acao", "elemento"];
const DEFAULT_COLUMN_ORDER = ANALYTICAL_COLUMNS.map((column) => column.key).filter((key) => !FIXED_ANALYTICAL_COLUMNS.includes(key));
const orderFromSaved = (saved: AnalyticalColumn[]) => [
  ...saved.filter((key) => DEFAULT_COLUMN_ORDER.includes(key)),
  ...DEFAULT_COLUMN_ORDER.filter((key) => !saved.includes(key)),
];

const getItemLoaTotal = (item: Pick<RawBudgetItem, "valLoa" | "valorReajuste" | "valorAditamento">) =>
  calculateAnalyticalValues(item).loa2027;

const getItemVigenteReajuste = (item: Pick<RawBudgetItem, "valLoa" | "valorReajuste">) =>
  calculateAnalyticalValues(item).vigenteComReajuste;

const getColumnsPreferenceKey = (user: ActiveUser) => {
  const identity = user.id || user.email || user.nome || "usuario";
  const safeIdentity = identity.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 80);
  return `analise_loa_columns_${safeIdentity || "usuario"}`;
};

const getNatureValidationStatus = (validatedCount: number, totalCount: number): NatureValidationStatus => {
  if (totalCount > 0 && validatedCount === totalCount) return "Validada";
  if (validatedCount > 0) return "Parcial";
  return "Pendente";
};


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
  const [ldoReceitaTotal, setLdoReceitaTotal] = useState<number>(5868871609.9);
  const [ldoReceitaEntidades, setLdoReceitaEntidades] = useState<Array<{ nome: string; valor: number }>>([]);
  const [loaReceitaResumo, setLoaReceitaResumo] = useState<{ total: number; maior: { natureza: string; valor: number } | null; qtdFontes: number }>({ total: 0, maior: null, qtdFontes: 0 });
  const [filters, setFilters] = useState<TechnicalFilterState>(INITIAL_FILTERS);

  const loaExpectativaTotal = useMemo(() => {
    if (filters.secretaria.length === 0) return LOA_EXPECTATIVA_TOTAL;
    const selected = new Set(filters.secretaria.map(normalizeLoaExpectativaSecretaria));
    return LOA_EXPECTATIVA.reduce((total, item) => {
      const name = normalizeLoaExpectativaSecretaria(item.secretaria);
      return total + (selected.has(name) ? item.valor : 0);
    }, 0);
  }, [filters.secretaria]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [expandedEditGroups, setExpandedEditGroups] = useState<Set<string>>(new Set());
  const [expandedNatureGroups, setExpandedNatureGroups] = useState<Set<string>>(new Set());
  const [collapsedLdoPlanningGroups, setCollapsedLdoPlanningGroups] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const analyticalScrollRef = useRef<HTMLDivElement>(null);
  const [tableSort, setTableSort] = useState<{ column: TableSortColumn; direction: "asc" | "desc" }>({ column: "acao", direction: "asc" });
  const [natureSort, setNatureSort] = useState<{ column: "natureza" | "subelementos" | "valLdo" | "valLoa" | "diff" | "status"; direction: "asc" | "desc" }>({ column: "natureza", direction: "asc" });
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [scopeTab, setScopeTab] = useState<"todos" | "contratos" | "demais">("todos");
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [visibleTableColumns, setVisibleTableColumns] = useState<Set<AnalyticalColumn>>(
    () => new Set(ANALYTICAL_COLUMNS.map((column) => column.key))
  );
  const [columnOrder, setColumnOrder] = useState<AnalyticalColumn[]>(DEFAULT_COLUMN_ORDER);
  const moveColumn = (key: AnalyticalColumn, offset: -1 | 1) =>
    setColumnOrder((current) => {
      const from = current.indexOf(key);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  // Renderiza as células de valor na ordem escolhida, alternando as faixas pela posição exibida.
  const renderOrderedCells = (cells: Partial<Record<AnalyticalColumn, ReactNode>>) => {
    let position = 0;
    return columnOrder.map((key) => {
      const cell = cells[key];
      if (!isValidElement<{ className?: string }>(cell)) return null;
      const band = position++ % 2 === 0 ? "col-band-gray" : "col-band-white";
      const className = typeof cell.props.className === "string"
        ? cell.props.className.replace(/col-band-(white|gray)/, band)
        : cell.props.className;
      return <Fragment key={key}>{cloneElement(cell, { className })}</Fragment>;
    });
  };
  const [columnsSaveState, setColumnsSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
  // Administração indireta (IPMO, IPMO-RC e FITO) não está na receita da Prefeitura (LoaReceita, UG 201).
  // A receita LOA delas entra no card pelo valor da LOA 2027 de cada entidade na planilha base.
  // A CMO fica de fora: é custeada pelo duodécimo repassado pela Prefeitura, já contido na receita da Prefeitura.
  const receitaLoaEntidades = useMemo(() => {
    const entidades = [
      { codigo: "21", nome: "IPMO" },
      { codigo: "77", nome: "IPMO - RC" },
      { codigo: "22", nome: "FITO" },
    ];
    return entidades.map(({ codigo, nome }) => ({
      nome,
      valor: Math.round(originalRawItems
        .filter((item) => item.secretaria.match(/^(\d+)\s*-/)?.[1] === codigo)
        .reduce((sum, item) => sum + item.valLoa, 0) * 100) / 100,
    }));
  }, [originalRawItems]);

  const originalValuesById = useMemo(() => new Map(originalRawItems.map((item) => [item.id, item.valLoa])), [originalRawItems]);
  const [newExpenseVinculo, setNewExpenseVinculo] = useState("01");
  const [newExpenseCodigoAplicacao, setNewExpenseCodigoAplicacao] = useState("");
  const [newExpenseProcesso, setNewExpenseProcesso] = useState("");
  const [newExpenseProjetoIniciado, setNewExpenseProjetoIniciado] = useState("");
  const [newExpenseObservacao, setNewExpenseObservacao] = useState("");
  const [newExpenseValor, setNewExpenseValor] = useState("");
  const [vinculosContext, setVinculosContext] = useState<{ group: EditableGroup; natureza: string; items: RawBudgetItem[] } | null>(null);
  const [vinculoAllocations, setVinculoAllocations] = useState<VinculoAllocation[]>([]);
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
  // Usuário Ativo
  const [currentUser, setCurrentUser] = useState<ActiveUser>(() => getActiveUser() || DEFAULT_USER);

  const openVinculosEditor = (group: EditableGroup, natureza: string, items: RawBudgetItem[]) => {
    setVinculosContext({ group, natureza, items });
    setVinculoAllocations(items.length > 0
      ? items.map((item) => ({ id: item.id, vinculo: item.fonteVinculo || "01", codigoAplicacao: item.codigoAplicacao || "", valor: item.valLoa.toFixed(2).replace(".", ",") }))
      : [{ id: crypto.randomUUID(), vinculo: "01", codigoAplicacao: "", valor: "0,00" }]);
  };

  const saveVinculos = () => {
    if (!vinculosContext) return;
    const values = vinculoAllocations.map((allocation) => ({ ...allocation, amount: parseBr(allocation.valor) }));
    if (values.some((allocation) => allocation.amount < 0 || !allocation.vinculo.trim())) {
      alert("Informe um vínculo válido e valores maiores ou iguais a zero.");
      return;
    }
    const originalTotal = vinculosContext.items.reduce((sum, item) => sum + item.valLoa, 0);
    const distributedTotal = values.reduce((sum, allocation) => sum + allocation.amount, 0);
    if (Math.abs(distributedTotal - originalTotal) > 0.01) {
      alert(`A soma dos vínculos (${formatBr(distributedTotal)}) deve ser igual ao valor da natureza (${formatBr(originalTotal)}).`);
      return;
    }
    const template = vinculosContext.items[0];
    if (!template) return;
    setRawItems((previous) => {
      const ids = new Set(vinculosContext.items.map((item) => item.id));
      const next = previous.filter((item) => !ids.has(item.id));
      values.forEach((allocation, index) => {
        const existing = vinculosContext.items.find((item) => item.id === allocation.id);
        next.push({ ...(existing ?? template), id: index === 0 ? template.id : existing && existing.id !== template.id ? existing.id : `manual-vinculo-${crypto.randomUUID()}`, fonteVinculo: allocation.vinculo.trim(), codigoAplicacao: allocation.codigoAplicacao.trim() || undefined, valLoa: allocation.amount, subelemento: template.subelemento, vinculoParentId: index === 0 ? template.vinculoParentId : template.id, valLdo: index === 0 ? template.valLdo : 0 });
      });
      return next;
    });
    setHasChanges(true);
    setVinculosContext(null);
  };

  useEffect(() => {
    setCurrentUser(getActiveUser() || DEFAULT_USER);
    const handleUserChange = () => setCurrentUser(getActiveUser() || DEFAULT_USER);
    window.addEventListener("painel-loa-user-change", handleUserChange);
    return () => window.removeEventListener("painel-loa-user-change", handleUserChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const preferenceKey = getColumnsPreferenceKey(currentUser);
    const loadColumnsPreference = async () => {
      try {
        const response = await fetch(`/api/configuracoes/layout?chave=${encodeURIComponent(preferenceKey)}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.valor) && isMounted) {
            const savedColumns = new Set<AnalyticalColumn>(data.valor.filter((column: unknown): column is AnalyticalColumn =>
              typeof column === "string" && ANALYTICAL_COLUMNS.some((available) => available.key === column)
            ));
            ANALYTICAL_COLUMNS.filter((column) => column.required).forEach((column) => savedColumns.add(column.key));
            setVisibleTableColumns(savedColumns);
            setColumnOrder(orderFromSaved([...savedColumns]));
            return;
          }
        }
      } catch (error) {
        console.warn("Falha ao carregar colunas salvas do usuário:", error);
      }

      try {
        const saved = localStorage.getItem(`${preferenceKey}_v1`);
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const savedColumns = new Set<AnalyticalColumn>(parsed.filter((column: unknown): column is AnalyticalColumn =>
              typeof column === "string" && ANALYTICAL_COLUMNS.some((available) => available.key === column)
            ));
            ANALYTICAL_COLUMNS.filter((column) => column.required).forEach((column) => savedColumns.add(column.key));
            setVisibleTableColumns(savedColumns);
            setColumnOrder(orderFromSaved([...savedColumns]));
          }
        }
      } catch { }
    };

    loadColumnsPreference();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const saveColumnsPreference = async () => {
    const columns = [...FIXED_ANALYTICAL_COLUMNS, ...columnOrder].filter((key) => visibleTableColumns.has(key));
    const preferenceKey = getColumnsPreferenceKey(currentUser);
    setColumnsSaveState("saving");
    try {
      localStorage.setItem(`${preferenceKey}_v1`, JSON.stringify(columns));
      const response = await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: preferenceKey, valor: columns }),
      });
      if (!response.ok) throw new Error("Falha ao salvar preferência");
      setColumnsSaveState("saved");
    } catch (error) {
      console.error("Erro ao salvar colunas do usuário:", error);
      setColumnsSaveState("error");
    }
  };

  // Verifica se o usuário atual tem permissão para validar dotações da secretaria
  const canUserValidateSecretaria = (secretariaName?: string) => {
    if (currentUser.papel === "ADMIN" || currentUser.papel === "PLANEJAMENTO") return true;
    if (currentUser.papel === "LEITURA") return false;
    if (currentUser.papel === "TECNICO_SECRETARIA") {
      if (!currentUser.codigoSecretaria && !currentUser.secretaria) return true;
      const userCod = currentUser.codigoSecretaria?.trim();
      const userSec = currentUser.secretaria?.trim().toLowerCase();
      if (!secretariaName) return true;
      const itemSec = secretariaName.trim().toLowerCase();

      if (userCod && (itemSec.startsWith(userCod) || itemSec.includes(` ${userCod} `) || itemSec.startsWith(`${userCod} -`) || itemSec.startsWith(`${userCod}.`))) return true;
      if (userSec && (itemSec.includes(userSec) || userSec.includes(itemSec))) return true;
      return false;
    }
    return false;
  };

  // Estado para Rastrear Linhas Validadas pelo Usuário (sem alteração)
  const [validatedRows, setValidatedRows] = useState<Record<string, boolean>>({});

  const toggleValidateRow = async (rowId: string, itemSecretaria?: string) => {
    if (itemSecretaria && !canUserValidateSecretaria(itemSecretaria)) {
      alert(`Acesso Restrito: Seu perfil (${currentUser.cargo || currentUser.nome}) possui permissão para validar somente dotações da sua secretaria (${currentUser.secretaria || currentUser.codigoSecretaria || "Setorial"}).`);
      return;
    }

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
              receitaKpisOrder: withNewKpis(parsed.receitaKpisOrder, DEFAULT_LAYOUT_CONFIG.receitaKpisOrder),
              despesaKpisOrder: withNewKpis(parsed.despesaKpisOrder, DEFAULT_LAYOUT_CONFIG.despesaKpisOrder),
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
            receitaKpisOrder: withNewKpis(parsed.receitaKpisOrder, DEFAULT_LAYOUT_CONFIG.receitaKpisOrder),
            despesaKpisOrder: withNewKpis(parsed.despesaKpisOrder, DEFAULT_LAYOUT_CONFIG.despesaKpisOrder),
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

    type LdoItemMatch = { indicador?: string; produto?: string; unidMedida?: string; custoFisico2027?: number; custoFinanceiro2027?: number };
    const dataIndexes = ldoPlanningJson as {
      bySecProgAcao?: Record<string, LdoItemMatch>;
      bySecAcao?: Record<string, LdoItemMatch>;
      byProgAcao?: Record<string, LdoItemMatch>;
      byAcao?: Record<string, LdoItemMatch>;
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
    const secAcaoMatch = dataIndexes.bySecAcao?.[keySecAcao];
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
    filters.funcao,
    filters.subfuncao,
    filters.programa,
    filters.acao,
    filters.natureza,
    filters.fonteVinculo,
    filters.elemento,
    filters.subelemento,
    filters.contrato,
    filters.observacao,
    filters.search,
  ]);

  // Estado para controlar a célula em foco de edição (id + campo: 'valLdo' | 'valLoa')
  const [editingCell, setEditingCell] = useState<{ id: string; field: "valLdo" | "valLoa" | "valorReajuste" | "valorAditamento" | "valorSugestaoSf" | "valorCorteGp" | "groupValLoa" } | null>(null);
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
                  unidade: normalizeUnidadeOrcamentaria(organStr, unitStr, programStr || groupKey),
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
        buildAnaliseLoaItems(rows as unknown[][], nomMap).forEach((item) => loaMap.set(item.id, item));

        // A LOA 2026 é publicada por natureza de despesa, sem subelemento/processo. O valor Inicial é
        // distribuído entre os subelementos só para que os totais por natureza fechem; na tela ele
        // aparece apenas até o nível de natureza.
        let baseItems = [...loaMap.values()].map((item) => ({ ...item, valLoa2026: 0 }));
        try {
          const loa2026Response = await fetch(`/loa_2026.xls?t=${Date.now()}`, { cache: "no-store" });
          if (loa2026Response.ok) {
            const loa2026Totals = parseLoa2026InitialWorkbook(await loa2026Response.arrayBuffer());
            baseItems = allocateLoa2026Initial(baseItems, loa2026Totals);
          }
        } catch (loa2026Error) {
          console.warn("Não foi possível carregar a LOA 2026:", loa2026Error);
        }

        // Guardar cópia original inalterada para comparação em modificações
        setOriginalRawItems(JSON.parse(JSON.stringify(baseItems)));

        // Carregar alterações de LOA salvas no Banco de Dados / localStorage (se existirem)
        let itemsArray: RawBudgetItem[] = baseItems;

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
            itemsArray = withAddedExpenses(itemsArray, addedList);
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
          itemsArray = withoutRemoved(itemsArray, removedIds);
        } catch { }

        // 3. Carregar e aplicar edições de valores
        try {
          let customMap: Record<string, number> = {};
          const resCustom = await fetch("/api/configuracoes/layout?chave=painel_loa_custom_edits");
          if (resCustom.ok) {
            const data = await resCustom.json();
            if (data.success && data.valor) customMap = data.valor;
          }
          itemsArray = withCustomEdits(itemsArray, customMap);

          let loadedJustifications: Record<string, string> = {};
          const resJust = await fetch("/api/configuracoes/layout?chave=painel_loa_justifications");
          if (resJust.ok) {
            const data = await resJust.json();
            if (data.success && data.valor) loadedJustifications = data.valor;
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
          itemsArray = withSubelementEdits(itemsArray, subelementEdits);
        } catch (e) {
          console.warn("Erro ao carregar customizações de subelementos:", e);
        }

        // 3.6. Carregar reajustes e aditamentos digitados no detalhamento analítico
        try {
          const response = await fetch("/api/configuracoes/layout?chave=painel_loa_reajustes_aditamentos");
          if (response.ok) {
            const data = await response.json();
            const financialEdits = data.success && data.valor
              ? data.valor as Record<string, { valorReajuste?: number; valorAditamento?: number; valorSugestaoSf?: number; valorCorteGp?: number }>
              : {};
            itemsArray = withFinancialEdits(itemsArray, financialEdits);
          }
        } catch (e) {
          console.warn("Erro ao carregar reajustes e aditamentos:", e);
        }
        // Projetos novos vão para Aditamento só depois do merge acima: o Aditamento salvo (0) não pode zerar o projeto.
        itemsArray = itemsArray.map(normalizeBancoProjetoAllocation);

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
          const apiRes = await fetch("/api/analises-combinadas?exercicio=2027");
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData?.totais?.totalReceitaLdo) {
              setLdoReceitaTotal(Number(apiData.totais.totalReceitaLdo) || 0);
            }
            if (Array.isArray(apiData?.totais?.ldoEntidades)) setLdoReceitaEntidades(apiData.totais.ldoEntidades);
            setLoaReceitaResumo({
              total: Number(apiData?.totais?.totalLoaReceitas) || 0,
              maior: apiData?.totais?.maiorReceitaLoa ?? null,
              qtdFontes: Number(apiData?.totais?.qtdFontesLoaReceita) || 0,
            });
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
    const savedMap = new Map(savedRawItems.map((item) => [item.id, item]));
    return rawItems.filter((item) => {
      const saved = savedMap.get(item.id);
      return saved !== undefined && (
        Math.abs(item.valLoa - saved.valLoa) > 0.001 ||
        Math.abs((item.valorReajuste ?? 0) - (saved.valorReajuste ?? 0)) > 0.001 ||
        Math.abs((item.valorAditamento ?? 0) - (saved.valorAditamento ?? 0)) > 0.001 ||
        Math.abs((item.valorSugestaoSf ?? 0) - (saved.valorSugestaoSf ?? 0)) > 0.001 ||
        Math.abs((item.valorCorteGp ?? 0) - (saved.valorCorteGp ?? 0)) > 0.001
      );
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

  // Cancelar a edição e reverter todos os campos editados ao valor anterior (antes de abrir o modal)
  const handleCancelSaveModal = () => {
    setRawItems(JSON.parse(JSON.stringify(savedRawItems)));
    setRemovedRawItems([]);
    setHasChanges(false);
    setSaveModalOpen(false);
  };

  const handleAddExpense = async () => {
    if (!addExpenseGroup) return;
    const value = parseBr(newExpenseValor);
    if (isNaN(value) || value < 0) return;

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
      unidade: template?.unidade || normalizeUnidadeOrcamentaria(addExpenseGroup.secretaria, "001"),
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

    const existingManualItems = rawItems.filter((i) => i.id.startsWith("manual-") && i.id !== newItem.id);
    const addedList = [...existingManualItems, newItem];

    setRawItems((previous) => [...previous, newItem]);
    setSavedRawItems((previous) => [...previous, newItem]);
    setOriginalRawItems((previous) => [...previous, newItem]);

    try {
      localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify(addedList));
    } catch { }

    try {
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "painel_loa_added_expenses", valor: addedList }),
      });
    } catch (err) {
      console.error("Erro ao salvar despesa no banco:", err);
    }

    const natureKey = `${addExpenseGroup.id}|${naturezaFinal}`;
    setExpandedEditGroups((previous) => new Set(previous).add(addExpenseGroup.id));
    setExpandedNatureGroups((previous) => new Set(previous).add(natureKey));
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

  const handleAllocateBancoProjeto = async (project: { secretaria: string; objeto: string; natureza: string; descricaoDespesa?: string; valor: number }) => {
    const naturezaCodigo = project.natureza.split("-")[0].trim();
    const projectValues = createBancoProjetoValues(project.valor);
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
      subelemento: project.descricaoDespesa?.trim() || "",
      processo: "—",
      valLdo: 0,
      valLoa2026: 0,
      ...projectValues,
      origem: "Banco de Projetos",
      bancoProjetoKey: [project.secretaria, project.objeto, project.natureza, project.valor].join("|"),
    };

    setRawItems((previous) => [...previous, item]);
    setSavedRawItems((previous) => [...previous, item]);
    setOriginalRawItems((previous) => [...previous, item]);
    setHasChanges(true);

    // Persistir como despesa adicionada na base para ser recarregada em novas sessões
    try {
      const existingAdded = (JSON.parse(localStorage.getItem(ADDED_EXPENSES_STORAGE_KEY) || "[]") as RawBudgetItem[])
        .filter((entry) => entry.id !== item.id);
      const nextAdded = [...existingAdded, item];
      localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify(nextAdded));
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "painel_loa_added_expenses", valor: nextAdded }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar alocação do banco de projetos:", err);
    }
  };

  // A lista de exclusões é compartilhada entre sessões, navegadores e usuários.
  // Montá-la apenas a partir do localStorage faria o POST sobrescrever no banco
  // as exclusões registradas em outros ambientes, por isso o estado persistido é
  // sempre mesclado antes de gravar.
  const mergeRemovedExpenseIds = async (newId: string): Promise<string[] | null> => {
    let persisted: string[] = [];
    try {
      const res = await fetch("/api/configuracoes/layout?chave=painel_loa_removed_expenses");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.valor)) persisted = data.valor;
      }
    } catch {
      // Sem resposta do banco mantém-se apenas o histórico local desta sessão.
    }
    const local = JSON.parse(localStorage.getItem("painel_loa_removed_expenses_v1") || "[]") as string[];
    const merged = [...new Set([...persisted, ...local])];
    if (merged.includes(newId)) {
      localStorage.setItem("painel_loa_removed_expenses_v1", JSON.stringify(merged));
      return null;
    }
    const next = [...merged, newId];
    localStorage.setItem("painel_loa_removed_expenses_v1", JSON.stringify(next));
    return next;
  };

  const handleRemoveBancoProjeto = async (item: RawBudgetItem) => {
    if (!window.confirm(`Deseja remover o projeto "${item.acao}" alocado na LOA?`)) return;

    // 1. Atualizar o estado da tela
    setRawItems((previous) => previous.filter((entry) => entry.id !== item.id));
    setSavedRawItems((previous) => previous.filter((entry) => entry.id !== item.id));
    setOriginalRawItems((previous) => previous.filter((entry) => entry.id !== item.id));

    // 2. Remover da lista de despesas adicionadas persistidas
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

    // 3. Registrar na lista de despesas removidas
    try {
      const nextRemoved = await mergeRemovedExpenseIds(item.id);
      if (nextRemoved) {
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

    setRemovedRawItems((prev) => [...prev.filter((entry) => entry.id !== item.id), item]);
    setHasChanges(false);
  };

  // Confirmar e Gravar Alterações + Justificativas no localStorage
  const confirmSaveEdits = async () => {
    try {
      // Separar os itens modificados em: com justificativa e sem justificativa
      const savedMap = new Map(savedRawItems.map((item) => [item.id, item.valLoa]));
      const savedItemsMap = new Map(savedRawItems.map((item) => [item.id, item]));

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
          const saved = savedItemsMap.get(item.id);
          return {
            ...item,
            valLoa: saved?.valLoa ?? item.valLdo,
            valorReajuste: saved?.valorReajuste ?? 0,
            valorAditamento: saved?.valorAditamento ?? 0,
            valorSugestaoSf: saved?.valorSugestaoSf ?? 0,
            valorCorteGp: saved?.valorCorteGp ?? 0,
          };
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

      // Gravar alterações e justificativas no Banco de Dados
      const customMap: Record<string, number> = {};
      const financialAdjustments: Record<string, { valorReajuste: number; valorAditamento: number; valorSugestaoSf: number; valorCorteGp: number }> = {};
      finalItems.forEach((item) => {
        customMap[item.id] = item.valLoa;
        financialAdjustments[item.id] = {
          valorReajuste: item.valorReajuste ?? 0,
          valorAditamento: item.valorAditamento ?? 0,
          valorSugestaoSf: item.valorSugestaoSf ?? 0,
          valorCorteGp: item.valorCorteGp ?? 0,
        };
      });

      setJustifications(validJustifications);

      // Persistir no Banco de Dados (Tabelas Relacionais de Auditoria + Fallback de Layout)
      try {
        const alteracoesPayload = modifiedItems
          .filter((item) => !itemsToRevert.includes(item.id))
          .map((item) => ({
            dotacaoId: item.id,
            exercicio: 2027,
            secretaria: item.secretaria,
            programa: item.programa,
            acao: item.acao,
            natureza: item.natureza,
            subelemento: item.subelemento,
            processo: item.processo,
            apelido: "apelido" in item ? String((item as Record<string, unknown>).apelido) : null,
            valorAnterior: savedMap.get(item.id) ?? item.valLdo,
            valorNovo: item.valLoa,
            justificativa: validJustifications[item.id] || "Ajuste orçamentário aprovado",
            tipoAlteracao: "AJUSTE_VALOR",
          }));

        const exclusoesPayload = removedRawItems
          .filter((item) => !restoredFromRemoval.some((r) => r.id === item.id))
          .map((item) => ({
            dotacaoId: item.id,
            exercicio: 2027,
            secretaria: item.secretaria,
            programa: item.programa,
            acao: item.acao,
            natureza: item.natureza,
            subelemento: item.subelemento,
            processo: item.processo,
            apelido: "apelido" in item ? String((item as Record<string, unknown>).apelido) : null,
            valorOriginal: item.valLoa,
            dadosOriginais: item,
            motivoExclusao: validJustifications[item.id] || "Exclusão de dotação",
          }));

        if (alteracoesPayload.length > 0 || exclusoesPayload.length > 0) {
          void fetch("/api/orcamento/alteracoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nomeOperador: currentUser.nome || "Técnico Responsável",
              emailOperador: currentUser.email || null,
              justificativaGeral: `Ajuste em lote por ${currentUser.nome} (${currentUser.secretaria || "Geral"})`,
              alteracoes: alteracoesPayload.length > 0 ? alteracoesPayload : undefined,
              exclusoes: exclusoesPayload,
            }),
          });
        }

        const addedExpensesToPersist = finalItems.filter((i) => i.id.startsWith("manual-") || i.id.startsWith("banco-projeto-"));

        const responses = await Promise.all([
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
          fetch("/api/configuracoes/layout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chave: "painel_loa_reajustes_aditamentos",
              valor: financialAdjustments,
            }),
          }),
          fetch("/api/configuracoes/layout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chave: "painel_loa_added_expenses",
              valor: addedExpensesToPersist,
            }),
          }),
        ]);
        try {
          localStorage.setItem(ADDED_EXPENSES_STORAGE_KEY, JSON.stringify(addedExpensesToPersist));
        } catch { }
        if (responses.some((response) => !response.ok)) {
          throw new Error("O banco de dados recusou o salvamento das alterações.");
        }
      } catch (err) {
        console.error("Erro ao persistir edições no banco:", err);
        setSavingState("idle");
        setSaveError("Não foi possível salvar as alterações no banco de dados.");
        return;
      }

      setHasChanges(false);
      setSaveModalOpen(false);
      setSavingState("saved");
      notifyAnaliseLoaSaved();

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
        if (fieldToIgnore !== "funcao" && !match(filters.funcao, item.funcao || "")) return false;
        if (fieldToIgnore !== "subfuncao" && !match(filters.subfuncao, item.subfuncao || "")) return false;
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
        if (fieldToIgnore !== "contrato" && !match(filters.contrato, item.contrato || item.projetoIniciado || "")) return false;
        if (fieldToIgnore !== "observacao" && !match(filters.observacao, item.observacao || "")) return false;

        return true;
      });
    };

    return {
      secretaria: getOptions("secretaria", getItemsForField("secretaria")),
      orgao: getOptions("orgao", getItemsForField("orgao")),
      unidade: getOptions("unidade", getItemsForField("unidade")),
      funcao: getOptions("funcao", getItemsForField("funcao")),
      subfuncao: getOptions("subfuncao", getItemsForField("subfuncao")),
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
      contrato: Array.from(
        new Set(
          getItemsForField("contrato")
            .map((item) => String(item.contrato || item.projetoIniciado || ""))
            .filter(Boolean)
        )
      ).sort(),
      observacao: getOptions("observacao", getItemsForField("observacao")),
    };
  }, [rawItems, filters]);

  // Aplicação Dinâmica dos Filtros
  const itemMatchesFilters = useCallback((item: RawBudgetItem) => {
      const match = (fieldValues: string[] | undefined, itemValue: string) =>
        !fieldValues || !fieldValues.length || fieldValues.includes(itemValue);

      if (!match(filters.secretaria, item.secretaria)) return false;
      if (!match(filters.orgao, item.orgao)) return false;
      if (!match(filters.unidade, item.unidade)) return false;
      if (!match(filters.funcao, item.funcao || "")) return false;
      if (!match(filters.subfuncao, item.subfuncao || "")) return false;
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
      if (!match(filters.contrato, item.contrato || item.projetoIniciado || "")) return false;
      if (!match(filters.observacao, item.observacao || "")) return false;

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const fullText = `${item.secretaria} ${item.funcao || ""} ${item.subfuncao || ""} ${item.programa} ${item.acao} ${item.natureza} ${item.subelemento} ${item.processo} ${item.contrato || item.projetoIniciado || ""} ${item.observacao || ""}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      return true;
  }, [filters]);

  const filteredItems = useMemo(() => rawItems.filter(itemMatchesFilters), [rawItems, itemMatchesFilters]);

  const isItemContrato = (item: RawBudgetItem) => {
    const ini = String(item.projetoIniciado || item.contrato || "").trim().toUpperCase();
    return ini === "SIM";
  };

  const scopeStats = useMemo(() => {
    let countTodos = 0;
    let totalTodos = 0;
    let countContratos = 0;
    let totalContratos = 0;
    let countDemais = 0;
    let totalDemais = 0;

    filteredItems.forEach((item) => {
      const total = getItemLoaTotal(item);
      countTodos++;
      totalTodos += total;
      if (isItemContrato(item)) {
        countContratos++;
        totalContratos += total;
      } else {
        countDemais++;
        totalDemais += total;
      }
    });

    return {
      todos: { count: countTodos, total: totalTodos },
      contratos: { count: countContratos, total: totalContratos },
      demais: { count: countDemais, total: totalDemais },
    };
  }, [filteredItems]);

  const itemMatchesTable = useCallback((item: RawBudgetItem) => {
      if (scopeTab === "contratos" && !isItemContrato(item)) return false;
      if (scopeTab === "demais" && isItemContrato(item)) return false;
      if (statusFilters.length > 0) {
        const matchesFilter = statusFilters.some((filter) => filter === getStatusLabel(item.valLdo, getItemLoaTotal(item)));
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
  }, [scopeTab, statusFilters, tableSearch]);

  const tableItems = useMemo(() => filteredItems.filter(itemMatchesTable), [filteredItems, itemMatchesTable]);

  // Despesas excluídas saem da LOA, mas o valor planejado na LDO continua valendo no total LDO.
  const removedLdoTotal = useMemo(() => {
    const currentIds = new Set(rawItems.map((item) => item.id));
    return originalRawItems
      .filter((item) => item.valLdo !== 0 && !currentIds.has(item.id))
      .map((item) => ({ ...item, valLoa: 0, valorReajuste: 0, valorAditamento: 0 }))
      .filter((item) => itemMatchesFilters(item) && itemMatchesTable(item))
      .reduce((sum, item) => sum + item.valLdo, 0);
  }, [rawItems, originalRawItems, itemMatchesFilters, itemMatchesTable]);


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
        valLoa2026: 0,
        valorReajuste: 0,
        vigenteReajuste: 0,
        valorAditamento: 0,
        valorSugestaoSf: 0,
        valorCorteGp: 0,
        valorTotal: 0,
      };
      group.children.push(item);
      group.valLdo += item.valLdo || 0;
      group.valLoa += item.valLoa;
      group.valLoa2026 += item.valLoa2026 ?? 0;
      group.valorReajuste += item.valorReajuste ?? 0;
      group.vigenteReajuste += getItemVigenteReajuste(item);
      group.valorAditamento += item.valorAditamento ?? 0;
      group.valorSugestaoSf += item.valorSugestaoSf ?? 0;
      group.valorCorteGp += item.valorCorteGp ?? 0;
      group.valorTotal += getItemLoaTotal(item);
      groups.set(groupKey, group);
    });

    groups.forEach((group) => {
      if (group.valLdo === 0) {
        const ldoData = getLdoPlanningForGroup(group);
        if (ldoData?.custoFinanceiro2027 !== undefined && ldoData.custoFinanceiro2027 > 0) {
          group.valLdo = ldoData.custoFinanceiro2027;
        }
      }
    });

    const getValidated = (item: RawBudgetItem) => validatedRows[item.id] ? 1 : 0;
    const compareText = (left: string, right: string) => left.localeCompare(right, "pt-BR", { numeric: true, sensitivity: "base" });
    const compareGroup = (left: EditableGroup, right: EditableGroup) => {
      const leftFromBank = left.children.some((item) => item.origem === "Banco de Projetos");
      const rightFromBank = right.children.some((item) => item.origem === "Banco de Projetos");
      if (leftFromBank !== rightFromBank) return leftFromBank ? 1 : -1;
      let result = 0;
      if (tableSort.column === "acao") result = compareText(left.acao, right.acao);
      else if (tableSort.column === "elemento") result = compareText(left.elemento, right.elemento);
      else if (tableSort.column === "valLdo") result = left.valLdo - right.valLdo;
      else if (tableSort.column === "valLoa2026") result = left.valLoa2026 - right.valLoa2026;
      else if (tableSort.column === "valLoa") result = left.valLoa - right.valLoa;
      else if (tableSort.column === "valorReajuste") result = left.valorReajuste - right.valorReajuste;
      else if (tableSort.column === "vigenteReajuste") result = left.vigenteReajuste - right.vigenteReajuste;
      else if (tableSort.column === "valorAditamento") result = left.valorAditamento - right.valorAditamento;
      else if (tableSort.column === "valorSugestaoSf") result = left.valorSugestaoSf - right.valorSugestaoSf;
      else if (tableSort.column === "valorCorteGp") result = left.valorCorteGp - right.valorCorteGp;
      else if (tableSort.column === "valorTotal") result = left.valorTotal - right.valorTotal;
      else if (tableSort.column === "diff") result = (left.valorTotal - left.valLdo) - (right.valorTotal - right.valLdo);
      else if (tableSort.column === "status") result = compareText(getStatusLabel(left.valLdo, left.valorTotal), getStatusLabel(right.valLdo, right.valorTotal));
      else result = Number(Boolean(validatedRows[left.id])) - Number(Boolean(validatedRows[right.id]));
      return tableSort.direction === "asc" ? result : -result;
    };
    const compareChild = (left: RawBudgetItem, right: RawBudgetItem) => {
      let result = 0;
      if (tableSort.column === "acao") result = compareText(left.natureza || left.elemento, right.natureza || right.elemento);
      else if (tableSort.column === "elemento") result = compareText(left.elemento, right.elemento);
      else if (tableSort.column === "valLdo") result = left.valLdo - right.valLdo;
      else if (tableSort.column === "valLoa2026") result = (left.valLoa2026 ?? 0) - (right.valLoa2026 ?? 0);
      else if (tableSort.column === "valLoa") result = left.valLoa - right.valLoa;
      else if (tableSort.column === "valorReajuste") result = (left.valorReajuste ?? 0) - (right.valorReajuste ?? 0);
      else if (tableSort.column === "vigenteReajuste") result = getItemVigenteReajuste(left) - getItemVigenteReajuste(right);
      else if (tableSort.column === "valorAditamento") result = (left.valorAditamento ?? 0) - (right.valorAditamento ?? 0);
      else if (tableSort.column === "valorSugestaoSf") result = (left.valorSugestaoSf ?? 0) - (right.valorSugestaoSf ?? 0);
      else if (tableSort.column === "valorCorteGp") result = (left.valorCorteGp ?? 0) - (right.valorCorteGp ?? 0);
      else if (tableSort.column === "valorTotal") result = getItemLoaTotal(left) - getItemLoaTotal(right);
      else if (tableSort.column === "diff") result = (getItemLoaTotal(left) - left.valLdo) - (getItemLoaTotal(right) - right.valLdo);
      else if (tableSort.column === "status") result = compareText(getStatusLabel(left.valLdo, getItemLoaTotal(left)), getStatusLabel(right.valLdo, getItemLoaTotal(right)));
      else result = getValidated(left) - getValidated(right);
      return tableSort.direction === "asc" ? result : -result;
    };

    return Array.from(groups.values()).map((group) => ({
      ...group,
      children: [...group.children].sort(compareChild),
    })).sort(compareGroup);
  }, [tableItems, tableSort, validatedRows, ldoPlanningMap]);

  const totalTablePages = useMemo(
    () => Math.max(1, Math.ceil(editableGroups.length / tablePageSize)),
    [editableGroups.length, tablePageSize]
  );

  // Ao trocar de página ou de quantidade por página, volta ao topo da tabela para a mudança ficar visível.
  useEffect(() => {
    const scroller = analyticalScrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: 0 });
    if (scroller.getBoundingClientRect().top < 0) scroller.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [tablePage, tablePageSize]);

  const paginatedEditableGroups = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return editableGroups.slice(start, start + tablePageSize);
  }, [editableGroups, tablePage, tablePageSize]);

  // Métricas Recalculadas Instantaneamente para os Cards Superiores
  const metrics = useMemo(() => {
    let valLoaTotal = 0;
    let valLoa2026Total = 0;
    let valLoaVigenteTotal = 0;
    let valorReajusteTotal = 0;
    let vigenteReajusteTotal = 0;
    let valorAditamentoTotal = 0;
    let valorSugestaoSfTotal = 0;
    let valorCorteGpTotal = 0;
    const acoesSet = new Set<string>();
    const naturezasSet = new Set<string>();

    tableItems.forEach((item) => {
      valLoaTotal += getItemLoaTotal(item);
      valLoa2026Total += item.valLoa2026 ?? 0;
      valLoaVigenteTotal += item.valLoa;
      valorReajusteTotal += item.valorReajuste ?? 0;
      vigenteReajusteTotal += getItemVigenteReajuste(item);
      valorAditamentoTotal += item.valorAditamento ?? 0;
      valorSugestaoSfTotal += item.valorSugestaoSf ?? 0;
      valorCorteGpTotal += item.valorCorteGp ?? 0;
      if (item.acao) acoesSet.add(item.acao);
      if (item.natureza) naturezasSet.add(item.natureza);
    });

    // LDO oficial: soma das linhas LDO (inclusive as excluídas da LOA). O custo da PLDO que a tabela mostra
    // nos grupos sem LDO é só referência e não entra no total.
    const valLdoTotal = Math.round((tableItems.reduce((acc, item) => acc + (item.valLdo || 0), 0) + removedLdoTotal) * 100) / 100;
    const diff = valLoaTotal - valLdoTotal;
    const percentExec = valLdoTotal > 0 ? (valLoaTotal / valLdoTotal) * 100 : 100;

    return {
      valLdoTotal,
      valLoaTotal,
      valLoa2026Total,
      valLoaVigenteTotal,
      valorReajusteTotal,
      vigenteReajusteTotal,
      valorAditamentoTotal,
      valorSugestaoSfTotal,
      valorCorteGpTotal,
      diff,
      percentExec,
      totalAcoes: acoesSet.size,
      totalNaturezas: naturezasSet.size,
    };
  }, [tableItems, removedLdoTotal]);

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
      const itemTotal = getItemLoaTotal(item);
      const diff = itemTotal - item.valLdo;
      if (diff > maiorAumento.val) {
        maiorAumento = { item: `${item.acao} — ${item.subelemento || item.natureza}`, val: diff };
      }
      if (diff < maiorReducao.val) {
        maiorReducao = { item: `${item.acao} — ${item.subelemento || item.natureza}`, val: diff };
      }

      if (item.valLdo === 0 && itemTotal > 0) novasDotacoes++;
      if (item.valLdo > 0 && itemTotal === 0) dotacoesRemovidas++;

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
  const [pivotSort, setPivotSort] = useState<{ column: "codigo" | "nome" | "valLoa" | "diff"; direction: "asc" | "desc" }>({ column: "codigo", direction: "asc" });
  // Clique no cabeçalho: mesma coluna inverte a direção; coluna nova começa em Maior → Menor (A → Z no nome).
  const togglePivotSort = (column: "nome" | "valLoa" | "diff") =>
    setPivotSort((current) => current.column === column
      ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
      : { column, direction: column === "nome" ? "asc" : "desc" });

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

    // Ordenação por valor (Fixação LOA) em todos os níveis; em "codigo" mantém a ordem de inserção dos filhos.
    const sign = pivotSort.direction === "asc" ? 1 : -1;
    const byColumn = (a: TreeNode, b: TreeNode) =>
      pivotSort.column === "nome"
        ? sign * a.name.localeCompare(b.name, "pt-BR", { numeric: true, sensitivity: "base" })
        : pivotSort.column === "diff"
          ? sign * (a.diff - b.diff)
          : sign * (a.valLoa - b.valLoa);
    const sortChildren = (node: TreeNode): TreeNode =>
      node.children
        ? { ...node, children: (pivotSort.column === "codigo" ? node.children : [...node.children].sort(byColumn)).map(sortChildren) }
        : node;
    const sortRoots = (nodes: TreeNode[]) =>
      pivotSort.column === "codigo" ? nodes.sort((a, b) => getSecCode(a.name) - getSecCode(b.name)) : nodes.sort(byColumn);

    // As entidades da administração indireta continuam no fim, também ordenadas pelo critério escolhido.
    const regularNodes = sortRoots(rootNodes.filter((n) => !isSpecialBottom(n.name))).map(sortChildren);

    const bottomNodes = sortRoots(rootNodes.filter((n) => isSpecialBottom(n.name)))
      .map(sortChildren)
      .map((n) => ({ ...n, isSpecialBottom: true }));

    return [...regularNodes, ...bottomNodes];
  }, [filteredItems, pivotSort]);

  // Função para determinar o status e badge de cada linha
  const getStatusInfo = (valLdo: number, valLoa: number) => {
    if (valLdo === 0 && valLoa > 0) return { label: "Nova Dotação", class: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    if (valLdo > 0 && valLoa === 0) return { label: "Removida", class: "bg-rose-100 text-rose-800 border-rose-300" };
    if (valLoa > valLdo) return { label: "Suplementada", class: "bg-blue-100 text-blue-800 border-blue-300" };
    if (valLoa < valLdo) return { label: "Reduzida", class: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Sem alteração", class: "bg-surface-container text-on-surface-variant border-outline-variant" };
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
      const nextRemoved = await mergeRemovedExpenseIds(item.id);
      if (nextRemoved) {
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
  const exportDetailedCsv = () => {
    const extractCode = (value?: string) => value?.trim().match(/^[\d.]+/)?.[0] ?? "";
    const classificationKey = (item: RawBudgetItem) => [item.secretaria, item.unidade, item.programa, item.acao].join("|");
    const classificationByContext = new Map<string, RawBudgetItem>();
    const classificationByAction = new Map<string, RawBudgetItem>();
    rawItems.forEach((item) => {
      if (!item.programaticaLoa) return;
      classificationByContext.set(classificationKey(item), item);
      if (!classificationByAction.has(item.acao)) classificationByAction.set(item.acao, item);
    });
    const headers = [
      "UG", "secretaria", "unidade", "funcao", "subfuncao", "programa", "acao", "natureza",
      "Programática_LOA", "secretaria", "unidade", "funcao", "subfuncao", "programa", "acao",
      "natureza", "desc_sub", "processo", " valor ", "Peça Orçamentária", "Vínculo",
      "Tipo de despesa", "INICIADO", "OBS.",
    ];
    const escapeCell = (value: string | number) => {
      const text = String(value ?? "");
      return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows = tableItems.map((item) => {
      const reference = classificationByContext.get(classificationKey(item)) || classificationByAction.get(item.acao);
      const functionName = item.funcao || reference?.funcao || "";
      const subfunction = item.subfuncao || reference?.subfuncao || "";
      const programaticaLoa = item.programaticaLoa || reference?.programaticaLoa || "";
      const secretariaCode = extractCode(item.secretaria);
      const vinculo = item.codigoAplicacao
        ? `${item.fonteVinculo || ""}.${item.codigoAplicacao}`
        : item.fonteVinculo || "";
      return [
        secretariaCode,
        secretariaCode,
        extractCode(item.unidade),
        extractCode(functionName),
        extractCode(subfunction),
        extractCode(item.programa),
        extractCode(item.acao),
        extractCode(item.natureza),
        programaticaLoa,
        item.secretaria,
        item.unidade,
        functionName,
        subfunction,
        item.programa,
        item.acao,
        item.natureza,
        item.subelemento || "",
        item.processo || "",
        getItemLoaTotal(item),
        "LOA",
        vinculo,
        item.tipoAcao || getActionTypeLabel(item.acao),
        item.projetoIniciado || "",
        item.observacao || (justifications[item.id] || "").trim(),
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "detalhamento-analitico-editavel.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // 1. Aba: Visão Geral das Ações Orçamentárias
    const acoesData = editableGroups.map((group) => {
      const ldoData = getLdoPlanningForGroup(group);
      return {
        Secretaria: group.secretaria,
        Programa: group.programa,
        Ação: group.acao,
        "Valor LDO (R$)": group.valLdo,
        "Valor LOA Vigente (R$)": group.valLoa,
        "Valor Reajuste (R$)": group.valorReajuste,
        "Valor Aditamento (R$)": group.valorAditamento,
        "Valor Total (R$)": group.valorTotal,
        "Diferença Nominal (R$)": group.valorTotal - group.valLdo,
        "Variação (%)": group.valLdo > 0 ? ((group.valorTotal - group.valLdo) / group.valLdo) * 100 : 0,
        Status: getStatusInfo(group.valLdo, group.valorTotal).label,
        Indicador: ldoData.indicador || "Não informado",
        "Unidade de Medida": ldoData.unidadeMedida || "Unidade",
        "Meta Física 2027": ldoData.custoFisico2027 ?? 0,
      };
    });

    // 2. Aba: Detalhamento Analítico Completo
    const analiticoData = editableGroups.flatMap((group) =>
      group.children.map((item) => {
        const original = originalValuesById.get(item.id) ?? item.valLdo;
        return {
          Secretaria: item.secretaria,
          Programa: item.programa,
          Ação: item.acao,
          "Natureza da Despesa": item.natureza || item.elemento,
          Elemento: item.elemento,
          Subelemento: item.subelemento || "—",
          "Fonte/Vínculo": item.fonteVinculo || "01",
          Processo: item.processo || "—",
          "Contrato / Projeto Iniciado": (item.contrato || item.projetoIniciado || "").trim() || "NÃO",
          "Valor Original (R$)": original,
          "Valor LOA Vigente (R$)": item.valLoa,
          "Valor Reajuste (R$)": item.valorReajuste ?? 0,
          "Valor Aditamento (R$)": item.valorAditamento ?? 0,
          "Valor Total (R$)": getItemLoaTotal(item),
          "Diferença Total - LDO (R$)": getItemLoaTotal(item) - item.valLdo,
          "Validado pelo usuário": validatedRows[item.id] ? "SIM" : "NÃO",
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

    // Abas de Contratos e Demais Despesas
    const analiticoContratos = analiticoData.filter((r) => String(r["Contrato / Projeto Iniciado"] || "").toUpperCase() === "SIM");
    const analiticoDemais = analiticoData.filter((r) => String(r["Contrato / Projeto Iniciado"] || "").toUpperCase() !== "SIM");

    if (analiticoContratos.length > 0) {
      const wsContratos = XLSX.utils.json_to_sheet(analiticoContratos);
      XLSX.utils.book_append_sheet(workbook, wsContratos, "Contratos");
    }
    if (analiticoDemais.length > 0) {
      const wsDemais = XLSX.utils.json_to_sheet(analiticoDemais);
      XLSX.utils.book_append_sheet(workbook, wsDemais, "Demais_Despesas");
    }


    XLSX.utils.book_append_sheet(workbook, wsAnalitico, "Detalhamento_Geral");

    if (auditoriaData.length > 0) {
      const wsAuditoria = XLSX.utils.json_to_sheet(auditoriaData);
      XLSX.utils.book_append_sheet(workbook, wsAuditoria, "Memoria_Ajustes");
    }

    XLSX.writeFile(workbook, "relatorio-tecnico-orcamento-osasco-2027.xlsx");
  };

  const buildReportGroupsFromItems = (items: RawBudgetItem[]): LoaReportGroup[] => {
    const groupMap = new Map<string, LoaReportGroup>();
    items.forEach((item) => {
      const groupKey = [item.programa, item.acao].join("|");
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupTitle: item.acao,
          valLdo: 0,
          valLoa: 0,
          valorReajuste: 0,
          valorAditamento: 0,
          valorTotal: 0,
          items: [],
        });
      }
      const g = groupMap.get(groupKey)!;
      g.valLoa += item.valLoa;
      g.valorReajuste += item.valorReajuste ?? 0;
      g.valorAditamento += item.valorAditamento ?? 0;
      g.valorTotal += getItemLoaTotal(item);

      const vinculo = item.codigoAplicacao
        ? `${item.fonteVinculo || ""}.${item.codigoAplicacao}`
        : item.fonteVinculo || "—";

      const procParts: string[] = [];
      if (item.subelemento && item.subelemento !== "—" && item.subelemento !== item.natureza && item.subelemento !== item.elemento) {
        procParts.push(item.subelemento.trim());
      }
      if (item.processo && item.processo !== "—" && item.processo.trim() !== "") {
        const p = item.processo.trim();
        procParts.push(p.toLowerCase().startsWith("proc") ? p : `Proc: ${p}`);
      }
      if (item.projetoIniciado && item.projetoIniciado !== "—" && item.projetoIniciado.trim() !== "") {
        procParts.push(`Iniciado: ${item.projetoIniciado.trim()}`);
      }
      const obsText = (item.observacao || "").trim() || (justifications[item.id] || "").trim();
      if (obsText && obsText !== "—" && obsText !== "") {
        procParts.push(obsText.toLowerCase().startsWith("obs") ? obsText : `Obs: ${obsText}`);
      }
      const processoObs = procParts.join(" | ");

      g.items.push({
        natureza: item.natureza || item.elemento || "—",
        vinculo,
        processoObs,
        valLdo: item.valLdo,
        valLoa: item.valLoa,
        valorReajuste: item.valorReajuste ?? 0,
        valorAditamento: item.valorAditamento ?? 0,
        valorTotal: getItemLoaTotal(item),
      });
    });

    return Array.from(groupMap.values());
  };

  const exportToPDF = (targetScope?: "todos" | "contratos" | "demais" | "banco-projetos") => {
    const selectedScope = targetScope || scopeTab;
    const secretariats = [...new Set(filteredItems.map((item) => item.secretaria).filter(Boolean))];
    const reportSecretariat = filters.secretaria.length === 1
      ? filters.secretaria[0]
      : secretariats.length === 1
        ? secretariats[0]
        : secretariats.length > 0 ? secretariats.join(" · ") : "11 - SECRETARIA DE SERVIÇOS E OBRAS";

    const units = [...new Set(filteredItems.map((item) => item.unidade).filter(Boolean))];
    const reportUnit = filters.unidade.length === 1
      ? filters.unidade[0]
      : units.length === 1
        ? units[0]
        : units.length > 0 ? units.join(" · ") : "01.11.001.00 - Gabinete da Secretaria de Serviços e Obras";

    const organs = [...new Set(filteredItems.map((item) => item.orgao).filter(Boolean))];
    const reportOrgan = filters.orgao.length === 1
      ? filters.orgao[0]
      : organs.length === 1
        ? organs[0]
        : organs.length > 0 ? organs.join(" · ") : "Órgão 01 - Prefeitura do Município de Osasco";

    // Filtragem estrita para o relatório: excluir despesas com vínculo de 5 dígitos (formato 00.00),
    // exceto quando for item alocado do Banco de Projetos.
    const isBancoProjetoItem = (item: RawBudgetItem) =>
      item.origem === "Banco de Projetos" ||
      item.id.startsWith("banco-projeto-") ||
      Boolean(item.bancoProjetoKey) ||
      item.programa === "Banco de Projetos";

    const reportEligibleItems = filteredItems.filter((item) => {
      const isBP = isBancoProjetoItem(item);
      const vinculo = item.codigoAplicacao
        ? `${item.fonteVinculo || ""}.${item.codigoAplicacao}`
        : item.fonteVinculo || "";
      return !shouldExcludeReportVinculo(vinculo, isBP);
    });

    const hasAnyAdjustment = reportEligibleItems.some((item) => {
      const original = originalValuesById.get(item.id) ?? item.valLdo;
      return Math.abs(item.valLoa - original) > 0.001 || (item.valorReajuste ?? 0) > 0 || (item.valorAditamento ?? 0) > 0;
    });

    // Totalizadores globais do relatório recalculados sobre os itens elegíveis
    const totalLdo = editableGroups.reduce((acc, g) => acc + g.valLdo, 0);
    const totalLoa = reportEligibleItems.reduce((acc, i) => acc + i.valLoa, 0);
    const totalReajuste = reportEligibleItems.reduce((acc, i) => acc + (i.valorReajuste ?? 0), 0);
    const totalAditamento = reportEligibleItems.reduce((acc, i) => acc + (i.valorAditamento ?? 0), 0);
    const totalGeral = reportEligibleItems.reduce((acc, i) => acc + getItemLoaTotal(i), 0);

    if (selectedScope === "todos") {
      // Relatório Completo dividido em 3 Seções Visuais com Subtotais:
      // 1. Contratos, 2. Demais Despesas e 3. Banco de Projetos Alocados
      const bpItems = reportEligibleItems.filter(isBancoProjetoItem);
      const contratoItems = reportEligibleItems.filter((i) => !isBancoProjetoItem(i) && isItemContrato(i));
      const demaisItems = reportEligibleItems.filter((i) => !isBancoProjetoItem(i) && !isItemContrato(i));

      const contratoGroups = buildReportGroupsFromItems(contratoItems);
      const demaisGroups = buildReportGroupsFromItems(demaisItems);
      const bpGroups = buildReportGroupsFromItems(bpItems);

      const calcTotals = (items: RawBudgetItem[], ldoVal = 0) => ({
        ldo: ldoVal,
        loa: items.reduce((acc, i) => acc + i.valLoa, 0),
        reajuste: items.reduce((acc, i) => acc + (i.valorReajuste ?? 0), 0),
        aditamento: items.reduce((acc, i) => acc + (i.valorAditamento ?? 0), 0),
        total: items.reduce((acc, i) => acc + getItemLoaTotal(i), 0),
      });

      const sections: LoaReportSection[] = [];

      if (contratoItems.length > 0) {
        sections.push({
          sectionKey: "contratos",
          sectionTitle: "1. Despesas com Contratos e Projetos Iniciados",
          sectionBadge: "Contratos Vigentes",
          sectionIcon: "description",
          totals: calcTotals(contratoItems, 0),
          groups: contratoGroups,
        });
      }

      if (demaisItems.length > 0) {
        sections.push({
          sectionKey: "demais",
          sectionTitle: "2. Demais Despesas Orçamentárias",
          sectionBadge: "Operacional / Demais",
          sectionIcon: "folder_open",
          totals: calcTotals(demaisItems, totalLdo),
          groups: demaisGroups,
        });
      }

      if (bpItems.length > 0) {
        sections.push({
          sectionKey: "banco-projetos",
          sectionTitle: "3. Banco de Projetos Alocados",
          sectionBadge: "Novos Projetos / Alocados",
          sectionIcon: "account_tree",
          totals: calcTotals(bpItems, 0),
          groups: bpGroups,
        });
      }

      const reportData: LoaReportData = {
        tituloSecretaria: reportSecretariat,
        unidadeOrcamentaria: reportUnit,
        orgao: reportOrgan,
        exercicio: "2027",
        hasAdjustments: hasAnyAdjustment,
        reportScopeTitle: "Consolidado · Contratos, Demais Despesas e Banco de Projetos",
        totals: {
          ldo: totalLdo,
          loa: totalLoa,
          reajuste: totalReajuste,
          aditamento: totalAditamento,
          total: totalGeral,
        },
        sections,
      };

      openLoaReportWindow(reportData, true);
    } else {
      // Relatório Específico de Escopo Único (Contratos, Demais ou Banco de Projetos)
      let targetItems: RawBudgetItem[] = [];
      let scopeTitle = "";

      if (selectedScope === "banco-projetos") {
        targetItems = reportEligibleItems.filter(isBancoProjetoItem);
        scopeTitle = "Banco de Projetos Alocados";
      } else if (selectedScope === "contratos") {
        targetItems = reportEligibleItems.filter((i) => !isBancoProjetoItem(i) && isItemContrato(i));
        scopeTitle = "Contratos e Projetos Iniciados";
      } else {
        targetItems = reportEligibleItems.filter((i) => !isBancoProjetoItem(i) && !isItemContrato(i));
        scopeTitle = "Demais Despesas Orçamentárias";
      }

      const reportGroups = buildReportGroupsFromItems(targetItems);
      const scopeTotals = {
        ldo: selectedScope === "demais" ? totalLdo : 0,
        loa: targetItems.reduce((acc, i) => acc + i.valLoa, 0),
        reajuste: targetItems.reduce((acc, i) => acc + (i.valorReajuste ?? 0), 0),
        aditamento: targetItems.reduce((acc, i) => acc + (i.valorAditamento ?? 0), 0),
        total: targetItems.reduce((acc, i) => acc + getItemLoaTotal(i), 0),
      };

      const reportData: LoaReportData = {
        tituloSecretaria: reportSecretariat,
        unidadeOrcamentaria: reportUnit,
        orgao: reportOrgan,
        exercicio: "2027",
        hasAdjustments: hasAnyAdjustment,
        reportScopeTitle: scopeTitle,
        totals: scopeTotals,
        groups: reportGroups,
      };

      openLoaReportWindow(reportData, true);
    }
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

  const expandAllEditGroups = () => {
    const allGroups = new Set<string>();
    const allNatures = new Set<string>();
    paginatedEditableGroups.forEach((group) => {
      allGroups.add(group.id);
      group.children.forEach((item) => {
        const nat = item.natureza || item.elemento || "Outros";
        allNatures.add(`${group.id}|${nat}`);
      });
    });
    setExpandedEditGroups(allGroups);
    setExpandedNatureGroups(allNatures);
  };

  const collapseAllEditGroups = () => {
    setExpandedEditGroups(new Set());
    setExpandedNatureGroups(new Set());
  };

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
            onClick={() => setAuditModalOpen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm sm:w-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-emerald-700">history_edu</span>
            Auditoria Orçamentária
          </button>
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
        <div className="space-y-4 my-2 animate-in fade-in" role="status" aria-live="polite">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card bg-surface p-4 rounded-xl border border-outline-variant/60 space-y-2">
                <div className="h-3 w-20 bg-surface-container-high/70 rounded animate-pulse" />
                <div className="h-6 w-28 bg-surface-container-high/90 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-surface-container-high/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="glass-card bg-surface p-6 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="h-4 w-48 bg-surface-container-high/80 rounded animate-pulse" />
            <div className="h-10 w-full bg-surface-container-high/50 rounded-xl animate-pulse" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-full bg-surface-container-high/40 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      )}
      {dataLoadState === "error" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-error/40 bg-error-container/40 p-5 text-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between my-4 animate-in fade-in" role="alert">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-xl text-rose-600 shrink-0 mt-0.5">error</span>
            <div>
              <p className="font-bold text-on-surface">Não foi possível carregar os dados da análise orçamentária.</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">{dataLoadError || "Verifique sua conexão ou tente recarregar a planilha."}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDataReloadKey((value) => value + 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Tentar Novamente</span>
          </button>
        </div>
      )}

      {/* Renderização Dinâmica de Seções e Cards Baseada em layoutConfig */}
      {layoutConfig.sectionsOrder.map((sectionId) => {
        if (layoutConfig.visibility[sectionId] === false) return null;

        // Seção 1: Painel da Receita Orçamentária
        if (sectionId === "painel-receita") {
          return (
            <AnaliseLoaReceitaKpis
              key="painel-receita"
              layoutConfig={layoutConfig}
              ldoReceitaTotal={ldoReceitaTotal}
              ldoReceitaEntidades={ldoReceitaEntidades}
              loaReceitaResumo={{ ...loaReceitaResumo, entidades: receitaLoaEntidades }}
            />
          );
        }

        // Seção 2: Painel da Despesa Orçamentária
        if (sectionId === "painel-despesa") {
          return (
            <AnaliseLoaDespesaKpis
              key="painel-despesa"
              layoutConfig={layoutConfig}
              loaExpectativaTotal={loaExpectativaTotal}
              metrics={metrics}
            />
          );
        }

        // Seção 3: Filtros Avançados Orçamentários
        if (sectionId === "filtros-avancados") {
          return (
            <AnaliseLoaAdvancedFilters
              key="filtros-avancados"
              filters={filters}
              setFilters={setFilters}
              initialFilters={INITIAL_FILTERS}
              filterOptions={filterOptions}
            />
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
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low/70 border border-outline-variant/70" role="group" aria-label="Ordenar estrutura">
                    {([
                      { key: "codigo", sort: { column: "codigo", direction: "asc" }, label: "Código", icon: "format_list_numbered", title: "Ordem pelo código da secretaria" },
                      { key: "desc", sort: { column: "valLoa", direction: "desc" }, label: "Maior → Menor", icon: "arrow_downward", title: "Maior Fixação LOA primeiro" },
                      { key: "asc", sort: { column: "valLoa", direction: "asc" }, label: "Menor → Maior", icon: "arrow_upward", title: "Menor Fixação LOA primeiro" },
                    ] as const).map((option) => {
                      const active = pivotSort.column === option.sort.column && (option.sort.column === "codigo" || pivotSort.direction === option.sort.direction);
                      return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setPivotSort({ ...option.sort })}
                        aria-pressed={active}
                        title={option.title}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                          active
                            ? "bg-primary text-on-primary shadow-xs"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{option.icon}</span>
                        {option.label}
                      </button>
                      );
                    })}
                  </div>
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
                {(() => {
                  const header = (column: "nome" | "valLoa" | "diff", label: string, className: string) => {
                    const active = pivotSort.column === column;
                    return (
                      <button
                        type="button"
                        onClick={() => togglePivotSort(column)}
                        aria-sort={active ? (pivotSort.direction === "asc" ? "ascending" : "descending") : "none"}
                        title={`Ordenar por ${label}`}
                        className={`inline-flex items-center gap-1 font-bold hover:text-sky-700 transition-colors cursor-pointer ${className}`}
                      >
                        <span>{label}</span>
                        <span className={`material-symbols-outlined text-[13px] ${active ? "text-sky-700" : "text-sky-400"}`}>
                          {active ? (pivotSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                        </span>
                      </button>
                    );
                  };
                  return (
                    <>
                      {header("nome", "Estrutura / Agrupamento", "")}
                      <div className="flex items-center gap-6 pr-2">
                        {header("valLoa", "Fixação LOA (R$)", "text-primary")}
                        {header("diff", "Diferença (LOA - LDO)", "text-on-surface-variant")}
                      </div>
                    </>
                  );
                })()}
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
              <div className="flex flex-col gap-4 pb-4 mb-3 border-b border-outline-variant">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-headline font-bold text-on-surface">Detalhamento Analítico Editável</h3>
                      <span className="text-xs text-on-surface-variant font-medium">•</span>
                      <span className="text-xs text-primary font-bold">
                        {scopeTab === "todos" ? "Todas as Despesas" : scopeTab === "contratos" ? "Contratos & Projetos Iniciados" : "Demais Despesas"}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Dê duplo clique ou edite os valores diretamente nas células</p>
                  </div>

                  {/* Seletor Segmentado de Escopo: Todos / Contratos / Demais */}
                  <div className="flex items-center gap-1.5 p-1 bg-surface-container-low/70 rounded-xl border border-outline-variant/70 overflow-x-auto shrink-0 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setScopeTab("todos")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        scopeTab === "todos"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">apps</span>
                      <span>Todos ({scopeStats.todos.count})</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${scopeTab === "todos" ? "bg-white/20 text-white" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        {currency.format(scopeStats.todos.total)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeTab("contratos")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        scopeTab === "contratos"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      <span>Contratos ({scopeStats.contratos.count})</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${scopeTab === "contratos" ? "bg-white/20 text-white" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        {currency.format(scopeStats.contratos.total)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeTab("demais")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        scopeTab === "demais"
                          ? "bg-sky-700 text-white shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">folder_open</span>
                      <span>Demais ({scopeStats.demais.count})</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${scopeTab === "demais" ? "bg-white/20 text-white" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        {currency.format(scopeStats.demais.total)}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">

                    <div className="relative w-[min(20rem,calc(100vw-8rem))] min-w-[14rem]">
                      <label htmlFor="analytical-table-search" className="sr-only">Buscar no detalhamento analítico</label>
                      <input
                        id="analytical-table-search"
                        type="text"
                        placeholder="Buscar ação, elemento, subelemento ou processo..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="min-h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs text-on-surface"
                      />
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        className={`min-h-10 whitespace-nowrap px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 font-semibold transition-colors bg-surface ${statusFilters.length > 0
                            ? "border-primary text-primary bg-primary/5 font-bold"
                            : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                          }`}
                      >
                        <span className="material-symbols-outlined text-sm">filter_alt</span>
                        <span>
                          {statusFilters.length === 0
                            ? "Status"
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
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Filtrar por status</span>
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
                  </div>

                <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-low/40 p-2.5">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="px-1 text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant">Visualização</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setColumnsDropdownOpen((open) => !open)}
                      className="min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface text-on-surface border border-outline-variant hover:bg-surface-container transition-colors flex items-center gap-1.5"
                      aria-expanded={columnsDropdownOpen}
                      aria-haspopup="menu"
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">view_column</span>
                      <span>Colunas</span>
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                        {visibleTableColumns.size}/{ANALYTICAL_COLUMNS.length}
                      </span>
                    </button>
                    {columnsDropdownOpen && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-20 cursor-default"
                          onClick={() => setColumnsDropdownOpen(false)}
                          aria-label="Fechar seleção de colunas"
                        />
                        <div className="absolute right-0 z-30 mt-1.5 w-72 rounded-xl border border-outline-variant bg-surface p-2 shadow-xl" role="menu" aria-label="Mostrar, ocultar e ordenar colunas">
                          <div className="flex items-center justify-between border-b border-outline-variant/60 px-2 pb-2 pt-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">Colunas e ordem</span>
                            <span className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { setColumnOrder(DEFAULT_COLUMN_ORDER); setColumnsSaveState("idle"); }}
                                className="text-[10px] font-bold text-on-surface-variant hover:text-on-surface hover:underline"
                              >
                                Ordem padrão
                              </button>
                              <button
                                type="button"
                                onClick={() => setVisibleTableColumns(new Set(ANALYTICAL_COLUMNS.map((column) => column.key)))}
                                className="text-[10px] font-bold text-primary hover:underline"
                              >
                                Mostrar todas
                              </button>
                            </span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {[...FIXED_ANALYTICAL_COLUMNS, ...columnOrder].map((key) => ANALYTICAL_COLUMNS.find((column) => column.key === key)!).map((column) => {
                              const checked = visibleTableColumns.has(column.key);
                              const orderIndex = columnOrder.indexOf(column.key);
                              return (
                                <div
                                  key={column.key}
                                  className={`flex min-h-9 items-center gap-1.5 rounded-lg px-1.5 text-xs hover:bg-surface-container ${checked ? "" : "bg-surface-container-low/60"}`}
                                >
                                  <button
                                    type="button"
                                    disabled={column.required}
                                    onClick={() => {
                                      setVisibleTableColumns((current) => {
                                        const next = new Set(current);
                                        if (next.has(column.key)) next.delete(column.key);
                                        else next.add(column.key);
                                        return next;
                                      });
                                      setColumnsSaveState("idle");
                                    }}
                                    aria-pressed={checked}
                                    aria-label={`${checked ? "Ocultar" : "Mostrar"} coluna ${column.label}`}
                                    title={column.required ? "Coluna fixa" : checked ? "Ocultar coluna" : "Mostrar coluna"}
                                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "text-primary hover:bg-primary/10" : "text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface"}`}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">{checked ? "visibility" : "visibility_off"}</span>
                                  </button>
                                  <span className={`flex-1 ${checked ? "text-on-surface" : "text-on-surface-variant/60 line-through"}`}>{column.label}</span>
                                  {orderIndex < 0 ? (
                                    <span className="text-[9px] font-bold uppercase text-on-surface-variant">Fixa</span>
                                  ) : (
                                    <span className="flex items-center">
                                      {([[-1, "arrow_upward", "Mover para a esquerda"], [1, "arrow_downward", "Mover para a direita"]] as const).map(([offset, icon, label]) => {
                                        const disabled = offset === -1 ? orderIndex === 0 : orderIndex === columnOrder.length - 1;
                                        return (
                                          <button
                                            key={icon}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => { moveColumn(column.key, offset); setColumnsSaveState("idle"); }}
                                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent"
                                            aria-label={`${label}: ${column.label}`}
                                            title={label}
                                          >
                                            <span className="material-symbols-outlined text-[16px]">{icon}</span>
                                          </button>
                                        );
                                      })}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-outline-variant/60 px-2 pt-2">
                            <span className="text-[10px] text-on-surface-variant">
                              {columnsSaveState === "saved" ? "Preferência salva para este usuário" : columnsSaveState === "error" ? "Não foi possível salvar" : "Salve para manter esta configuração"}
                            </span>
                            <button
                              type="button"
                              onClick={saveColumnsPreference}
                              disabled={columnsSaveState === "saving"}
                              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                            >
                              <span className="material-symbols-outlined text-[14px]">{columnsSaveState === "saving" ? "sync" : "save"}</span>
                              {columnsSaveState === "saving" ? "Salvando" : "Salvar"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="px-1 text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant">Estrutura</span>
                      <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant">
                    <button
                      type="button"
                      onClick={collapseAllEditGroups}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
                      title="Recolher todas as ações e despesas"
                    >
                      <span className="material-symbols-outlined text-[16px]">unfold_less</span>
                      <span>Recolher Todas</span>
                    </button>
                    <button
                      type="button"
                      onClick={expandAllEditGroups}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
                      title="Expandir todas as ações e despesas"
                    >
                      <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                      <span>Expandir Todas</span>
                    </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end justify-end gap-3">
                    {hasChanges && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      Alterações não salvas
                    </span>
                  )}
                    <div className="flex flex-col gap-1">
                      <span className="px-1 text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant">Alterações</span>
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
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="px-1 text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant">Exportar</span>
                      <div className="flex flex-wrap gap-2">
                      <button
                    onClick={exportToExcel}
                    className="min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">description</span>
                    Excel
                      </button>
                      <button
                    type="button"
                    onClick={exportDetailedCsv}
                    className="min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 transition-colors flex items-center gap-1"
                    title="Exportar os registros visíveis no mesmo modelo da planilha LOA"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">csv</span>
                    CSV LOA
                      </button>
                      <div className="relative">
                        <div className="inline-flex rounded-lg shadow-xs border border-rose-300 bg-rose-50 text-rose-700">
                          <button
                            type="button"
                            onClick={() => exportToPDF()}
                            className="min-h-11 px-3 py-1.5 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 rounded-l-lg border-r border-rose-300/60"
                            title="Visualizar e imprimir relatório oficial no formato LOA com base na visão atual"
                          >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            <span>Relatório Técnico (PDF)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPdfMenuOpen((prev) => !prev)}
                            className="min-h-11 px-2 py-1.5 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center rounded-r-lg cursor-pointer"
                            title="Opções de relatório (Completo em 2 blocos, Apenas Contratos ou Apenas Demais)"
                            aria-expanded={pdfMenuOpen}
                          >
                            <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
                          </button>
                        </div>
                        {pdfMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30 cursor-default"
                              onClick={() => setPdfMenuOpen(false)}
                            />
                            <div className="absolute right-0 z-40 mt-1.5 w-72 rounded-xl border border-outline-variant bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95 text-left">
                              <div className="px-2.5 py-1.5 border-b border-outline-variant/60 mb-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Opções de Geração (PDF)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPdfMenuOpen(false);
                                  exportToPDF("todos");
                                }}
                                className="w-full text-left p-2 rounded-lg text-xs hover:bg-surface-container flex flex-col gap-0.5 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-on-surface">
                                  <span className="material-symbols-outlined text-sm text-primary">splitscreen</span>
                                  <span>Relatório Completo (3 Blocos)</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant pl-5">Contratos, Demais Despesas e Banco de Projetos em blocos com subtotais</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPdfMenuOpen(false);
                                  exportToPDF("contratos");
                                }}
                                className="w-full text-left p-2 rounded-lg text-xs hover:bg-surface-container flex flex-col gap-0.5 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-on-surface">
                                  <span className="material-symbols-outlined text-sm text-amber-700">description</span>
                                  <span>Apenas Contratos</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant pl-5">Projetos iniciados e despesas contratuais</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPdfMenuOpen(false);
                                  exportToPDF("demais");
                                }}
                                className="w-full text-left p-2 rounded-lg text-xs hover:bg-surface-container flex flex-col gap-0.5 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-on-surface">
                                  <span className="material-symbols-outlined text-sm text-sky-700">folder_open</span>
                                  <span>Apenas Demais Despesas</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant pl-5">Demais despesas orçamentárias</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPdfMenuOpen(false);
                                  exportToPDF("banco-projetos");
                                }}
                                className="w-full text-left p-2 rounded-lg text-xs hover:bg-surface-container flex flex-col gap-0.5 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-on-surface">
                                  <span className="material-symbols-outlined text-sm text-emerald-700">account_tree</span>
                                  <span>Apenas Banco de Projetos</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant pl-5">Projetos alocados na LOA</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Grid Analítica Editável */}
              <p className="mb-2 text-[11px] text-on-surface-variant sm:hidden">Deslize horizontalmente para visualizar todas as colunas.</p>
              <div className="flex items-center justify-end gap-2 mb-2 text-xs text-on-surface-variant">
                <span>
                  Exibindo <strong>{editableGroups.length > 0 ? (tablePage - 1) * tablePageSize + 1 : 0}</strong> a{" "}
                  <strong>{Math.min(tablePage * tablePageSize, editableGroups.length)}</strong> de <strong>{editableGroups.length}</strong> ações
                </span>
                <label className="sr-only" htmlFor="analitico-page-size-top">Ações por página</label>
                <select
                  id="analitico-page-size-top"
                  value={tablePageSize}
                  onChange={(e) => {
                    setTablePageSize(Number(e.target.value));
                    setTablePage(1);
                  }}
                  className="px-2 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface font-medium"
                >
                  {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} por página</option>)}
                  <option value={editableGroups.length || 9999}>Todas</option>
                </select>
              </div>
              <div ref={analyticalScrollRef} className="analitico-scroll w-full overflow-x-auto rounded-lg border border-sky-100 dark:border-sky-900/40 shadow-sm" tabIndex={0} aria-label="Tabela de detalhamento analítico, role na horizontal para ver todas as colunas">
                <table className="w-full min-w-[760px] text-left border-collapse text-xs sm:min-w-[980px]">
                  <thead className="bg-sky-50/70 dark:bg-sky-950/40 sticky top-0 z-10 text-[11px] font-bold text-sky-900 dark:text-sky-200 border-b border-sky-100 dark:border-sky-900/50">
                    <tr>
                      <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 w-[300px] min-w-[260px] sm:w-[450px] sm:min-w-[350px]">{renderSortHeader("acao", "Ação")}</th>
                      {visibleTableColumns.has("elemento") && <th className="p-2.5 border-b border-sky-100 dark:border-sky-900/50 w-[100px] min-w-[90px] sm:w-[110px] sm:min-w-[100px]">{renderSortHeader("elemento", "Elemento de Despesa")}</th>}
                      {renderOrderedCells({
                        valLdo: (visibleTableColumns.has("valLdo") && <th className="col-band-gray p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valLdo", "Valor LDO", "text-right")}</th>),
                        valLoa2026: (visibleTableColumns.has("valLoa2026") && <th className="col-band-white p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valLoa2026", "LOA 2026 (Inicial)", "text-right")}</th>),
                        valorTotal: (visibleTableColumns.has("valorTotal") && <th className="col-band-gray p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valorTotal", "LOA 2027", "text-right")}</th>),
                        valLoa: (visibleTableColumns.has("valLoa") && <th className="col-band-white p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valLoa", "Vigente", "text-right")}</th>),
                        valorReajuste: (visibleTableColumns.has("valorReajuste") && <th className="col-band-gray p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valorReajuste", "Reajuste", "text-right")}</th>),
                        vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <th className="col-band-white p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("vigenteReajuste", "Vigente + Reajuste", "text-right")}</th>),
                        valorAditamento: (visibleTableColumns.has("valorAditamento") && <th className="col-band-gray p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valorAditamento", "Aditamento", "text-right")}</th>),
                        valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <th className="col-band-white p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valorSugestaoSf", "Sugestão SF", "text-right")}</th>),
                        valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <th className="col-band-gray p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("valorCorteGp", "Corte GP", "text-right")}</th>),
                        diff: (visibleTableColumns.has("diff") && <th className="col-band-white p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-right">{renderSortHeader("diff", "Diferença", "text-right")}</th>),
                        status: (visibleTableColumns.has("status") && <th className="col-band-gray p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-center">{renderSortHeader("status", "Status", "text-center")}</th>),
                        adjusted: (visibleTableColumns.has("adjusted") && <th className="col-band-white p-2.5 border-b border-sky-100 dark:border-sky-900/50 text-center">{renderSortHeader("adjusted", "Validação", "text-center")}</th>),
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/60 dark:divide-sky-900/20 font-mono">
                    {paginatedEditableGroups.map((group) => {
                      const isExpanded = expandedEditGroups.has(group.id);
                      const diff = group.valorTotal - group.valLdo;
                      const status = getStatusInfo(group.valLdo, group.valorTotal);
                      const diffColor = diff > 0 ? "text-emerald-600 font-bold" : diff < 0 ? "text-rose-600 font-bold" : "text-gray-400";
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
                      const validatedNatures = natureGroups.filter(([, items]) => items.length > 0 && items.every((item) => validatedRows[item.id])).length;
                      const actionValidationStatus = getNatureValidationStatus(validatedNatures, natureGroups.length);
                      const actionValidationClass = actionValidationStatus === "Validada"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : actionValidationStatus === "Parcial"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-surface-container text-on-surface-variant border-outline-variant";

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
                                    setExpandedEditGroups((previous) => {
                                      const next = new Set(previous);
                                      if (next.has(group.id)) next.delete(group.id);
                                      else next.add(group.id);
                                      return next;
                                    });
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
                                  {(group.children.some((item) => item.origem === "Banco de Projetos" || item.id.startsWith("banco-projeto-") || Boolean(item.bancoProjetoKey)) || group.programa === "Banco de Projetos") && (
                                    <span className="mt-1 inline-flex rounded-full bg-secondary-container px-2 py-0.5 text-[9px] font-bold text-on-secondary-container">
                                      Banco de Projetos
                                    </span>
                                  )}
                                </div>
                                {group.children.filter((item) => item.origem === "Banco de Projetos" || item.id.startsWith("banco-projeto-") || Boolean(item.bancoProjetoKey) || group.programa === "Banco de Projetos").map((item) => (
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
                            {visibleTableColumns.has("elemento") && <td className="p-3 text-on-surface-variant font-sans w-[100px] max-w-[100px] truncate sm:w-[110px] sm:max-w-[110px]" title={group.elemento}>
                              {group.elemento}
                            </td>}
                            {renderOrderedCells({
                              valLdo: (visibleTableColumns.has("valLdo") && <td className="col-band-gray p-3 text-right font-mono text-on-surface-variant font-medium select-none bg-surface-container-low/60">
                              {formatBr(group.valLdo)}
                            </td>),
                              valLoa2026: (visibleTableColumns.has("valLoa2026") && <td className="col-band-white p-3 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/40" title="LOA 2026 inicial">
                              {formatBr(group.valLoa2026)}
                            </td>),
                              valorTotal: (visibleTableColumns.has("valorTotal") && <td className="col-band-gray p-3 text-right font-mono font-extrabold text-primary">{formatBr(group.valorTotal)}</td>),
                              valLoa: (visibleTableColumns.has("valLoa") && (
                              <td className="col-band-white p-3 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/40">
                                {formatBr(group.valLoa)}
                              </td>
                            )),
                              valorReajuste: (visibleTableColumns.has("valorReajuste") && (
                              <td className="col-band-gray p-3 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/40">
                                {formatBr(group.valorReajuste)}
                              </td>
                            )),
                              vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <td className="col-band-white p-3 text-right font-mono font-bold text-primary select-none bg-surface-container-low/40">{formatBr(group.vigenteReajuste)}</td>),
                              valorAditamento: (visibleTableColumns.has("valorAditamento") && (
                              <td className="col-band-gray p-3 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/40">
                                {formatBr(group.valorAditamento)}
                              </td>
                            )),
                              valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <td className="col-band-white p-3 text-right font-mono font-bold text-amber-700 select-none bg-surface-container-low/40">{formatBr(group.valorSugestaoSf)}</td>),
                              valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <td className="col-band-gray p-3 text-right font-mono font-bold text-rose-700 select-none bg-surface-container-low/40">{formatBr(group.valorCorteGp)}</td>),
                              diff: (visibleTableColumns.has("diff") && <td className={`col-band-white p-3 text-right font-semibold ${diffColor}`}>
                              {diff > 0 ? `▲ ${currency.format(diff)}` : diff < 0 ? `▼ ${currency.format(Math.abs(diff))}` : "—"}
                            </td>),
                              status: (visibleTableColumns.has("status") && <td className="col-band-gray p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 text-[9.5px] font-bold rounded-full border ${status.class}`}>{status.label}</span>
                            </td>),
                              adjusted: (visibleTableColumns.has("adjusted") && <td className="col-band-white p-3 text-center">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${actionValidationClass}`}>
                                {validatedNatures}/{natureGroups.length} Naturezas · {actionValidationStatus}
                              </span>
                            </td>),
                            })}
                          </tr>
                          {isExpanded && (
                            <Fragment>
                              {/* BLOCO PLANEJAMENTO LDO - 2027 */}
                              <tr className="bg-surface-container-lowest/80 border-b border-outline-variant/30">
                                <td colSpan={visibleTableColumns.size} className="p-3 pl-8 sm:pl-12">
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
                                {visibleTableColumns.has("elemento") && <th className="p-2 text-left">
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
                                </th>}
                                {renderOrderedCells({
                                  valLdo: (visibleTableColumns.has("valLdo") && <th className="col-band-gray p-2 text-right">
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
                                </th>),
                                  valLoa2026: (visibleTableColumns.has("valLoa2026") && <th className="col-band-white p-2 text-right">LOA 2026</th>),
                                  valorTotal: (visibleTableColumns.has("valorTotal") && <th className="col-band-gray p-2 text-right">LOA 2027</th>),
                                  valLoa: (visibleTableColumns.has("valLoa") && <th className="col-band-white p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setNatureSort((curr) => ({ column: "valLoa", direction: curr.column === "valLoa" && curr.direction === "asc" ? "desc" : "asc" }))}
                                    className="inline-flex items-center gap-1 ml-auto hover:text-sky-700 transition-colors cursor-pointer"
                                    title="Ordenar por Valor LOA"
                                  >
                                    <span>Vigente</span>
                                    <span className={`material-symbols-outlined text-[13px] ${natureSort.column === "valLoa" ? "text-sky-700 font-bold" : "text-sky-400"}`}>
                                      {natureSort.column === "valLoa" ? (natureSort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                                    </span>
                                  </button>
                                </th>),
                                  valorReajuste: (visibleTableColumns.has("valorReajuste") && <th className="col-band-gray p-2 text-right">Reajuste</th>),
                                  vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <th className="col-band-white p-2 text-right">Vigente + Reajuste</th>),
                                  valorAditamento: (visibleTableColumns.has("valorAditamento") && <th className="col-band-gray p-2 text-right">Aditamento</th>),
                                  valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <th className="col-band-white p-2 text-right">Sugestão SF</th>),
                                  valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <th className="col-band-gray p-2 text-right">Corte GP</th>),
                                  diff: (visibleTableColumns.has("diff") && <th className="col-band-white p-2 text-right">
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
                                </th>),
                                  status: (visibleTableColumns.has("status") && <th className="col-band-gray p-2 text-center">
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
                                </th>),
                                  adjusted: (visibleTableColumns.has("adjusted") && <th className="col-band-white p-2 text-center text-sky-800/80 dark:text-sky-300/80">Validação</th>),
                                })}
                              </tr>

                              {/* NÍVEL 2: LINHAS DAS NATUREZAS DE DESPESA (FILHAS) */}
                              {natureGroups.map(([natureza, natureItems]) => {
                                const natureKey = `${group.id}|${natureza}`;
                                const natureExpanded = expandedNatureGroups.has(natureKey);
                                const natureLdo = natureItems.reduce((sum, item) => sum + item.valLdo, 0);
                                const natureLoa2026 = natureItems.reduce((sum, item) => sum + (item.valLoa2026 ?? 0), 0);
                                const natureLoa = natureItems.reduce((sum, item) => sum + item.valLoa, 0);
                                const natureReajuste = natureItems.reduce((sum, item) => sum + (item.valorReajuste ?? 0), 0);
                                const natureVigenteReajuste = natureLoa + natureReajuste;
                                const natureAditamento = natureItems.reduce((sum, item) => sum + (item.valorAditamento ?? 0), 0);
                                const natureSugestaoSf = natureItems.reduce((sum, item) => sum + (item.valorSugestaoSf ?? 0), 0);
                                const natureCorteGp = natureItems.reduce((sum, item) => sum + (item.valorCorteGp ?? 0), 0);
                                const natureTotal = natureLoa + natureReajuste + natureAditamento;
                                const natureDiff = natureTotal - natureLdo;
                                const natureStatus = getStatusInfo(natureLdo, natureTotal);
                                // Vínculos extras pertencem ao subelemento de origem e não são validados separadamente.
                                const validatableItems = natureItems.filter((item) => !item.vinculoParentId || !natureItems.some((parent) => parent.id === item.vinculoParentId));
                                const validatedSubelements = validatableItems.filter((item) => validatedRows[item.id]).length;
                                const validationPercent = validatableItems.length > 0 ? Math.round((validatedSubelements / validatableItems.length) * 100) : 0;
                                const validationStatus = getNatureValidationStatus(validatedSubelements, validatableItems.length);
                                const validationStatusClass = validationStatus === "Validada"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : validationStatus === "Parcial"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-surface-container text-on-surface-variant border-outline-variant";
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
                                          <span className="min-w-0 whitespace-normal break-words font-mono text-xs font-semibold leading-snug text-on-surface">
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
                                      {visibleTableColumns.has("elemento") && <td className="p-2.5 text-on-surface-variant font-sans text-xs">
                                         <div className="flex flex-col gap-1 items-start">
                                          <div className="flex flex-wrap items-center gap-1.5" title={`${validatedSubelements} de ${validatableItems.length} subelementos validados`}>
                                            <span className="text-[11px] font-bold text-on-surface tabular-nums">{validatedSubelements}/{validatableItems.length} validados · {validationPercent}%</span>
                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${validationStatusClass}`}>{validationStatus}</span>
                                          </div>
                                          {natureItems.some((i) => i.processo && i.processo !== "—") && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 dark:text-sky-200 bg-sky-100/70 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 px-1.5 py-0.5 rounded shadow-2xs" title="Contém processos administrativos vinculados">
                                              <span className="material-symbols-outlined text-[11px]">folder</span>
                                              <span>Proc: {Array.from(new Set(natureItems.map((i) => i.processo).filter((p) => p && p !== "—"))).join(", ")}</span>
                                            </span>
                                          )}
                                        </div>
                                      </td>}
                                      {renderOrderedCells({
                                        valLdo: (visibleTableColumns.has("valLdo") && (
                                        <td className="col-band-gray p-2.5 text-right font-mono text-on-surface-variant/50 font-medium select-none bg-surface-container-low/40 text-xs">
                                          0,00
                                        </td>
                                      )),
                                        valLoa2026: (visibleTableColumns.has("valLoa2026") && <td className="col-band-white p-2.5 text-right font-mono font-bold text-on-surface text-xs" title="LOA 2026 inicial da natureza de despesa">{formatBr(natureLoa2026)}</td>),
                                        valorTotal: (visibleTableColumns.has("valorTotal") && (
                                        <td className="col-band-gray p-2.5 text-right font-mono font-extrabold text-primary text-xs">
                                          {formatBr(natureTotal)}
                                        </td>
                                      )),
                                        valLoa: (visibleTableColumns.has("valLoa") && (
                                        <td className="col-band-white p-2.5 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/30 text-xs">
                                          {formatBr(natureLoa)}
                                        </td>
                                      )),
                                        valorReajuste: (visibleTableColumns.has("valorReajuste") && (
                                        <td className="col-band-gray p-2.5 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/30 text-xs">
                                          {formatBr(natureReajuste)}
                                        </td>
                                      )),
                                        vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <td className="col-band-white p-2.5 text-right font-mono font-bold text-primary text-xs">{formatBr(natureVigenteReajuste)}</td>),
                                        valorAditamento: (visibleTableColumns.has("valorAditamento") && (
                                        <td className="col-band-gray p-2.5 text-right font-mono font-bold text-on-surface select-none bg-surface-container-low/30 text-xs">
                                          {formatBr(natureAditamento)}
                                        </td>
                                      )),
                                        valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <td className="col-band-white p-2.5 text-right font-mono font-bold text-amber-700 text-xs">{formatBr(natureSugestaoSf)}</td>),
                                        valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <td className="col-band-gray p-2.5 text-right font-mono font-bold text-rose-700 text-xs">{formatBr(natureCorteGp)}</td>),
                                        diff: (visibleTableColumns.has("diff") && (
                                        <td className={`col-band-white p-2.5 text-right text-xs ${natureDiff > 0 ? "text-emerald-600 font-bold" : natureDiff < 0 ? "text-rose-600 font-bold" : "text-gray-400"}`}>
                                          {natureDiff > 0 ? `▲ ${currency.format(natureDiff)}` : natureDiff < 0 ? `▼ ${currency.format(Math.abs(natureDiff))}` : "—"}
                                        </td>
                                      )),
                                        status: (visibleTableColumns.has("status") && (
                                        <td className="col-band-gray p-2.5 text-center">
                                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${natureStatus.class}`}>{natureStatus.label}</span>
                                        </td>
                                      )),
                                        adjusted: (visibleTableColumns.has("adjusted") && <td className="col-band-white p-2.5 text-center">
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${validationStatusClass}`}>
                                          {validatedSubelements}/{validatableItems.length} · {validationStatus}
                                        </span>
                                      </td>),
                                      })}
                                    </tr>

                                    {/* NÍVEL 3: LINHAS DOS SUBELEMENTOS (unidades validáveis) */}
                                    {natureExpanded && natureItems.filter((item) => !item.vinculoParentId || !natureItems.some((parent) => parent.id === item.vinculoParentId)).map((item) => {
                                      const vinculoEntries = [item, ...natureItems.filter((child) => child.vinculoParentId === item.id)];
                                      const hasSubelementDetails = vinculoEntries.length > 1 && Boolean((item.processo && item.processo !== "—") || item.projetoIniciado || item.observacao || justifications[item.id]);
                                      return (
                                        <Fragment key={item.id}>
                                        <tr className={`bg-surface-container-lowest hover:bg-primary/[0.04] transition-colors ${vinculoEntries.length > 1 ? "!border-b-transparent [&>td]:!border-b-transparent" : "border-b border-outline-variant/10"}`}>
                                            <td colSpan={visibleTableColumns.has("elemento") ? 2 : 1} className="p-2.5 pl-12 sm:pl-16 text-on-surface-variant font-sans text-xs" title={getSubelementLabel(item)}>
                                              <div className="flex items-start gap-2">
                                                {/* Linha guia conectora da árvore */}
                                                <span className="text-outline-variant/80 font-mono text-xs select-none mt-0.5 shrink-0">│   └──</span>
                                                <div className="min-w-0 flex-1 flex flex-col items-start gap-1.5">
                                                  {/* Cabeçalho do Subelemento com Botões de Ação alinhados à direita */}
                                                  <div className="w-full flex items-center justify-between gap-2">
                                                    <span className="text-on-surface font-semibold text-xs leading-snug break-words">{getSubelementLabel(item)}</span>
                                                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                                                      <button
                                                        type="button"
                                                        onClick={() => openVinculosEditor(group, natureza, vinculoEntries)}
                                                        className="inline-flex items-center gap-1 rounded border border-teal-300/80 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-700/60"
                                                        title="Adicionar ou editar vínculos deste subelemento"
                                                      >
                                                        <span className="material-symbols-outlined text-[13px]">account_balance</span>
                                                        <span>Vínculos</span>
                                                      </button>
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

                                                  {vinculosContext?.group.id === group.id && vinculosContext.natureza === natureza && vinculosContext.items[0]?.id === item.id && (
                                                    <div className="w-full rounded-md border border-teal-300/70 bg-surface p-2">
                                        <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase text-teal-800"><span>Adicionar vínculo ao subelemento</span><span>Total: {formatBr(vinculoAllocations.reduce((sum, item) => sum + parseBr(item.valor), 0))}</span></div>
                                        {vinculoAllocations.map((allocation, index) => <div key={allocation.id} className="mb-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto] gap-1"><select value={allocation.vinculo} onChange={(event) => setVinculoAllocations((prev) => prev.map((item) => item.id === allocation.id ? { ...item, vinculo: event.target.value } : item))} className="rounded border border-outline-variant px-1 py-0.5 text-[10px]">{VINCULO_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input value={allocation.codigoAplicacao} onChange={(event) => setVinculoAllocations((prev) => prev.map((item) => item.id === allocation.id ? { ...item, codigoAplicacao: event.target.value } : item))} placeholder="Código aplicação" className="rounded border border-outline-variant px-1 py-0.5 text-[10px] font-mono" /><input value={allocation.valor} onChange={(event) => setVinculoAllocations((prev) => prev.map((item) => item.id === allocation.id ? { ...item, valor: event.target.value.replace(/-/g, "") } : item))} className="rounded border border-outline-variant px-1 py-0.5 text-right text-[10px] font-mono" /><button type="button" disabled={vinculoAllocations.length === 1} onClick={() => setVinculoAllocations((prev) => prev.filter((item) => item.id !== allocation.id))} className="text-rose-600 disabled:opacity-30" aria-label={`Remover vínculo ${index + 1}`}><span className="material-symbols-outlined text-[15px]">delete</span></button></div>)}
                                        <div className="flex justify-end gap-1"><button type="button" onClick={() => setVinculoAllocations((prev) => [...prev, { id: crypto.randomUUID(), vinculo: "01", codigoAplicacao: "", valor: "0,00" }])} className="rounded border border-teal-300 px-2 py-0.5 text-[10px] font-bold text-teal-800">+ Vínculo</button><button type="button" onClick={() => setVinculosContext(null)} className="rounded border border-outline-variant px-2 py-0.5 text-[10px]">Cancelar</button><button type="button" onClick={saveVinculos} className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary">Salvar</button></div>
                                      </div>
                                                  )}

                                                  {/* Badges de Vínculo (com Código de Aplicação integrado) e Processo */}
                                                  <div className="flex flex-col items-start gap-1.5">
                                                    {[item].filter((entry) => entry.fonteVinculo || entry.codigoAplicacao).map((entry) => (
                                                      <span
                                                        key={entry.id}
                                                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-teal-800 dark:text-teal-200 font-mono bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 px-2 py-0.5 rounded-md shadow-2xs"
                                                        title={`Fonte/Vínculo e Código de Aplicação: ${formatVinculoComAplicacao(entry.fonteVinculo, entry.codigoAplicacao)}`}
                                                      >
                                                        <span className="material-symbols-outlined text-[12px]">account_balance</span>
                                                        <span>Vínculo: {formatVinculoComAplicacao(entry.fonteVinculo, entry.codigoAplicacao)}</span>
                                                      </span>
                                                    ))}
                                                    {vinculoEntries.length === 1 && item.processo && item.processo !== "—" && (
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
                                                  {vinculoEntries.length === 1 && (item.projetoIniciado || item.observacao || justifications[item.id]) && (
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
                                          {renderOrderedCells({
                                            valLdo: (visibleTableColumns.has("valLdo") && <td className="col-band-gray p-2 text-right font-mono text-on-surface-variant/50 text-xs">0,00</td>),
                                            valLoa2026: (visibleTableColumns.has("valLoa2026") && <td className="col-band-white p-2 text-right font-mono text-on-surface-variant/50 text-xs" title="A LOA 2026 é publicada por natureza de despesa, sem subelemento">—</td>),
                                            valorTotal: (visibleTableColumns.has("valorTotal") && <td className="col-band-gray p-2 text-right font-mono font-extrabold text-primary text-xs">{formatBr(getItemLoaTotal(item))}</td>),
                                            valLoa: (visibleTableColumns.has("valLoa") && <td className="col-band-white p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[item].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valLoa" ? tempInputValue : formatBr(entry.valLoa)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valLoa" });
                                                setTempInputValue(entry.valLoa.toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valLoa: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 text-right px-2 py-1 rounded-lg border border-outline-variant bg-surface font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none shadow-sm dark:bg-surface-container-high dark:text-white text-xs"
                                            /></div>)}</div>
                                          </td>),
                                            valorReajuste: (visibleTableColumns.has("valorReajuste") && <td className="col-band-gray p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[item].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorReajuste" ? tempInputValue : formatBr(entry.valorReajuste ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorReajuste" });
                                                setTempInputValue((entry.valorReajuste ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorReajuste: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <td className="col-band-white p-2 text-right font-mono font-bold text-primary text-xs">{formatBr(getItemVigenteReajuste(item))}</td>),
                                            valorAditamento: (visibleTableColumns.has("valorAditamento") && <td className="col-band-gray p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[item].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorAditamento" ? tempInputValue : formatBr(entry.valorAditamento ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorAditamento" });
                                                setTempInputValue((entry.valorAditamento ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorAditamento: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <td className="col-band-white p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[item].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorSugestaoSf" ? tempInputValue : formatBr(entry.valorSugestaoSf ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorSugestaoSf" });
                                                setTempInputValue((entry.valorSugestaoSf ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorSugestaoSf: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <td className="col-band-gray p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[item].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorCorteGp" ? tempInputValue : formatBr(entry.valorCorteGp ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorCorteGp" });
                                                setTempInputValue((entry.valorCorteGp ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorCorteGp: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            diff: (visibleTableColumns.has("diff") && <td className={`col-band-white p-2 text-right text-xs ${getItemLoaTotal(item) - item.valLdo > 0 ? "text-emerald-600 font-bold" : getItemLoaTotal(item) - item.valLdo < 0 ? "text-rose-600 font-bold" : "text-gray-400"}`}>
                                            {currency.format(getItemLoaTotal(item) - item.valLdo)}
                                          </td>),
                                            status: (visibleTableColumns.has("status") && <td className="col-band-gray p-2 text-center">
                                            <span className={`inline-block px-2 py-0.5 text-[8.5px] font-bold rounded-full border ${getStatusInfo(item.valLdo, getItemLoaTotal(item)).class}`}>
                                              {getStatusInfo(item.valLdo, getItemLoaTotal(item)).label}
                                            </span>
                                          </td>),
                                            adjusted: (visibleTableColumns.has("adjusted") && <td className="col-band-white p-2 text-center">
                                            {(() => {
                                              const itemSec = item.orgao || (item as unknown as { secretaria?: string }).secretaria || "";
                                              const canValidateItem = canUserValidateSecretaria(itemSec);
                                              return (
                                                <button
                                                  type="button"
                                                  disabled={!canValidateItem}
                                                  onClick={() => toggleValidateRow(item.id, itemSec)}
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold rounded-lg border transition-all ${
                                                    !canValidateItem
                                                      ? "opacity-60 cursor-not-allowed bg-surface text-on-surface-variant/50 border-outline-variant"
                                                      : "cursor-pointer "
                                                  } ${validatedRows[item.id]
                                                      ? "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs"
                                                      : "bg-surface text-on-surface-variant/70 border-outline-variant hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                                                    }`}
                                                  title={
                                                    !canValidateItem
                                                      ? `Validação restrita ao técnico da ${itemSec || "pasta"}`
                                                      : validatedRows[item.id] ? "Subelemento validado! Clique para desmarcar" : "Validar este subelemento"
                                                  }
                                                  aria-label={`Validar subelemento ${getSubelementLabel(item)}`}
                                                >
                                                  <span className={`material-symbols-outlined text-[13px] ${validatedRows[item.id] ? "text-emerald-700 dark:text-emerald-400 font-black" : "text-gray-400"}`}>
                                                    {validatedRows[item.id] ? "check_circle" : "radio_button_unchecked"}
                                                  </span>
                                                  <span>{validatedRows[item.id] ? "Validado" : "Pendente"}</span>
                                                </button>
                                              );
                                            })()}
                                          </td>),
                                          })}
                                        </tr>
                                        {vinculoEntries.slice(1).map((child, childIndex) => (
                                          <tr key={child.id} className={`bg-surface-container-lowest !border-t-transparent [&>td]:!border-t-transparent ${childIndex === vinculoEntries.length - 2 && !hasSubelementDetails ? "border-b border-outline-variant/10" : "!border-b-transparent [&>td]:!border-b-transparent"}`}>
                                            <td colSpan={visibleTableColumns.has("elemento") ? 2 : 1} className="p-2 pl-12 sm:pl-16 text-xs">
                                              <div className="flex items-center gap-2">
                                                <span className="invisible font-mono text-xs select-none shrink-0" aria-hidden="true">│   └──</span>
                                                <span
                                                  className="inline-flex items-center gap-1 text-[10.5px] font-bold text-teal-800 dark:text-teal-200 font-mono bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 px-2 py-0.5 rounded-md shadow-2xs"
                                                  title={`Fonte/Vínculo e Código de Aplicação: ${formatVinculoComAplicacao(child.fonteVinculo, child.codigoAplicacao)}`}
                                                >
                                                  <span className="material-symbols-outlined text-[12px]">account_balance</span>
                                                  <span>Vínculo: {formatVinculoComAplicacao(child.fonteVinculo, child.codigoAplicacao)}</span>
                                                </span>
                                              </div>
                                            </td>
                                          {renderOrderedCells({
                                            valLdo: (visibleTableColumns.has("valLdo") && <td className="col-band-gray p-2 text-right font-mono text-on-surface-variant/50 text-xs">0,00</td>),
                                            valLoa2026: (visibleTableColumns.has("valLoa2026") && <td className="col-band-white p-2 text-right font-mono text-on-surface-variant/50 text-xs" title="A LOA 2026 é publicada por natureza de despesa, sem subelemento">—</td>),
                                            valorTotal: (visibleTableColumns.has("valorTotal") && <td className="col-band-gray p-2 text-right font-mono font-extrabold text-primary text-xs">{formatBr(getItemLoaTotal(child))}</td>),
                                            valLoa: (visibleTableColumns.has("valLoa") && <td className="col-band-white p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[child].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valLoa" ? tempInputValue : formatBr(entry.valLoa)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valLoa" });
                                                setTempInputValue(entry.valLoa.toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valLoa: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 text-right px-2 py-1 rounded-lg border border-outline-variant bg-surface font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none shadow-sm dark:bg-surface-container-high dark:text-white text-xs"
                                            /></div>)}</div>
                                          </td>),
                                            valorReajuste: (visibleTableColumns.has("valorReajuste") && <td className="col-band-gray p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[child].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorReajuste" ? tempInputValue : formatBr(entry.valorReajuste ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorReajuste" });
                                                setTempInputValue((entry.valorReajuste ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorReajuste: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <td className="col-band-white p-2 text-right font-mono font-bold text-primary text-xs">{formatBr(getItemVigenteReajuste(child))}</td>),
                                            valorAditamento: (visibleTableColumns.has("valorAditamento") && <td className="col-band-gray p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[child].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorAditamento" ? tempInputValue : formatBr(entry.valorAditamento ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorAditamento" });
                                                setTempInputValue((entry.valorAditamento ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorAditamento: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <td className="col-band-white p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[child].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorSugestaoSf" ? tempInputValue : formatBr(entry.valorSugestaoSf ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorSugestaoSf" });
                                                setTempInputValue((entry.valorSugestaoSf ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorSugestaoSf: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <td className="col-band-gray p-1.5 border border-outline-variant/20 bg-surface text-right">
                                            <div className="flex flex-col items-end gap-2">{[child].map((entry) => <div key={entry.id}><input
                                              type="text"
                                              value={editingCell?.id === entry.id && editingCell.field === "valorCorteGp" ? tempInputValue : formatBr(entry.valorCorteGp ?? 0)}
                                              onFocus={() => {
                                                setEditingCell({ id: entry.id, field: "valorCorteGp" });
                                                setTempInputValue((entry.valorCorteGp ?? 0).toFixed(2).replace(".", ","));
                                              }}
                                              onChange={(event) => {
                                                const sanitizedValue = event.target.value.replace(/-/g, "");
                                                setTempInputValue(sanitizedValue);
                                                const value = parseBr(sanitizedValue);
                                                setRawItems((previous) => previous.map((row) => row.id === entry.id ? { ...row, valorCorteGp: value } : row));
                                                setHasChanges(true);
                                              }}
                                              onBlur={() => setEditingCell(null)}
                                              className="w-32 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right font-mono text-xs font-bold text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            /></div>)}</div>
                                          </td>),
                                            diff: (visibleTableColumns.has("diff") && <td className="col-band-white" />),
                                            status: (visibleTableColumns.has("status") && <td className="col-band-gray" />),
                                            adjusted: (visibleTableColumns.has("adjusted") && <td className="col-band-white" />),
                                          })}
                                          </tr>
                                        ))}
                                        {hasSubelementDetails && (
                                          <tr className="bg-surface-container-lowest !border-t-transparent [&>td]:!border-t-transparent border-b border-outline-variant/10">
                                            <td colSpan={visibleTableColumns.size} className="p-2 pl-12 sm:pl-16 text-xs">
                                              <div className="flex items-start gap-2">
                                                <span className="invisible font-mono text-xs select-none shrink-0 mt-0.5" aria-hidden="true">│   └──</span>
                                              <div className="flex min-w-0 max-w-3xl flex-1 flex-col items-start gap-1.5">
                                                    {item.processo && item.processo !== "—" && (
                                                      <span
                                                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-sky-800 dark:text-sky-200 font-mono bg-sky-100/70 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 px-2 py-0.5 rounded-md shadow-2xs"
                                                        title={`Processo Administrativo: ${item.processo}`}
                                                      >
                                                        <span className="material-symbols-outlined text-[12px]">folder</span>
                                                        <span>Processo: {item.processo}</span>
                                                      </span>
                                                    )}
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
                                          </tr>
                                        )}
                                        </Fragment>
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
                      <td colSpan={visibleTableColumns.has("elemento") ? 2 : 1} className="p-3 text-on-surface font-sans font-extrabold uppercase tracking-wider text-[11px]">
                        Total Geral Filtrado ({filteredItems.length} registros)
                      </td>
                      {renderOrderedCells({
                        valLdo: (visibleTableColumns.has("valLdo") && <td className="col-band-gray p-3 text-right text-on-surface-variant font-extrabold">
                        {formatBr(metrics.valLdoTotal)}
                      </td>),
                        valLoa2026: (visibleTableColumns.has("valLoa2026") && <td className="col-band-white p-3 text-right text-on-surface font-extrabold">{formatBr(metrics.valLoa2026Total)}</td>),
                        valorTotal: (visibleTableColumns.has("valorTotal") && <td className="col-band-gray p-3 text-right text-primary font-extrabold">{formatBr(metrics.valLoaTotal)}</td>),
                        valLoa: (visibleTableColumns.has("valLoa") && <td className="col-band-white p-3 text-right text-primary font-extrabold">
                        {formatBr(metrics.valLoaVigenteTotal)}
                      </td>),
                        valorReajuste: (visibleTableColumns.has("valorReajuste") && <td className="col-band-gray p-3 text-right text-on-surface font-extrabold">{formatBr(metrics.valorReajusteTotal)}</td>),
                        vigenteReajuste: (visibleTableColumns.has("vigenteReajuste") && <td className="col-band-white p-3 text-right text-primary font-extrabold">{formatBr(metrics.vigenteReajusteTotal)}</td>),
                        valorAditamento: (visibleTableColumns.has("valorAditamento") && <td className="col-band-gray p-3 text-right text-on-surface font-extrabold">{formatBr(metrics.valorAditamentoTotal)}</td>),
                        valorSugestaoSf: (visibleTableColumns.has("valorSugestaoSf") && <td className="col-band-white p-3 text-right text-amber-700 font-extrabold">{formatBr(metrics.valorSugestaoSfTotal)}</td>),
                        valorCorteGp: (visibleTableColumns.has("valorCorteGp") && <td className="col-band-gray p-3 text-right text-rose-700 font-extrabold">{formatBr(metrics.valorCorteGpTotal)}</td>),
                        diff: (visibleTableColumns.has("diff") && <td className={`col-band-white p-3 text-right font-extrabold ${metrics.diff > 0 ? "text-rose-600" : metrics.diff < 0 ? "text-emerald-600" : "text-on-surface"}`}>
                        {metrics.diff > 0 ? `▲ ${currency.format(metrics.diff)}` : metrics.diff < 0 ? `▼ ${currency.format(Math.abs(metrics.diff))}` : "—"}
                      </td>),
                        status: (visibleTableColumns.has("status") && <td className="col-band-gray p-3 text-center text-on-surface-variant text-[10px]">
                        TOTALIZADOR
                      </td>),
                        adjusted: (visibleTableColumns.has("adjusted") && <td className="col-band-white p-3 text-center text-on-surface-variant">—</td>),
                      })}
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
                Contrato
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

      {/* 9. POPUP MODAL: Auditoria Orçamentária & Rastreabilidade */}
      <AuditoriaOrcamentariaModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        secretariaAtiva={filters.secretaria[0] || ""}
        onRestaurarItem={(dotacaoId) => {
          // Remover do localStorage local se existir
          try {
            const savedRemoved = (JSON.parse(localStorage.getItem("painel_loa_removed_expenses_v1") || "[]") as string[])
              .filter((id) => id !== dotacaoId);
            localStorage.setItem("painel_loa_removed_expenses_v1", JSON.stringify(savedRemoved));
          } catch {}
          // Forçar recarregamento transparente dos dados no Painel
          setDataReloadKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}
