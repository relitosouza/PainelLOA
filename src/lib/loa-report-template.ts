import { currency } from "./format";

export interface LoaReportItem {
  natureza: string;
  vinculo?: string;
  processoObs?: string;
  processo?: string;
  observacao?: string;
  isContrato?: boolean;
  valLdo?: number;
  valLoa?: number;
  valorReajuste?: number;
  valorAditamento?: number;
  valorAjusteSf?: number;
  valorCorteGp?: number;
  valorTotal?: number;
}

/**
 * Retorna true se o vínculo fornecido deve ser excluído do relatório (exatamente 5 dígitos no formato 00.00 / XX.XX),
 * a menos que seja um item proveniente do Banco de Projetos.
 */
export function shouldExcludeReportVinculo(vinculo?: string, isBancoProjeto = false): boolean {
  if (isBancoProjeto) return false;
  if (!vinculo) return false;
  const cleanVinculo = vinculo.trim();
  return /^\d{2}\.\d{2}$/.test(cleanVinculo);
}

export interface LoaReportGroup {
  groupCode?: string;
  groupTitle: string;
  secretaria?: string;
  valLdo: number;
  valLoa: number;
  valorReajuste: number;
  valorAditamento: number;
  valorAjusteSf?: number;
  valorCorteGp?: number;
  valorTotal: number;
  items: LoaReportItem[];
}

export interface LoaReportSection {
  sectionKey?: string;
  sectionTitle: string;
  sectionBadge?: string;
  sectionIcon?: string;
  totals: {
    ldo: number;
    loa: number;
    reajuste: number;
    aditamento: number;
    ajusteSf?: number;
    corteGp?: number;
    total: number;
  };
  groups: LoaReportGroup[];
}

export interface LoaExecutiveDashboardData {
  receita: {
    ldoTotal: number;
    loaTotal: number;
    diff: number;
    percentExec: number;
    maiorReceita?: { natureza: string; valor: number } | null;
    qtdFontes: number;
    prefeitura: number;
    indiretas: number;
    entidades?: Array<{ nome: string; valor: number }>;
  };
  despesa: {
    ldoTotal: number;
    loaTotal: number;
    diff: number;
    percentExec: number;
    reajuste: number;
    aditamento: number;
    ajusteSf: number;
    corteGp: number;
    totalGeral: number;
    totalNaturezas?: number;
  };
  resultado: {
    ldoResultado: number;
    loaResultado: number;
    isLdoSuperavit: boolean;
    isLoaSuperavit: boolean;
  };
}

export interface LoaReportData {
  tituloSecretaria?: string;
  unidadeOrcamentaria?: string;
  orgao?: string;
  exercicio?: string;
  hasAdjustments?: boolean;
  autoPrint?: boolean;
  reportScopeTitle?: string;
  isAllSecretariats?: boolean;
  hideInitialCards?: boolean;
  ocultarNatureza?: boolean;
  ocultarAcao?: boolean;
  ocultarVinculo?: boolean;
  secretariasList?: string[];
  unidadesList?: string[];
  executiveDashboard?: LoaExecutiveDashboardData;
  totals: {
    ldo: number;
    loa: number;
    reajuste: number;
    aditamento: number;
    ajusteSf?: number;
    corteGp?: number;
    total: number;
  };
  groups?: LoaReportGroup[];
  sections?: LoaReportSection[];
}

function formatTableCell(val?: number): string {
  if (val === undefined || val === null || Math.abs(val) < 0.005) return "-";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function escapeHtml(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSingleGroupRowsHtml(group: LoaReportGroup, ocultarNatureza = false, ocultarAcao = false, ocultarVinculo = false): string {
  const groupName = escapeHtml(group.groupTitle || "Grupo de Despesa");
  const groupValLoa = formatTableCell(group.valLoa);
  const groupReajuste = formatTableCell(group.valorReajuste);
  const groupAditamento = formatTableCell(group.valorAditamento);
  const groupAjusteSf = formatTableCell(group.valorAjusteSf);
  const groupCorteGp = formatTableCell(group.valorCorteGp);
  const groupTotal = formatTableCell(
    group.valorTotal ??
      ((group.valLoa || 0) +
        (group.valorReajuste || 0) +
        (group.valorAditamento || 0) +
        (group.valorAjusteSf || 0) +
        (group.valorCorteGp || 0))
  );

  const itemsHtml = group.items.map((item) => {
    const nat = escapeHtml(item.natureza || "—");
    const vinc = escapeHtml(item.vinculo || "—");

    // Construção rica da linha com Nº do Processo e Descrição da Observação
    let detailsHtml = "";
    if (item.processo || item.observacao) {
      const parts: string[] = [];
      if (item.processo && item.processo.trim() !== "" && item.processo !== "—") {
        const procClean = escapeHtml(item.processo.trim());
        parts.push(`<span class="inline-flex items-center gap-1 font-semibold text-primary"><span class="material-symbols-outlined text-[11px]">description</span>Proc: ${procClean}</span>`);
      }
      if (item.observacao && item.observacao.trim() !== "" && item.observacao !== "—") {
        const obsClean = escapeHtml(item.observacao.trim());
        parts.push(`<span class="text-on-surface-variant font-normal italic">Obs: ${obsClean}</span>`);
      }
      if (parts.length > 0) {
        detailsHtml = `<div class="text-[9px] text-on-surface-variant mt-0.5 leading-snug break-words flex flex-wrap items-center gap-1.5">${parts.join(`<span class="text-outline-variant font-bold">·</span>`)}</div>`;
      }
    } else {
      const rawProc = (item.processoObs || "").trim();
      if (rawProc !== "" && rawProc !== "—") {
        detailsHtml = `<div class="text-[9px] text-on-surface-variant font-normal mt-0.5 leading-snug break-words tracking-tight">${escapeHtml(rawProc)}</div>`;
      }
    }

    const firstCellContent = ocultarNatureza
      ? (detailsHtml || `<div class="text-on-surface-variant text-[10px]">—</div>`)
      : `<div class="font-semibold text-on-surface text-[10.5px] leading-snug break-words">${nat}</div>${detailsHtml}`;

    const vincTd = ocultarVinculo
      ? ""
      : `<td class="p-padding-cell-v px-padding-cell-h text-on-surface-variant text-[10px] whitespace-nowrap">${vinc}</td>`;

    const iValLoa = formatTableCell(item.valLoa);
    const iReajuste = formatTableCell(item.valorReajuste);
    const iAditamento = formatTableCell(item.valorAditamento);
    const iAjusteSf = formatTableCell(item.valorAjusteSf);
    const iCorteGp = formatTableCell(item.valorCorteGp);
    const iTotal = formatTableCell(
      item.valorTotal ??
        ((item.valLoa || 0) +
          (item.valorReajuste || 0) +
          (item.valorAditamento || 0) +
          (item.valorAjusteSf || 0) +
          (item.valorCorteGp || 0))
    );

    return `
<tr class="zebra-row border-b border-outline-variant hover:bg-surface-container-low transition-colors">
  <td class="p-padding-cell-v px-padding-cell-h">
    ${firstCellContent}
  </td>
  ${vincTd}
  <td class="p-padding-cell-v px-padding-cell-h text-right font-mono text-[10px] whitespace-nowrap">${iValLoa}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant font-mono text-[10px] whitespace-nowrap">${iReajuste}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant font-mono text-[10px] whitespace-nowrap">${iAditamento}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant font-mono text-[10px] whitespace-nowrap">${iAjusteSf}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant font-mono text-[10px] whitespace-nowrap">${iCorteGp}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-mono font-bold text-[10px] whitespace-nowrap bg-primary-fixed-dim/5">${iTotal}</td>
</tr>`;
  }).join("\n");

  if (ocultarAcao) {
    return itemsHtml;
  }

  const groupColspan = ocultarVinculo ? 1 : 2;

  return `
<!-- Group: ${groupName} -->
<tr class="bg-surface-container-highest border-b border-outline-variant">
  <td class="p-padding-cell-v px-padding-cell-h font-table-data-bold text-table-data-bold text-[10.5px] sticky left-0" colspan="${groupColspan}">${groupName}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-[10.5px] font-mono whitespace-nowrap">${groupValLoa}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-[10.5px] font-mono whitespace-nowrap">${groupReajuste}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-[10.5px] font-mono whitespace-nowrap">${groupAditamento}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-[10.5px] font-mono whitespace-nowrap">${groupAjusteSf}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-[10.5px] font-mono whitespace-nowrap">${groupCorteGp}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-[10.5px] font-mono whitespace-nowrap bg-primary-fixed-dim/10">${groupTotal}</td>
</tr>
${itemsHtml}`;
}

function renderExecutiveCoverPage(data: LoaReportData): string {
  const exercicio = escapeHtml(data.exercicio || "2027");
  const orgao = escapeHtml(data.orgao || "Órgão 01 - Prefeitura do Município de Osasco");

  const rec = data.executiveDashboard?.receita || {
    ldoTotal: 5868871609.9,
    loaTotal: data.totals.total || data.totals.loa,
    diff: (data.totals.total || data.totals.loa) - 5868871609.9,
    percentExec: 100,
    maiorReceita: null,
    qtdFontes: 1,
    prefeitura: data.totals.total || data.totals.loa,
    indiretas: 0,
  };

  const desp = data.executiveDashboard?.despesa || {
    ldoTotal: data.totals.ldo,
    loaTotal: data.totals.loa,
    diff: data.totals.loa - data.totals.ldo,
    percentExec: data.totals.ldo > 0 ? (data.totals.total / data.totals.ldo) * 100 : 100,
    reajuste: data.totals.reajuste,
    aditamento: data.totals.aditamento,
    ajusteSf: data.totals.ajusteSf ?? 0,
    corteGp: data.totals.corteGp ?? 0,
    totalGeral: data.totals.total,
  };

  const res = data.executiveDashboard?.resultado || {
    ldoResultado: rec.ldoTotal - desp.ldoTotal,
    loaResultado: rec.loaTotal - desp.totalGeral,
    isLdoSuperavit: rec.ldoTotal - desp.ldoTotal >= 0,
    isLoaSuperavit: rec.loaTotal - desp.totalGeral >= 0,
  };

  const isRecDiffGreater = rec.diff > 0;
  const isRecDiffSmaller = rec.diff < 0;

  const isDespDiffGreater = desp.diff > 0;
  const isDespDiffSmaller = desp.diff < 0;

  const nowFormatted = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  const despBase = desp.loaTotal;
  const despSolicitadoTotal = despBase + desp.reajuste + desp.aditamento;
  const despTotalFinal = desp.totalGeral;

  return `
<!-- PÁGINA 1: CAPA EXECUTIVA DASHBOARD GERAL (A4 PAISAGEM) -->
<div class="page-sheet-landscape executive-cover-sheet executive-cover-page">
  <!-- Top Header da Capa -->
  <div class="flex items-center justify-between pb-3 mb-3 border-b-2 border-primary/20">
    <div class="flex items-center gap-3">
      <div class="w-11 h-11 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center text-primary font-bold">
        <span class="material-symbols-outlined text-[26px]">account_balance</span>
      </div>
      <div>
        <span class="text-[10px] font-bold text-primary tracking-widest uppercase block">${orgao} · SECRETARIA DE FINANÇAS</span>
        <h1 class="text-xl font-headline font-bold text-on-surface tracking-tight leading-tight">
          Painel Executivo Orçamentário · Exercício ${exercicio}
        </h1>
        <p class="text-[11px] text-on-surface-variant">
          Visão Consolidada Municipal: Receita, Despesa e Resultado Fiscal
        </p>
      </div>
    </div>
    <div class="text-right flex flex-col items-end">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/30 rounded text-primary text-[10.5px] font-bold uppercase tracking-wide">
        <span class="material-symbols-outlined text-[14px]">verified</span>
        <span>Capa Executiva Consolidada</span>
      </div>
      <span class="text-[10px] text-on-surface-variant mt-1 font-mono">Emissão: ${nowFormatted}</span>
    </div>
  </div>

  <!-- SEÇÃO 1: PAINEL DA RECEITA -->
  <div class="cover-section mb-3">
    <div class="flex items-center gap-1.5 mb-1.5">
      <span class="material-symbols-outlined text-[16px] text-emerald-700">account_balance_wallet</span>
      <h2 class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">1. Painel da Receita Orçamentária</h2>
    </div>
    <div class="grid grid-cols-4 gap-2.5">
      <!-- Card Rec 1 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-emerald-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Valor Previsto LDO</span>
        <div class="text-[14px] font-bold font-mono text-on-surface leading-tight">${currency.format(rec.ldoTotal)}</div>
        <span class="text-[9px] text-emerald-700 font-semibold block mt-0.5">Planejada na LDO</span>
      </div>
      <!-- Card Rec 2 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-blue-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Valor Previsto LOA</span>
        <div class="text-[14px] font-bold font-mono text-on-surface leading-tight">${currency.format(rec.loaTotal)}</div>
        <span class="text-[8.5px] text-blue-700 font-semibold block mt-0.5 truncate" title="PMO Direta: ${currency.format(rec.prefeitura)} + Indiretas: ${currency.format(rec.indiretas)}">
          PMO: ${currency.format(rec.prefeitura)} + Indiretas: ${currency.format(rec.indiretas)}
        </span>
      </div>
      <!-- Card Rec 3 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 ${isRecDiffGreater ? "border-t-rose-500" : isRecDiffSmaller ? "border-t-emerald-500" : "border-t-gray-400"} border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Diferença (LOA - LDO)</span>
        <div class="text-[14px] font-bold font-mono ${isRecDiffGreater ? "text-rose-600" : isRecDiffSmaller ? "text-emerald-600" : "text-on-surface"} leading-tight">
          ${isRecDiffGreater ? "▲" : isRecDiffSmaller ? "▼" : "—"} ${currency.format(Math.abs(rec.diff))}
        </div>
        <span class="text-[9px] text-on-surface-variant block mt-0.5">${isRecDiffGreater ? "Excesso LOA (+)" : isRecDiffSmaller ? "Redução LOA (-)" : "Valores Equivalentes"}</span>
      </div>
      <!-- Card Rec 4 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-teal-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Execução Planejamento</span>
        <div class="text-[14px] font-bold font-mono text-on-surface leading-tight">${(rec.percentExec).toFixed(2)}%</div>
        <span class="text-[9px] text-teal-700 font-semibold block mt-0.5">Transformado em LOA</span>
      </div>
    </div>
  </div>

  <!-- SEÇÃO 2: PAINEL DA DESPESA -->
  <div class="cover-section mb-3">
    <div class="flex items-center gap-1.5 mb-1.5">
      <span class="material-symbols-outlined text-[16px] text-blue-700">payments</span>
      <h2 class="text-[11px] font-bold text-blue-800 uppercase tracking-wider">2. Painel da Despesa Orçamentária</h2>
    </div>
    <div class="grid grid-cols-7 gap-2">
      <!-- Card Desp 1 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-emerald-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Previsto LDO</span>
        <div class="text-[13.5px] font-bold font-mono text-on-surface leading-tight">${currency.format(desp.ldoTotal)}</div>
        <span class="text-[9px] text-emerald-700 font-semibold block mt-0.5">Planejada LDO</span>
      </div>
      <!-- Card Desp 2: Valor Solicitado (Soma: Solicitado + Reajuste + Aditamento) -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-blue-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Valor Solicitado</span>
        <div class="text-[13.5px] font-bold font-mono text-on-surface leading-tight">${currency.format(despSolicitadoTotal)}</div>
        <span class="text-[8px] text-blue-800 font-semibold block mt-0.5 truncate" title="Soma: Solicitado (${currency.format(despBase)}) + Reajuste (${currency.format(desp.reajuste)}) + Aditamento (${currency.format(desp.aditamento)})">
          Base: ${currency.format(despBase)} + Reaj: ${currency.format(desp.reajuste)} + Adit: ${currency.format(desp.aditamento)}
        </span>
      </div>
      <!-- Card Desp 3 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-green-600 border border-outline-variant/40 bg-green-50/20 shadow-2xs">
        <span class="text-[9.5px] font-bold text-green-800 uppercase block mb-0.5">Reajuste</span>
        <div class="text-[13.5px] font-bold font-mono text-green-800 leading-tight">
          ${desp.reajuste > 0 ? `+${currency.format(desp.reajuste)}` : currency.format(desp.reajuste)}
        </div>
        <span class="text-[9px] text-green-700 font-semibold block mt-0.5">Contratuais</span>
      </div>
      <!-- Card Desp 4 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-sky-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-on-surface-variant uppercase block mb-0.5">Aditamento</span>
        <div class="text-[13.5px] font-bold font-mono text-on-surface leading-tight">${currency.format(desp.aditamento)}</div>
        <span class="text-[9px] text-on-surface-variant block mt-0.5">Acréscimos</span>
      </div>
      <!-- Card Desp 5 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-amber-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-amber-800 uppercase block mb-0.5">Ajuste SF</span>
        <div class="text-[13.5px] font-bold font-mono text-amber-800 leading-tight">${currency.format(desp.ajusteSf)}</div>
        <span class="text-[9px] text-amber-700 font-semibold block mt-0.5">Sugestão Finanças</span>
      </div>
      <!-- Card Desp 6 -->
      <div class="bg-surface p-2.5 rounded-lg border-t-2 border-t-rose-600 border border-outline-variant/40 shadow-2xs">
        <span class="text-[9.5px] font-bold text-rose-800 uppercase block mb-0.5">Corte GP</span>
        <div class="text-[13.5px] font-bold font-mono text-rose-800 leading-tight">${currency.format(desp.corteGp)}</div>
        <span class="text-[9px] text-rose-700 font-semibold block mt-0.5">Gabinete Prefeito</span>
      </div>
      <!-- Card Desp 7 (Total com discriminação) -->
      <div class="bg-primary/5 p-2.5 rounded-lg border-2 border-primary shadow-xs">
        <span class="text-[9.5px] font-bold text-primary uppercase block mb-0.5">Total Final LOA</span>
        <div class="text-[14px] font-extrabold font-mono text-primary leading-tight">${currency.format(despTotalFinal)}</div>
        <span class="text-[8px] text-primary/90 font-bold block mt-0.5 truncate" title="Proposta: ${currency.format(despSolicitadoTotal)} · SF: ${currency.format(desp.ajusteSf)} · GP: ${currency.format(desp.corteGp)}">
          Proposta: ${currency.format(despSolicitadoTotal)} · SF: ${currency.format(desp.ajusteSf)} · GP: ${currency.format(desp.corteGp)}
        </span>
      </div>
    </div>
  </div>

  <!-- SEÇÃO 3: PAINEL DE RESULTADO (EQUILÍBRIO FISCAL) -->
  <div class="cover-section mb-2">
    <div class="flex items-center gap-1.5 mb-1.5">
      <span class="material-symbols-outlined text-[16px] text-teal-700">balance</span>
      <h2 class="text-[11px] font-bold text-teal-800 uppercase tracking-wider">3. Painel de Resultado · Equilíbrio Orçamentário</h2>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <!-- Card Res 1: LDO -->
      <div class="bg-surface p-3 rounded-lg border-t-2 ${res.isLdoSuperavit ? "border-t-emerald-500 bg-emerald-50/15" : "border-t-rose-500 bg-rose-50/15"} border border-outline-variant/40 shadow-2xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-on-surface-variant uppercase block mb-0.5">Resultado LDO (Receita − Despesa)</span>
          <div class="text-base font-bold font-mono ${res.isLdoSuperavit ? "text-emerald-700" : "text-rose-700"} leading-tight">
            ${res.ldoResultado >= 0 ? "+ " : "- "}${currency.format(Math.abs(res.ldoResultado))}
          </div>
          <span class="text-[9.5px] text-on-surface-variant block mt-0.5">Planejamento Preliminar</span>
        </div>
        <span class="px-2 py-1 rounded text-[10px] font-bold ${res.isLdoSuperavit ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}">
          ${res.isLdoSuperavit ? "Superávit LDO" : "Déficit LDO"}
        </span>
      </div>

      <!-- Card Res 2: LOA -->
      <div class="bg-surface p-3 rounded-lg border-t-2 ${res.isLoaSuperavit ? "border-t-emerald-500 bg-emerald-50/15" : "border-t-rose-500 bg-rose-50/15"} border border-outline-variant/40 shadow-2xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-on-surface-variant uppercase block mb-0.5">Resultado LOA (Receita − Despesa Fixada)</span>
          <div class="text-base font-bold font-mono ${res.isLoaSuperavit ? "text-emerald-700" : "text-rose-700"} leading-tight">
            ${res.loaResultado >= 0 ? "+ " : "- "}${currency.format(Math.abs(res.loaResultado))}
          </div>
          <span class="text-[9.5px] text-on-surface-variant block mt-0.5">Balanço Final Orçamentário</span>
        </div>
        <span class="px-2 py-1 rounded text-[10px] font-bold ${res.isLoaSuperavit ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}">
          ${res.loaResultado >= 0 ? "Superávit LOA" : "Déficit LOA"}
        </span>
      </div>

      <!-- Card Res 3: Balanço -->
      <div class="bg-primary/5 p-3 rounded-lg border border-primary/30 shadow-2xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-primary uppercase block mb-0.5">Balanço Geral de Fechamento</span>
          <div class="text-sm font-bold text-on-surface leading-tight">
            ${Math.abs(res.loaResultado) < 1 ? "Equilíbrio Fiscal Pleno (100%)" : res.isLoaSuperavit ? "Superávit Operacional LOA" : "Ajustes em Discussão LOA"}
          </div>
          <span class="text-[9.5px] text-on-surface-variant block mt-0.5">Receita Total: ${currency.format(rec.loaTotal)} vs Despesa: ${currency.format(desp.totalGeral)}</span>
        </div>
        <span class="material-symbols-outlined text-[24px] text-primary">price_check</span>
      </div>
    </div>
  </div>

  <!-- Rodapé Institucional da Capa -->
  <div class="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] text-on-surface-variant">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-[14px] text-primary">arrow_circle_right</span>
      <span>O detalhamento analítico e as despesas específicas de cada Secretaria iniciam na <strong>Página 2</strong> a seguir.</span>
    </div>
    <span class="font-semibold text-primary">Documento Oficial · LOA ${exercicio}</span>
  </div>
</div>`;
}

function renderSecretariaReportBlockHtml(secName: string, secIndex: number, data: LoaReportData): string {
  // Coletar todos os grupos pertencentes a esta secretaria
  const allGroups: LoaReportGroup[] = [];
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach((sec) => {
      sec.groups.forEach((g) => {
        if ((g.secretaria || "").trim() === secName.trim()) {
          allGroups.push(g);
        }
      });
    });
  } else if (data.groups) {
    data.groups.forEach((g) => {
      if ((g.secretaria || "").trim() === secName.trim()) {
        allGroups.push(g);
      }
    });
  }

  if (allGroups.length === 0) return "";

  // Totais da secretaria
  const secBase = allGroups.reduce((acc, g) => acc + (g.valLoa || 0), 0);
  const secReajuste = allGroups.reduce((acc, g) => acc + (g.valorReajuste || 0), 0);
  const secAditamento = allGroups.reduce((acc, g) => acc + (g.valorAditamento || 0), 0);
  const secSolicitadoTotal = secBase + secReajuste + secAditamento;
  const secAjusteSf = allGroups.reduce((acc, g) => acc + (g.valorAjusteSf || 0), 0);
  const secCorteGp = allGroups.reduce((acc, g) => acc + (g.valorCorteGp || 0), 0);
  const secTotalFinal = allGroups.reduce(
    (acc, g) =>
      acc +
      (g.valorTotal ??
        ((g.valLoa || 0) +
          (g.valorReajuste || 0) +
          (g.valorAditamento || 0) +
          (g.valorAjusteSf || 0) +
          (g.valorCorteGp || 0))),
    0
  );

  const secHeaderHtml = `
<!-- SECRETARIA: ${escapeHtml(secName)} (PÁGINA A4 PAISAGEM) -->
<div class="page-sheet-landscape secretaria-report-block">
  <div class="sec-header-block mb-4 pb-3 border-b-2 border-primary/40 flex items-center justify-between flex-wrap gap-2">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
        ${secIndex}
      </div>
      <div>
        <span class="text-[10px] font-bold text-primary tracking-wider uppercase">SECRETARIA MUNICIPAL</span>
        <h2 class="text-xl font-bold text-on-surface tracking-tight leading-tight">${escapeHtml(secName)}</h2>
      </div>
    </div>
    <div class="text-right">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded text-on-surface text-[11px] font-semibold border border-outline-variant">
        <span class="material-symbols-outlined text-[15px] text-primary">domain</span>
        <span>Exercício ${escapeHtml(data.exercicio || "2027")}</span>
      </span>
    </div>
  </div>

  ${
    data.hideInitialCards
      ? ""
      : `
  <!-- Cards de Indicadores da Secretaria -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex flex-col justify-center">
      <span class="text-[9.5px] font-bold text-on-surface-variant uppercase mb-0.5">Valor Solicitado</span>
      <span class="text-sm font-bold font-mono text-on-surface leading-tight">${formatTableCell(secSolicitadoTotal)}</span>
      <span class="text-[8px] text-on-surface-variant font-semibold block mt-0.5 truncate" title="Soma: Solicitado (${formatTableCell(secBase)}) + Reajuste (${formatTableCell(secReajuste)}) + Aditamento (${formatTableCell(secAditamento)})">
        Base: ${formatTableCell(secBase)} + Reaj: ${formatTableCell(secReajuste)} + Adit: ${formatTableCell(secAditamento)}
      </span>
    </div>
    <div class="bg-surface-container-lowest border border-green-200 bg-green-50/20 rounded-lg p-2.5 flex flex-col justify-center">
      <span class="text-[9.5px] font-bold text-green-700 uppercase mb-0.5">Reajuste</span>
      <span class="text-sm font-bold font-mono text-green-800 leading-tight">${secReajuste > 0 ? "+" : ""}${formatTableCell(secReajuste)}</span>
      <span class="text-[8px] text-green-700 block mt-0.5">Contratuais</span>
    </div>
    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex flex-col justify-center">
      <span class="text-[9.5px] font-bold text-on-surface-variant uppercase mb-0.5">Aditamento</span>
      <span class="text-sm font-bold font-mono text-on-surface leading-tight">${formatTableCell(secAditamento)}</span>
      <span class="text-[8px] text-on-surface-variant block mt-0.5">Acréscimos</span>
    </div>
    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex flex-col justify-center">
      <span class="text-[9.5px] font-bold text-on-surface-variant uppercase mb-0.5">Ajuste SF</span>
      <span class="text-sm font-bold font-mono text-on-surface leading-tight">${formatTableCell(secAjusteSf)}</span>
      <span class="text-[8px] text-on-surface-variant block mt-0.5">Sugestão SF</span>
    </div>
    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex flex-col justify-center">
      <span class="text-[9.5px] font-bold text-on-surface-variant uppercase mb-0.5">Corte GP</span>
      <span class="text-sm font-bold font-mono text-on-surface leading-tight">${formatTableCell(secCorteGp)}</span>
      <span class="text-[8px] text-on-surface-variant block mt-0.5">Decisão GP</span>
    </div>
    <div class="bg-primary/5 border-2 border-primary rounded-lg p-2.5 flex flex-col justify-center shadow-xs">
      <span class="text-[9.5px] font-bold text-primary uppercase mb-0.5">Total Pasta LOA</span>
      <span class="text-base font-extrabold font-mono text-primary leading-tight">${formatTableCell(secTotalFinal)}</span>
      <span class="text-[8px] text-primary/90 font-bold block mt-0.5 truncate" title="Proposta: ${formatTableCell(secSolicitadoTotal)} · SF: ${formatTableCell(secAjusteSf)} · GP: ${formatTableCell(secCorteGp)}">
        Proposta: ${formatTableCell(secSolicitadoTotal)} · SF: ${formatTableCell(secAjusteSf)} · GP: ${formatTableCell(secCorteGp)}
      </span>
    </div>
  </div>`
  }`;

  // Renderizar tabelas das seções para esta secretaria
  let tablesHtml = "";
  if (data.sections && data.sections.length > 0) {
    const secSectionsHtml: string[] = [];
    data.sections.forEach((section) => {
      const secGroups = section.groups.filter((g) => (g.secretaria || "").trim() === secName.trim());
      if (secGroups.length > 0) {
        const secSecTotal = secGroups.reduce(
          (acc, g) =>
            acc +
            (g.valorTotal ??
              ((g.valLoa || 0) +
                (g.valorReajuste || 0) +
                (g.valorAditamento || 0) +
                (g.valorAjusteSf || 0) +
                (g.valorCorteGp || 0))),
          0
        );

        const groupsRows = secGroups.map((g) => renderSingleGroupRowsHtml(g, data.ocultarNatureza, data.ocultarAcao, data.ocultarVinculo)).join("\n");
        const colTitle = data.ocultarNatureza ? "Detalhamento / Processo" : "Natureza de despesa";
        secSectionsHtml.push(`
    <div class="mb-6">
      <div class="flex items-center justify-between bg-surface-container-high px-3.5 py-2 rounded-t-lg border-t border-x border-outline-variant">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[18px]">${section.sectionIcon || "folder"}</span>
          <h3 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wide">${escapeHtml(section.sectionTitle)}</h3>
          ${section.sectionBadge ? `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold bg-primary/10 text-primary border-primary/30 uppercase tracking-wider">${escapeHtml(section.sectionBadge)}</span>` : ""}
        </div>
        <div class="text-right flex items-center gap-1.5">
          <span class="text-[11px] text-on-surface-variant font-medium">Subtotal da Seção:</span>
          <span class="font-mono text-xs font-bold text-primary">${formatTableCell(secSecTotal)}</span>
        </div>
      </div>
      <div class="table-container overflow-x-auto border-x border-b border-outline-variant rounded-b-lg overflow-hidden shadow-xs bg-surface-container-lowest">
        <table class="w-full text-left border-collapse table-fixed min-w-[960px] max-w-full">
          <thead class="bg-primary-container text-on-primary">
            <tr>
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[28%]">${colTitle}</th>
              ${data.ocultarVinculo ? "" : '<th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[9%]">Vínculo</th>'}
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[11%]">Valor Solicitado</th>
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Reajuste</th>
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Aditamento</th>
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Ajuste SF</th>
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Corte GP</th>
              <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right bg-on-primary-fixed-variant w-[12%]">Total</th>
            </tr>
          </thead>
          <tbody class="font-table-data text-table-data text-on-surface">
            ${groupsRows}
          </tbody>
        </table>
      </div>
    </div>`);
      }
    });
    tablesHtml = secSectionsHtml.join("\n");
  } else {
    const secGroups = (data.groups || []).filter((g) => (g.secretaria || "").trim() === secName.trim());
    const groupsRows = secGroups.map((g) => renderSingleGroupRowsHtml(g, data.ocultarNatureza, data.ocultarAcao, data.ocultarVinculo)).join("\n");
    const colTitle = data.ocultarNatureza ? "Detalhamento / Processo" : "Natureza de despesa";
    tablesHtml = `
    <div class="table-container overflow-x-auto border border-outline-variant rounded-lg overflow-hidden shadow-xs bg-surface-container-lowest mb-6">
      <table class="w-full text-left border-collapse table-fixed min-w-[960px] max-w-full">
        <thead class="bg-primary-container text-on-primary">
          <tr>
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[28%]">${colTitle}</th>
            ${data.ocultarVinculo ? "" : '<th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[9%]">Vínculo</th>'}
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[11%]">Valor Solicitado</th>
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Reajuste</th>
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Aditamento</th>
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Ajuste SF</th>
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Corte GP</th>
            <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right bg-on-primary-fixed-variant w-[12%]">Total</th>
          </tr>
        </thead>
        <tbody class="font-table-data text-table-data text-on-surface">
          ${groupsRows}
        </tbody>
      </table>
    </div>`;
  }

  return secHeaderHtml + "\n" + tablesHtml + "\n</div>";
}

function renderAllSecretariasPaginatedHtml(data: LoaReportData): string {
  const secSet = new Set<string>();
  if (data.secretariasList && data.secretariasList.length > 0) {
    data.secretariasList.forEach((s) => s && secSet.add(s));
  }
  if (data.sections) {
    data.sections.forEach((sec) => {
      sec.groups.forEach((g) => {
        if (g.secretaria) secSet.add(g.secretaria);
      });
    });
  }
  if (data.groups) {
    data.groups.forEach((g) => {
      if (g.secretaria) secSet.add(g.secretaria);
    });
  }

  const sortedSecretarias = Array.from(secSet).sort((a, b) => a.localeCompare(b, "pt-BR"));

  if (sortedSecretarias.length === 0) {
    return renderGroupListHtml(data.groups || [], data.ocultarNatureza, data.ocultarAcao, data.ocultarVinculo);
  }

  return sortedSecretarias
    .map((secName, idx) => renderSecretariaReportBlockHtml(secName, idx + 1, data))
    .filter(Boolean)
    .join("\n");
}

function renderGroupListHtml(groups: LoaReportGroup[], ocultarNatureza = false, ocultarAcao = false, ocultarVinculo = false): string {
  // Verificar se há distinção de secretarias entre os grupos
  const secretarias = [...new Set(groups.map((g) => g.secretaria).filter(Boolean))] as string[];

  // Se houver mais de 1 secretaria ou se for relatório multi-secretaria com campo secretaria preenchido
  if (secretarias.length > 1) {
    // Agrupar por Secretaria
    const groupsBySec = new Map<string, LoaReportGroup[]>();
    groups.forEach((g) => {
      const sec = g.secretaria || "Outras Secretarias / Sem Órgão Definido";
      if (!groupsBySec.has(sec)) {
        groupsBySec.set(sec, []);
      }
      groupsBySec.get(sec)!.push(g);
    });

    const parts: string[] = [];
    let secIndex = 1;

    for (const [secName, secGroups] of groupsBySec.entries()) {
      const secLoa = secGroups.reduce((acc, g) => acc + (g.valLoa || 0), 0);
      const secReajuste = secGroups.reduce((acc, g) => acc + (g.valorReajuste || 0), 0);
      const secAditamento = secGroups.reduce((acc, g) => acc + (g.valorAditamento || 0), 0);
      const secAjusteSf = secGroups.reduce((acc, g) => acc + (g.valorAjusteSf || 0), 0);
      const secCorteGp = secGroups.reduce((acc, g) => acc + (g.valorCorteGp || 0), 0);
      const secTotal = secGroups.reduce(
        (acc, g) =>
          acc +
          (g.valorTotal ??
            ((g.valLoa || 0) +
              (g.valorReajuste || 0) +
              (g.valorAditamento || 0) +
              (g.valorAjusteSf || 0) +
              (g.valorCorteGp || 0))),
        0
      );

      const secHeaderHtml = `
<!-- Header Secretaria: ${escapeHtml(secName)} -->
<tr class="sec-header-row bg-[#003f87]/20 border-t-2 border-b-2 border-primary">
  <td colspan="${ocultarVinculo ? 1 : 2}" class="p-3 px-3.5 font-bold text-primary text-xs uppercase tracking-wider">
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary text-white text-[11.5px] font-bold shadow-xs">${secIndex}</span>
      <span class="material-symbols-outlined text-[19px] text-primary">apartment</span>
      <span class="font-bold text-[13.5px] text-on-surface tracking-wide">${escapeHtml(secName)}</span>
    </div>
  </td>
  <td class="p-3 px-3.5 text-right font-bold text-primary text-xs">${formatTableCell(secLoa)}</td>
  <td class="p-3 px-3.5 text-right font-bold text-on-surface text-xs">${formatTableCell(secReajuste)}</td>
  <td class="p-3 px-3.5 text-right font-bold text-on-surface text-xs">${formatTableCell(secAditamento)}</td>
  <td class="p-3 px-3.5 text-right font-bold text-on-surface text-xs">${formatTableCell(secAjusteSf)}</td>
  <td class="p-3 px-3.5 text-right font-bold text-on-surface text-xs">${formatTableCell(secCorteGp)}</td>
  <td class="p-3 px-3.5 text-right font-bold text-primary text-[13px] bg-primary/15">${formatTableCell(secTotal)}</td>
</tr>`;

      const secGroupsHtml = secGroups.map((g) => renderSingleGroupRowsHtml(g, ocultarNatureza, ocultarAcao, ocultarVinculo)).join("\n");
      parts.push(secHeaderHtml + "\n" + secGroupsHtml);
      secIndex++;
    }

    return parts.join("\n");
  }

  return groups.map((group) => renderSingleGroupRowsHtml(group, ocultarNatureza, ocultarAcao, ocultarVinculo)).join("\n");
}

function renderSectionBlockHtml(section: LoaReportSection, ocultarNatureza = false, ocultarAcao = false, ocultarVinculo = false): string {
  const sectionTitle = escapeHtml(section.sectionTitle);
  const sectionBadge = escapeHtml(section.sectionBadge || "");
  const sectionIcon = section.sectionIcon || "assignment";
  const subtotalTotal = formatTableCell(
    section.totals.total ??
      ((section.totals.loa || 0) +
        (section.totals.reajuste || 0) +
        (section.totals.aditamento || 0) +
        (section.totals.ajusteSf || 0) +
        (section.totals.corteGp || 0))
  );
  const groupsHtml = renderGroupListHtml(section.groups, ocultarNatureza, ocultarAcao, ocultarVinculo);
  const colTitle = ocultarNatureza ? "Detalhamento / Processo" : "Natureza de despesa";

  return `
<!-- Section: ${sectionTitle} -->
<div class="mb-8">
  <div class="flex items-center justify-between bg-surface-container-high px-4 py-2.5 rounded-t-lg border-t border-x border-outline-variant">
    <div class="flex items-center gap-2.5">
      <span class="material-symbols-outlined text-primary text-[20px]">${sectionIcon}</span>
      <h2 class="font-headline-md text-[14px] font-bold text-on-surface uppercase tracking-wide">${sectionTitle}</h2>
      ${sectionBadge ? `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border-primary/30 uppercase tracking-wider">${sectionBadge}</span>` : ""}
    </div>
    <div class="text-right flex items-center gap-2">
      <span class="text-xs text-on-surface-variant font-medium">Subtotal da Seção:</span>
      <span class="font-mono text-sm font-bold text-primary">${subtotalTotal}</span>
    </div>
  </div>
  <div class="table-container overflow-x-auto border-x border-b border-outline-variant rounded-b-lg overflow-hidden shadow-xs bg-surface-container-lowest">
    <table class="w-full text-left border-collapse table-fixed min-w-[960px] max-w-full">
      <thead class="bg-primary-container text-on-primary">
        <tr>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[28%]">${colTitle}</th>
          ${ocultarVinculo ? "" : '<th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[9%]">Vínculo</th>'}
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[11%]">Valor Solicitado</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Reajuste</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Aditamento</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Ajuste SF</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Corte GP</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right bg-on-primary-fixed-variant w-[12%]">Total</th>
        </tr>
      </thead>
      <tbody class="font-table-data text-table-data text-on-surface">
        ${groupsHtml}
      </tbody>
    </table>
  </div>
</div>`;
}

export function generateLoaReportHtml(data: LoaReportData): string {
  const rawSecretaria = data.tituloSecretaria || "11 - SECRETARIA DE SERVIÇOS E OBRAS";
  const isMultipleSecretarias = Boolean(
    data.isAllSecretariats ||
    (data.secretariasList && data.secretariasList.length > 2) ||
    rawSecretaria.includes(" · ") ||
    rawSecretaria.includes("Consolidado Geral") ||
    rawSecretaria.length > 120
  );

  const totalSecCount = data.secretariasList?.length || (rawSecretaria.includes(" · ") ? rawSecretaria.split(" · ").length : 0);

  // Título e subtítulo elegantes para o cabeçalho executivo
  const headerMainTitle = isMultipleSecretarias
    ? "Consolidado Geral do Município"
    : escapeHtml(rawSecretaria);

  const headerSubtitle = isMultipleSecretarias
    ? (totalSecCount > 0
        ? `Abrangendo todas as ${totalSecCount} Secretarias e Órgãos Municipais`
        : "Visão Geral Consolidada de Todas as Secretarias e Órgãos")
    : escapeHtml(data.unidadeOrcamentaria || "01.11.001.00 - Gabinete da Secretaria de Serviços e Obras");

  const secretaria = escapeHtml(rawSecretaria);
  const orgao = escapeHtml(data.orgao || "Órgão 01 - Prefeitura do Município de Osasco");
  const exercicio = escapeHtml(data.exercicio || "2027");
  const hasAdjustments = data.hasAdjustments ?? false;
  const scopeTitle = escapeHtml(data.reportScopeTitle || "");

  const ldoTotalFormatted = currency.format(data.totals.ldo || 0);
  const loaTotalFormatted = currency.format(data.totals.loa || 0);
  const reajusteVal = data.totals.reajuste || 0;
  const reajusteFormatted = reajusteVal > 0 ? `+${currency.format(reajusteVal)}` : currency.format(reajusteVal);
  const aditamentoFormatted = currency.format(data.totals.aditamento || 0);
  const ajusteSfFormatted = currency.format(data.totals.ajusteSf || 0);
  const corteGpFormatted = currency.format(data.totals.corteGp || 0);
  
  const totalCalculado =
    data.totals.total ??
    ((data.totals.loa || 0) +
      (data.totals.reajuste || 0) +
      (data.totals.aditamento || 0) +
      (data.totals.ajusteSf || 0) +
      (data.totals.corteGp || 0));
  const totalFormatted = currency.format(totalCalculado);

  const totalGeralLoa = formatTableCell(data.totals.loa);
  const totalGeralReajuste = formatTableCell(data.totals.reajuste);
  const totalGeralAditamento = formatTableCell(data.totals.aditamento);
  const totalGeralAjusteSf = formatTableCell(data.totals.ajusteSf);
  const totalGeralCorteGp = formatTableCell(data.totals.corteGp);
  const totalGeralTotal = formatTableCell(totalCalculado);

  let coverPageHtml = "";
  let bodyContentHtml = "";
  let showSingleSecCards = false;

  if (isMultipleSecretarias) {
    // OPÇÃO A: Capa Executiva Geral (Página 1) + Páginas Seguintes por Secretaria com seus próprios cards
    coverPageHtml = data.hideInitialCards ? "" : renderExecutiveCoverPage(data);
    bodyContentHtml = renderAllSecretariasPaginatedHtml(data);
  } else {
    // Relatório de uma única secretaria
    showSingleSecCards = !data.hideInitialCards;
    if (data.sections && data.sections.length > 0) {
      const sectionsHtml = data.sections.map((sec) => renderSectionBlockHtml(sec, data.ocultarNatureza, data.ocultarAcao, data.ocultarVinculo)).join("\n");
      bodyContentHtml = `
${sectionsHtml}

<!-- Grand Total Footer Summary Banner -->
<div class="bg-surface-container-high border-2 border-primary/40 rounded-lg p-4 shadow-sm mb-6">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h3 class="font-headline-md text-base font-bold text-primary uppercase">Total Geral Consolidado (Secretaria)</h3>
      <p class="text-xs text-on-surface-variant font-medium">Somatório integrado de Contratos, Demais Despesas e Banco de Projetos</p>
    </div>
    <div class="flex items-center gap-6 flex-wrap">
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">LDO</span>
        <strong class="font-mono text-sm text-on-surface">${ldoTotalFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">Valor Solicitado</span>
        <strong class="font-mono text-sm text-on-surface">${currency.format((data.totals.loa || 0) + (data.totals.reajuste || 0) + (data.totals.aditamento || 0))}</strong>
        <span class="text-[9px] text-on-surface-variant block mt-0.5 font-semibold">Base: ${loaTotalFormatted} + Reaj: ${reajusteFormatted} + Adit: ${aditamentoFormatted}</span>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-green-700 block uppercase font-bold">Reajustes</span>
        <strong class="font-mono text-sm text-green-800">${reajusteFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">Aditamentos</span>
        <strong class="font-mono text-sm text-on-surface">${aditamentoFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">Ajuste SF</span>
        <strong class="font-mono text-sm text-on-surface">${ajusteSfFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">Corte GP</span>
        <strong class="font-mono text-sm text-on-surface">${corteGpFormatted}</strong>
      </div>
      <div class="text-right pl-4 border-l border-outline-variant">
        <span class="text-[11px] text-primary block uppercase font-bold">Total Final LOA</span>
        <strong class="font-mono text-lg text-primary font-bold">${totalFormatted}</strong>
        <span class="text-[9px] text-primary/90 block mt-0.5 font-bold">Proposta: ${currency.format((data.totals.loa || 0) + (data.totals.reajuste || 0) + (data.totals.aditamento || 0))} · SF: ${ajusteSfFormatted} · GP: ${corteGpFormatted}</span>
      </div>
    </div>
  </div>
</div>`;
    } else {
      const groupsHtml = renderGroupListHtml(data.groups || [], data.ocultarNatureza, data.ocultarAcao, data.ocultarVinculo);
      const colTitle = data.ocultarNatureza ? "Detalhamento / Processo" : "Natureza de despesa";
      bodyContentHtml = `
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm mb-6">
  <div class="table-container overflow-x-auto">
    <table class="w-full text-left border-collapse table-fixed min-w-[960px] max-w-full">
      <thead class="bg-primary-container text-on-primary">
        <tr>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[28%]">${colTitle}</th>
          ${data.ocultarVinculo ? "" : '<th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[9%]">Vínculo</th>'}
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[11%]">Valor Solicitado</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Reajuste</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Aditamento</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Ajuste SF</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right w-[10%]">Corte GP</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right bg-on-primary-fixed-variant w-[12%]">Total</th>
        </tr>
      </thead>
      <tbody class="font-table-data text-table-data text-on-surface">
        ${groupsHtml}
      </tbody>
      <tfoot class="bg-surface-container-high border-t-2 border-outline-variant sticky bottom-0">
        <tr>
          <td class="p-padding-cell-v px-padding-cell-h font-table-data-bold text-table-data-bold sticky left-0 bg-surface-container-high" colspan="${data.ocultarVinculo ? 1 : 2}">Total Geral</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-primary">${totalGeralLoa}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralReajuste}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralAditamento}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralAjusteSf}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralCorteGp}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-primary bg-primary-fixed-dim/20">${totalGeralTotal}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>`;
    }
  }

  return `<!DOCTYPE html><html lang="pt-BR" style=""><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Relatório Técnico ${scopeTitle ? `(${scopeTitle}) ` : ""}- ${secretaria}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&amp;family=IBM+Plex+Sans:wght@400;600;700&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary-container": "#5e6473",
                        "surface": "#f9f9f9",
                        "on-secondary": "#ffffff",
                        "on-primary-fixed": "#001a40",
                        "primary-fixed-dim": "#acc7ff",
                        "secondary": "#585e6c",
                        "on-surface": "#1a1c1c",
                        "error": "#ba1a1a",
                        "surface-bright": "#f9f9f9",
                        "tertiary-container": "#56595b",
                        "tertiary-fixed-dim": "#c4c7c9",
                        "on-secondary-fixed-variant": "#414754",
                        "on-secondary-fixed": "#161c27",
                        "on-error-container": "#93000a",
                        "inverse-primary": "#acc7ff",
                        "surface-container-low": "#f3f3f4",
                        "surface-container": "#eeeeee",
                        "primary-fixed": "#d7e2ff",
                        "on-primary": "#ffffff",
                        "inverse-on-surface": "#f0f1f1",
                        "outline": "#727784",
                        "surface-container-highest": "#e2e2e2",
                        "error-container": "#ffdad6",
                        "surface-variant": "#e2e2e2",
                        "on-primary-container": "#bbd0ff",
                        "on-tertiary-container": "#cdd0d2",
                        "on-tertiary": "#ffffff",
                        "secondary-fixed": "#dde2f3",
                        "on-tertiary-fixed-variant": "#444749",
                        "outline-variant": "#c2c6d4",
                        "surface-tint": "#115cb9",
                        "secondary-container": "#dde2f3",
                        "on-surface-variant": "#424752",
                        "surface-dim": "#dadada",
                        "secondary-fixed-dim": "#c1c6d7",
                        "on-background": "#1a1c1c",
                        "background": "#f9f9f9",
                        "tertiary-fixed": "#e0e3e5",
                        "primary-container": "#0056b3",
                        "surface-container-high": "#e8e8e8",
                        "on-primary-fixed-variant": "#004491",
                        "on-error": "#ffffff",
                        "surface-container-lowest": "#ffffff",
                        "primary": "#003f87",
                        "inverse-surface": "#2f3131",
                        "tertiary": "#3e4244",
                        "on-tertiary-fixed": "#191c1e"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "padding-cell-v": "0.32rem",
                        "gutter-table": "0.5rem",
                        "stack-compact": "0.2rem",
                        "margin-page": "1.5rem",
                        "padding-cell-h": "0.4rem",
                        "stack-default": "0.75rem"
                    },
                    "fontFamily": {
                        "headline-lg-mobile": ["Hanken Grotesk"],
                        "headline-md": ["Hanken Grotesk"],
                        "table-data-bold": ["Inter"],
                        "label-caps": ["IBM Plex Sans"],
                        "body-sm": ["Inter"],
                        "headline-lg": ["Hanken Grotesk"],
                        "table-data": ["Inter"],
                        "table-header": ["IBM Plex Sans"],
                        "body-md": ["Inter"]
                    },
                    "fontSize": {
                        "headline-lg-mobile": ["20px", { "lineHeight": "26px", "fontWeight": "700" }],
                        "headline-md": ["16px", { "lineHeight": "22px", "fontWeight": "600" }],
                        "table-data-bold": ["10px", { "lineHeight": "13px", "fontWeight": "700" }],
                        "label-caps": ["9.5px", { "lineHeight": "12px", "fontWeight": "700" }],
                        "body-sm": ["10.5px", { "lineHeight": "14px", "fontWeight": "400" }],
                        "headline-lg": ["26px", { "lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "table-data": ["10px", { "lineHeight": "13px", "fontWeight": "400" }],
                        "table-header": ["9.5px", { "lineHeight": "12px", "letterSpacing": "0.02em", "fontWeight": "700" }],
                        "body-md": ["12px", { "lineHeight": "16px", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>
<style>
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        @page :left {
            size: A4 landscape;
            margin: 8mm;
        }
        @page :right {
            size: A4 landscape;
            margin: 8mm;
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .zebra-row:nth-child(even) { background-color: rgba(0, 86, 179, 0.02); }
        .table-container { scrollbar-width: thin; scrollbar-color: #c2c6d4 #f9f9f9; }
        .table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .table-container::-webkit-scrollbar-track { background: #f9f9f9; }
        .table-container::-webkit-scrollbar-thumb { background-color: #c2c6d4; border-radius: 4px; }

        /* Layout de Folha A4 Paisagem na Visualização em Tela */
        .page-sheet-landscape {
            width: 297mm;
            min-height: 210mm;
            padding: 8mm 10mm;
            margin: 0 auto 28px auto;
            background-color: #ffffff;
            border: 1px solid #dcdfe4;
            border-radius: 4px;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
            box-sizing: border-box;
            position: relative;
        }

        .page-sheet-landscape.executive-cover-sheet {
            height: 210mm;
            max-height: 210mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        @media screen {
            body {
                background-color: #eef2f6 !important;
            }
            .a4-preview-workspace {
                padding: 24px 16px 48px 16px;
                overflow-x: auto;
            }
        }

        @media print {
            html, body {
                width: 100% !important;
                height: auto !important;
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .print-hidden {
                display: none !important;
            }
            .a4-preview-workspace {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
            }
            .page-sheet-landscape {
                width: 100% !important;
                min-height: auto !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background-color: transparent !important;
            }
            .table-container {
                overflow: visible !important;
            }
            table {
                width: 100% !important;
                min-width: 100% !important;
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
            }
            .sec-header-row {
                page-break-after: avoid !important;
                background-color: #e6edf8 !important;
            }
            thead {
                display: table-header-group !important;
            }
            tfoot {
                display: table-footer-group !important;
            }
            .executive-cover-page {
                page-break-after: always !important;
                break-after: page !important;
                height: 194mm !important;
                max-height: 194mm !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
            }
            .secretaria-report-block {
                page-break-before: always !important;
                break-before: page !important;
            }
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col">
<!-- TopAppBar -->
<header class="bg-secondary dark:bg-on-secondary-fixed flex justify-between items-center w-full px-margin-page py-2 bg-secondary border-b border-outline-variant shrink-0 z-50 print-hidden">
<div class="flex items-center gap-4">
<span class="font-headline-md text-headline-md font-bold text-on-secondary uppercase tracking-wider">Prefeitura Municipal de Osasco Relatorio LOA</span>
</div>
<nav class="hidden md:flex items-center gap-3">
<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded text-on-secondary text-xs font-semibold">
  <span class="material-symbols-outlined text-[16px]">description</span>
  <span>Formato: A4 Paisagem (297 × 210 mm)</span>
</div>
<button onclick="window.print()" class="bg-primary-container text-on-primary hover:bg-primary px-3 py-1 rounded font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
<span class="material-symbols-outlined text-[16px]">print</span>
<span>Imprimir / Salvar PDF</span>
</button>
</nav>

</header>
<div class="flex flex-1 overflow-hidden">
<!-- Main Canvas -->
<main class="flex-1 flex flex-col w-full overflow-hidden relative">
<div class="flex-1 overflow-y-auto a4-preview-workspace">
${
  isMultipleSecretarias
    ? `${coverPageHtml ? `${coverPageHtml}\n` : ""}${bodyContentHtml}`
    : `<div class="page-sheet-landscape secretaria-report-block">
<!-- Page Header & Context (Secretaria Única) -->
<div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-4 border-b border-outline-variant/60">
  <div class="flex items-start gap-3.5">
    <div class="w-12 h-12 bg-primary/10 border border-primary/25 rounded-xl flex items-center justify-center text-primary shrink-0 mt-0.5">
      <span class="material-symbols-outlined text-[26px]">domain</span>
    </div>
    <div>
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <span class="font-table-header text-[11px] text-primary font-bold tracking-widest uppercase">
          ${orgao}
        </span>
      </div>
      <h1 class="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface tracking-tight mb-1">
        ${headerMainTitle}
      </h1>
      <p class="font-body-md text-xs md:text-sm text-on-surface-variant flex items-center gap-2 flex-wrap">
        <span>${headerSubtitle}</span>
        <span class="text-outline-variant">•</span>
        <span>Exercício ${exercicio}</span>
        ${scopeTitle ? `<span class="text-outline-variant">•</span><span class="font-bold text-primary">${scopeTitle}</span>` : ""}
      </p>
    </div>
  </div>
  <div class="shrink-0 flex items-center gap-2 self-start md:self-auto">
    <div class="inline-flex items-center bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-[11px] font-semibold uppercase tracking-wider shadow-xs">
      <span class="material-symbols-outlined text-[15px] mr-1 text-primary">verified</span>
      ${hasAdjustments ? "Possui Ajustes Técnicos" : "Planejamento LOA Consolidado"}
    </div>
  </div>
</div>
${
  showSingleSecCards
    ? `<!-- Financial Summary Cards (Secretaria Única) -->
<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-gutter-table mb-6">
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Valor LDO</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${ldoTotalFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Valor Solicitado</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${currency.format((data.totals.loa || 0) + (data.totals.reajuste || 0) + (data.totals.aditamento || 0))}</span>
<span class="text-[9px] text-on-surface-variant block mt-1 font-semibold truncate" title="Soma: Solicitado (${loaTotalFormatted}) + Reajuste (${reajusteFormatted}) + Aditamento (${aditamentoFormatted})">Base: ${loaTotalFormatted} + Reaj: ${reajusteFormatted} + Adit: ${aditamentoFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center bg-green-50 border-green-200">
<span class="font-label-caps text-label-caps text-green-700 uppercase mb-1">Reajuste</span>
<span class="font-headline-md text-headline-md text-green-800 font-semibold">${reajusteFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Aditamento</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${aditamentoFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Ajuste SF</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${ajusteSfFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Corte GP</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${corteGpFormatted}</span>
</div>
<div class="bg-surface-container-lowest border-2 border-primary rounded-lg p-4 flex flex-col justify-center shadow-sm">
<span class="font-label-caps text-label-caps text-primary uppercase mb-1">Total Final LOA</span>
<span class="font-headline-md text-headline-md text-primary font-bold">${totalFormatted}</span>
<span class="text-[9px] text-primary/90 block mt-1 font-bold truncate" title="Proposta: ${currency.format((data.totals.loa || 0) + (data.totals.reajuste || 0) + (data.totals.aditamento || 0))} · SF: ${ajusteSfFormatted} · GP: ${corteGpFormatted}">Proposta: ${currency.format((data.totals.loa || 0) + (data.totals.reajuste || 0) + (data.totals.aditamento || 0))} · SF: ${ajusteSfFormatted} · GP: ${corteGpFormatted}</span>
</div>
</div>`
    : ""
}
<!-- Main Report Tables (Sectioned or Single) -->
${bodyContentHtml}
</div>`
}

</div>
<!-- Footer -->
<footer class="bg-surface-container-lowest dark:bg-surface-dim flex justify-between items-center px-margin-page py-padding-cell-v w-full border-t border-outline-variant mt-auto">
<span class="font-body-sm text-body-sm text-on-surface-variant dark:text-on-secondary-container">Relatório LOA - Secretaria de Finanças ${exercicio}</span>
<div class="flex items-center gap-4">
<span class="font-body-sm text-body-sm text-on-surface-variant">Prefeitura do Município de Osasco</span>
</div>
</footer>
</main>
</div>
<script>
  window.addEventListener('load', function() {
    // Garante renderização das fontes e estilos antes da impressão
    ${data.autoPrint ? `setTimeout(function() { window.print(); }, 500);` : ""}
  });
</script>
</body></html>`;
}

export function openLoaReportWindow(data: LoaReportData, autoPrint = false): void {
  const html = generateLoaReportHtml({ ...data, autoPrint });
  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  } else {
    // Fallback: download HTML
    downloadLoaReportHtml(data);
  }
}

export function downloadLoaReportHtml(data: LoaReportData): void {
  const html = generateLoaReportHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const secSafe = (data.tituloSecretaria || "loa").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.download = `relatorio-loa-${secSafe}-2027.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
