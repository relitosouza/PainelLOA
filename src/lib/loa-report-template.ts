import { currency } from "./format";

export interface LoaReportItem {
  natureza: string;
  vinculo?: string;
  processoObs?: string;
  valLdo?: number;
  valLoa?: number;
  valorReajuste?: number;
  valorAditamento?: number;
  valorTotal?: number;
}

export interface LoaReportGroup {
  groupCode?: string;
  groupTitle: string;
  valLdo: number;
  valLoa: number;
  valorReajuste: number;
  valorAditamento: number;
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
    total: number;
  };
  groups: LoaReportGroup[];
}

export interface LoaReportData {
  tituloSecretaria?: string;
  unidadeOrcamentaria?: string;
  orgao?: string;
  exercicio?: string;
  hasAdjustments?: boolean;
  autoPrint?: boolean;
  reportScopeTitle?: string;
  totals: {
    ldo: number;
    loa: number;
    reajuste: number;
    aditamento: number;
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

function renderGroupListHtml(groups: LoaReportGroup[]): string {
  return groups.map((group) => {
    const groupName = escapeHtml(group.groupTitle || "Grupo de Despesa");
    const groupValLdo = formatTableCell(group.valLdo);
    const groupValLoa = formatTableCell(group.valLoa);
    const groupReajuste = formatTableCell(group.valorReajuste);
    const groupAditamento = formatTableCell(group.valorAditamento);
    const groupTotal = formatTableCell(group.valorTotal);

    const itemsHtml = group.items.map((item) => {
      const nat = escapeHtml(item.natureza || "—");
      const vinc = escapeHtml(item.vinculo || "—");
      const rawProc = (item.processoObs || "").trim();
      const proc = escapeHtml(rawProc);
      const showProc = rawProc !== "" && rawProc !== "—";
      const iValLoa = formatTableCell(item.valLoa);
      const iReajuste = formatTableCell(item.valorReajuste);
      const iAditamento = formatTableCell(item.valorAditamento);
      const iTotal = formatTableCell(item.valorTotal ?? ((item.valLoa || 0) + (item.valorReajuste || 0) + (item.valorAditamento || 0)));

      return `
<tr class="zebra-row border-b border-outline-variant hover:bg-surface-container-low transition-colors">
  <td class="p-padding-cell-v px-padding-cell-h">
    <div class="font-semibold text-on-surface text-[13px] leading-snug">${nat}</div>
    ${showProc ? `<div class="text-[11.5px] text-on-surface-variant font-normal mt-1 leading-snug break-words tracking-tight">${proc}</div>` : ""}
  </td>
  <td class="p-padding-cell-v px-padding-cell-h text-on-surface-variant">${vinc}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant/40 font-mono text-[12px]">0,00</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right">${iValLoa}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant">${iReajuste}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant">${iAditamento}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold">${iTotal}</td>
</tr>`;
    }).join("\n");

    return `
<!-- Group: ${groupName} -->
<tr class="bg-surface-container-highest border-b border-outline-variant">
  <td class="p-padding-cell-v px-padding-cell-h font-table-data-bold text-table-data-bold sticky left-0" colspan="2">${groupName}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold">${groupValLdo}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold">${groupValLoa}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold">${groupReajuste}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold">${groupAditamento}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold">${groupTotal}</td>
</tr>
${itemsHtml}`;
  }).join("\n");
}

function renderSectionBlockHtml(section: LoaReportSection): string {
  const sectionTitle = escapeHtml(section.sectionTitle);
  const sectionBadge = escapeHtml(section.sectionBadge || "");
  const sectionIcon = section.sectionIcon || "assignment";
  const subtotalLdo = formatTableCell(section.totals.ldo);
  const subtotalLoa = formatTableCell(section.totals.loa);
  const subtotalReajuste = formatTableCell(section.totals.reajuste);
  const subtotalAditamento = formatTableCell(section.totals.aditamento);
  const subtotalTotal = formatTableCell(section.totals.total);
  const groupsHtml = renderGroupListHtml(section.groups);

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
    <table class="w-full text-left border-collapse min-w-[1200px]">
      <thead class="bg-primary-container text-on-primary">
        <tr>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant min-w-[320px]">Natureza de despesa</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[120px]">Vínculo</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Valor LDO</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Valor LOA</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Reajuste</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Aditamento</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right bg-on-primary-fixed-variant">Total</th>
        </tr>
      </thead>
      <tbody class="font-table-data text-table-data text-on-surface">
        ${groupsHtml}
      </tbody>
      <tfoot class="bg-surface-container-high border-t-2 border-outline-variant">
        <tr class="font-table-data-bold text-table-data-bold">
          <td class="p-padding-cell-v px-padding-cell-h sticky left-0 bg-surface-container-high" colspan="2">Subtotal · ${sectionTitle}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant">${subtotalLdo}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right text-primary">${subtotalLoa}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant">${subtotalReajuste}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right text-on-surface-variant">${subtotalAditamento}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right text-primary bg-primary-fixed-dim/20">${subtotalTotal}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>`;
}

export function generateLoaReportHtml(data: LoaReportData): string {
  const secretaria = escapeHtml(data.tituloSecretaria || "11 - SECRETARIA DE SERVIÇOS E OBRAS");
  const unidade = escapeHtml(data.unidadeOrcamentaria || "01.11.001.00 - Gabinete da Secretaria de Serviços e Obras");
  const orgao = escapeHtml(data.orgao || "Órgão 01 - Prefeitura do Município de Osasco");
  const exercicio = escapeHtml(data.exercicio || "2027");
  const hasAdjustments = data.hasAdjustments ?? false;
  const scopeTitle = escapeHtml(data.reportScopeTitle || "");

  const ldoTotalFormatted = currency.format(data.totals.ldo || 0);
  const loaTotalFormatted = currency.format(data.totals.loa || 0);
  const reajusteVal = data.totals.reajuste || 0;
  const reajusteFormatted = reajusteVal > 0 ? `+${currency.format(reajusteVal)}` : currency.format(reajusteVal);
  const aditamentoFormatted = currency.format(data.totals.aditamento || 0);
  const totalFormatted = currency.format(data.totals.total || 0);

  const totalGeralLdo = formatTableCell(data.totals.ldo);
  const totalGeralLoa = formatTableCell(data.totals.loa);
  const totalGeralReajuste = formatTableCell(data.totals.reajuste);
  const totalGeralAditamento = formatTableCell(data.totals.aditamento);
  const totalGeralTotal = formatTableCell(data.totals.total);

  let bodyContentHtml = "";

  if (data.sections && data.sections.length > 0) {
    const sectionsHtml = data.sections.map((sec) => renderSectionBlockHtml(sec)).join("\n");
    bodyContentHtml = `
${sectionsHtml}

<!-- Grand Total Footer Summary Banner -->
<div class="bg-surface-container-high border-2 border-primary/40 rounded-lg p-4 shadow-sm mb-6">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h3 class="font-headline-md text-base font-bold text-primary uppercase">Total Geral Consolidado (Secretaria)</h3>
      <p class="text-xs text-on-surface-variant font-medium">Somatório integrado de Contratos e Demais Despesas Orçamentárias</p>
    </div>
    <div class="flex items-center gap-6 flex-wrap">
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">LDO</span>
        <strong class="font-mono text-sm text-on-surface">${ldoTotalFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">LOA Inicial</span>
        <strong class="font-mono text-sm text-on-surface">${loaTotalFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-green-700 block uppercase font-bold">Reajustes</span>
        <strong class="font-mono text-sm text-green-800">${reajusteFormatted}</strong>
      </div>
      <div class="text-right">
        <span class="text-[11px] text-on-surface-variant block uppercase font-bold">Aditamentos</span>
        <strong class="font-mono text-sm text-on-surface">${aditamentoFormatted}</strong>
      </div>
      <div class="text-right pl-4 border-l border-outline-variant">
        <span class="text-[11px] text-primary block uppercase font-bold">Total Final LOA</span>
        <strong class="font-mono text-lg text-primary font-bold">${totalFormatted}</strong>
      </div>
    </div>
  </div>
</div>`;
  } else {
    const groupsHtml = renderGroupListHtml(data.groups || []);
    bodyContentHtml = `
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm mb-6">
  <div class="table-container overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-[1200px]">
      <thead class="bg-primary-container text-on-primary">
        <tr>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant min-w-[320px]">Natureza de despesa</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant w-[120px]">Vínculo</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Valor LDO</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Valor LOA</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Reajuste</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right">Aditamento</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right bg-on-primary-fixed-variant">Total</th>
        </tr>
      </thead>
      <tbody class="font-table-data text-table-data text-on-surface">
        ${groupsHtml}
      </tbody>
      <tfoot class="bg-surface-container-high border-t-2 border-outline-variant sticky bottom-0">
        <tr>
          <td class="p-padding-cell-v px-padding-cell-h font-table-data-bold text-table-data-bold sticky left-0 bg-surface-container-high" colspan="2">Total Geral</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralLdo}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-primary">${totalGeralLoa}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralReajuste}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-on-surface-variant">${totalGeralAditamento}</td>
          <td class="p-padding-cell-v px-padding-cell-h text-right font-table-data-bold text-table-data-bold text-primary bg-primary-fixed-dim/20">${totalGeralTotal}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>`;
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
                        "padding-cell-v": "0.5rem",
                        "gutter-table": "0.75rem",
                        "stack-compact": "0.25rem",
                        "margin-page": "2rem",
                        "padding-cell-h": "0.75rem",
                        "stack-default": "1rem"
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
                        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "table-data-bold": ["13px", { "lineHeight": "18px", "fontWeight": "700" }],
                        "label-caps": ["11px", { "lineHeight": "14px", "fontWeight": "700" }],
                        "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "table-data": ["13px", { "lineHeight": "18px", "fontWeight": "400" }],
                        "table-header": ["13px", { "lineHeight": "16px", "letterSpacing": "0.01em", "fontWeight": "600" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
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
            thead {
                display: table-header-group !important;
            }
            tfoot {
                display: table-footer-group !important;
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
<a class="text-on-secondary-container dark:text-secondary-fixed-dim font-medium hover:bg-on-secondary-fixed-variant transition-colors px-3 py-1 rounded" href="javascript:void(0)">Relatórios</a>
<a class="text-on-secondary-container dark:text-secondary-fixed-dim font-medium hover:bg-on-secondary-fixed-variant transition-colors px-3 py-1 rounded" href="javascript:void(0)">Consultas</a>
<a class="text-on-secondary-container dark:text-secondary-fixed-dim font-medium hover:bg-on-secondary-fixed-variant transition-colors px-3 py-1 rounded" href="javascript:void(0)">Configurações</a>
<button onclick="window.print()" class="bg-primary-container text-on-primary hover:bg-primary px-3 py-1 rounded font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
<span class="material-symbols-outlined text-[16px]">print</span>
<span>Imprimir / Salvar PDF</span>
</button>
</nav>

</header>
<div class="flex flex-1 overflow-hidden">
<!-- Main Canvas -->
<main class="flex-1 flex flex-col w-full overflow-hidden relative bg-surface">
<div class="flex-1 overflow-y-auto px-margin-page py-6">
<!-- Page Header & Context -->
<div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
<div>
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-1">${secretaria}</h1>
<p class="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 flex-wrap">
<span class="">${unidade}</span>
<span class="text-outline-variant">•</span>
<span class="">${orgao}</span>
<span class="text-outline-variant">•</span>
<span class="">Exercício ${exercicio}</span>
${scopeTitle ? `<span class="text-outline-variant">•</span><span class="font-bold text-primary">${scopeTitle}</span>` : ""}
</p>
</div>
<div class="inline-flex items-center bg-surface-container-highest px-3 py-1 rounded border border-outline-variant text-on-surface-variant font-label-caps text-label-caps uppercase">
<span class="material-symbols-outlined text-[16px] mr-1" data-icon="info">info</span>
    ${hasAdjustments ? "Possui ajustes técnicos" : "Planejamento LOA Consolidado"}
</div>
</div>
<!-- Financial Summary Cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter-table mb-6">
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Valor LDO</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${ldoTotalFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Valor LOA</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${loaTotalFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center bg-green-50 border-green-200">
<span class="font-label-caps text-label-caps text-green-700 uppercase mb-1">Reajuste</span>
<span class="font-headline-md text-headline-md text-green-800 font-semibold">${reajusteFormatted}</span>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Aditamento</span>
<span class="font-headline-md text-headline-md text-on-surface font-semibold">${aditamentoFormatted}</span>
</div>
<div class="bg-surface-container-lowest border-2 border-primary rounded-lg p-4 flex flex-col justify-center lg:col-start-5 shadow-sm">
<span class="font-label-caps text-label-caps text-primary uppercase mb-1">Total</span>
<span class="font-headline-md text-headline-md text-primary font-bold">${totalFormatted}</span>
</div>
</div>

<!-- Main Report Tables (Sectioned or Single) -->
${bodyContentHtml}

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
