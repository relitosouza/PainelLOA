import { currency } from "./format";

export interface AuditoriaAlteracaoItem {
  id: string;
  dotacaoId?: string | null;
  exercicio: number;
  secretaria: string;
  codigoSecretaria?: string | null;
  programa?: string | null;
  acao?: string | null;
  natureza?: string | null;
  subelemento?: string | null;
  processo?: string | null;
  apelido?: string | null;
  valorAnterior: number;
  valorNovo: number;
  diferenca: number;
  justificativa: string;
  tipoAlteracao?: string;
  status?: string;
  nomeOperador: string;
  emailOperador?: string | null;
  criadoEm: string;
}

export interface AuditoriaExclusaoItem {
  id: string;
  dotacaoId: string;
  exercicio: number;
  secretaria: string;
  programa?: string | null;
  acao?: string | null;
  natureza?: string | null;
  subelemento?: string | null;
  processo?: string | null;
  valorOriginal: number;
  dadosOriginais?: unknown;
  motivoExclusao: string;
  restaurado: boolean;
  nomeOperador: string;
  criadoEm: string;
}

export interface AuditoriaReportData {
  titulo?: string;
  exercicio?: number | string;
  secretariaFiltro?: string;
  secretariaNome?: string;
  buscaFiltro?: string;
  activeTab?: "alteracoes" | "exclusoes" | "todas";
  dataEmissao?: string;
  alteracoes: AuditoriaAlteracaoItem[];
  exclusoes: AuditoriaExclusaoItem[];
  autoPrint?: boolean;
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTableCell(val?: number): string {
  if (val === undefined || val === null || Math.abs(val) < 0.005) return "R$ 0,00";
  return currency.format(val);
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return escapeHtml(dateStr);
    return dateFormat.format(d);
  } catch {
    return escapeHtml(dateStr);
  }
}

export function generateAuditoriaReportHtml(data: AuditoriaReportData): string {
  const exercicio = data.exercicio || 2027;
  const dataEmissao = data.dataEmissao || dateFormat.format(new Date());
  const activeTab = data.activeTab || "alteracoes";

  const totalValorAnterior = data.alteracoes.reduce((acc, a) => acc + (a.valorAnterior || 0), 0);
  const totalValorNovo = data.alteracoes.reduce((acc, a) => acc + (a.valorNovo || 0), 0);
  const totalDiferenca = data.alteracoes.reduce((acc, a) => acc + (a.diferenca || 0), 0);

  const totalExclusoesValor = data.exclusoes.reduce((acc, e) => acc + (e.valorOriginal || 0), 0);

  const totalSuplementacoes = data.alteracoes
    .filter((a) => a.diferenca > 0)
    .reduce((acc, a) => acc + a.diferenca, 0);

  const totalReducoes = data.alteracoes
    .filter((a) => a.diferenca < 0)
    .reduce((acc, a) => acc + Math.abs(a.diferenca), 0);

  const saldoLiquido = totalSuplementacoes - totalReducoes;

  const showAlteracoes = activeTab === "alteracoes" || activeTab === "todas";
  const showExclusoes = activeTab === "exclusoes" || activeTab === "todas";

  const secFilterText = data.secretariaNome
    ? `${escapeHtml(data.secretariaNome)} (${escapeHtml(data.secretariaFiltro)})`
    : data.secretariaFiltro
    ? escapeHtml(data.secretariaFiltro)
    : "Todas as Secretarias";

  const rowsAlteracoesHtml = data.alteracoes.length === 0
    ? `<tr><td colspan="8" class="text-center py-6 text-on-surface-variant italic">Nenhum registro de alteração de valor encontrado.</td></tr>`
    : data.alteracoes
        .map((a) => {
          const isUp = a.diferenca > 0;
          const isDown = a.diferenca < 0;
          const diffClass = isUp
            ? "text-emerald-700 font-bold"
            : isDown
            ? "text-rose-700 font-bold"
            : "text-on-surface-variant";
          const diffSign = isUp ? "+" : "";

          return `
<tr class="zebra-row border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
  <td class="p-2 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">${formatDate(a.criadoEm)}</td>
  <td class="p-2">
    <div class="font-bold text-[12px] text-on-surface">${escapeHtml(a.nomeOperador)}</div>
    ${a.emailOperador ? `<div class="text-[10px] text-on-surface-variant font-mono">${escapeHtml(a.emailOperador)}</div>` : ""}
  </td>
  <td class="p-2 max-w-[200px]">
    <div class="font-semibold text-[12px] text-on-surface">${escapeHtml(a.secretaria)}</div>
    ${a.acao ? `<div class="text-[10px] text-on-surface-variant">${escapeHtml(a.acao)}</div>` : ""}
  </td>
  <td class="p-2 max-w-[180px]">
    <div class="font-medium text-[12px] text-on-surface">${escapeHtml(a.subelemento || "—")}</div>
    ${a.natureza ? `<div class="text-[10px] text-on-surface-variant font-mono">${escapeHtml(a.natureza)}</div>` : ""}
  </td>
  <td class="p-2 text-right font-mono text-[12px] text-on-surface-variant">${formatTableCell(a.valorAnterior)}</td>
  <td class="p-2 text-right font-mono text-[12px] font-bold text-on-surface">${formatTableCell(a.valorNovo)}</td>
  <td class="p-2 text-right font-mono text-[12px] ${diffClass}">${diffSign}${formatTableCell(a.diferenca)}</td>
  <td class="p-2 max-w-[240px]">
    <div class="text-[11px] text-on-surface leading-snug break-words bg-surface-container-lowest p-1.5 rounded border border-outline-variant/40">
      ${escapeHtml(a.justificativa)}
    </div>
  </td>
</tr>`;
        })
        .join("\n");

  const rowsExclusoesHtml = data.exclusoes.length === 0
    ? `<tr><td colspan="7" class="text-center py-6 text-on-surface-variant italic">Nenhum registro de dotação excluída encontrado.</td></tr>`
    : data.exclusoes
        .map((e) => {
          return `
<tr class="zebra-row border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
  <td class="p-2 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">${formatDate(e.criadoEm)}</td>
  <td class="p-2">
    <div class="font-bold text-[12px] text-on-surface">${escapeHtml(e.nomeOperador)}</div>
  </td>
  <td class="p-2 max-w-[200px]">
    <div class="font-semibold text-[12px] text-on-surface">${escapeHtml(e.secretaria)}</div>
    ${e.acao ? `<div class="text-[10px] text-on-surface-variant">${escapeHtml(e.acao)}</div>` : ""}
  </td>
  <td class="p-2 max-w-[200px]">
    <div class="font-medium text-[12px] text-rose-700 line-through">${escapeHtml(e.subelemento || "—")}</div>
    ${e.natureza ? `<div class="text-[10px] text-on-surface-variant font-mono">${escapeHtml(e.natureza)}</div>` : ""}
  </td>
  <td class="p-2 text-right font-mono text-[12px] font-bold text-on-surface whitespace-nowrap">${formatTableCell(e.valorOriginal)}</td>
  <td class="p-2 max-w-[260px]">
    <div class="text-[11px] text-on-surface leading-snug break-words bg-rose-50/50 p-1.5 rounded border border-rose-200/50">
      ${escapeHtml(e.motivoExclusao || "Exclusão de dotação")}
    </div>
  </td>
  <td class="p-2 text-center whitespace-nowrap">
    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${e.restaurado ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-800 border border-rose-300"}">
      ${e.restaurado ? "Restaurado" : "Excluído"}
    </span>
  </td>
</tr>`;
        })
        .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR" class="light">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Relatório de Auditoria Orçamentária - ${escapeHtml(String(exercicio))}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700;800&family=IBM+Plex+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            "surface": "#ffffff",
            "on-surface": "#1a1c1c",
            "on-surface-variant": "#43474e",
            "surface-container": "#f1f4f9",
            "surface-container-high": "#e8e8e8",
            "surface-container-lowest": "#ffffff",
            "outline-variant": "#c2c6d4",
            "primary": "#003f87",
            "on-primary": "#ffffff",
            "primary-container": "#0056b3",
          }
        }
      }
    };
  </script>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    body {
      font-family: 'Inter', sans-serif;
      color: #1a1c1c;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    h1, h2, h3 {
      font-family: 'Hanken Grotesk', sans-serif;
    }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }
    .zebra-row:nth-child(even) {
      background-color: rgba(0, 63, 135, 0.02);
    }
    @media print {
      .print-hidden {
        display: none !important;
      }
      body {
        margin: 0;
        padding: 0;
      }
      table {
        width: 100% !important;
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
<body class="bg-surface text-on-surface antialiased min-h-screen flex flex-col p-6 sm:p-8">

  <!-- Barra Superior de Ações (Oculta na Impressão) -->
  <header class="print-hidden mb-6 p-4 rounded-xl bg-surface-container border border-outline-variant flex flex-wrap items-center justify-between gap-4 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
        <span class="material-symbols-outlined text-2xl">history_edu</span>
      </div>
      <div>
        <h2 class="text-sm font-bold text-on-surface">Painel de Impressão • Auditoria Orçamentária</h2>
        <p class="text-xs text-on-surface-variant">Visualize em formato formal de auditoria ou clique para gerar o PDF oficial.</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-primary text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-primary-container transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-sm">print</span>
        <span>Imprimir / Salvar PDF</span>
      </button>
      <button onclick="window.close()" class="px-3 py-2 rounded-lg bg-white border border-outline-variant font-semibold text-xs text-on-surface hover:bg-gray-50 transition-colors cursor-pointer">
        Fechar Janela
      </button>
    </div>
  </header>

  <!-- Cabeçalho Oficial do Relatório -->
  <div class="border-b-2 border-primary pb-4 mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Prefeitura do Município de Osasco • Secretaria de Finanças
        </div>
        <h1 class="text-2xl font-black text-primary mt-0.5 tracking-tight">
          Relatório de Auditoria Orçamentária &amp; Rastreabilidade
        </h1>
        <div class="text-xs text-on-surface-variant flex flex-wrap items-center gap-2 mt-1">
          <span>Exercício Financeiro: <strong class="text-on-surface">${escapeHtml(String(exercicio))}</strong></span>
          <span>•</span>
          <span>Secretaria: <strong class="text-on-surface">${secFilterText}</strong></span>
          ${data.buscaFiltro ? `<span>•</span><span>Filtro de busca: <strong class="text-on-surface">"${escapeHtml(data.buscaFiltro)}"</strong></span>` : ""}
        </div>
      </div>
      <div class="text-left sm:text-right text-xs text-on-surface-variant border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant/60">
        <div>Emissão: <strong class="text-on-surface">${escapeHtml(dataEmissao)}</strong></div>
        <div class="text-[10px] text-on-surface-variant/80 font-mono mt-0.5">Autenticação: AUD-${Date.now().toString(36).toUpperCase()}</div>
      </div>
    </div>
  </div>

  <!-- Quadro Resumo de Métricas de Auditoria -->
  <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
    <div class="bg-surface-container p-3 rounded-lg border border-outline-variant/70">
      <div class="text-[10px] uppercase font-bold text-on-surface-variant">Total Alterações</div>
      <div class="text-lg font-bold text-primary mt-0.5">${data.alteracoes.length}</div>
    </div>
    <div class="bg-surface-container p-3 rounded-lg border border-outline-variant/70">
      <div class="text-[10px] uppercase font-bold text-emerald-700">Suplementações (+)</div>
      <div class="text-lg font-bold text-emerald-700 mt-0.5">+${formatTableCell(totalSuplementacoes)}</div>
    </div>
    <div class="bg-surface-container p-3 rounded-lg border border-outline-variant/70">
      <div class="text-[10px] uppercase font-bold text-rose-700">Reduções (-)</div>
      <div class="text-lg font-bold text-rose-700 mt-0.5">-${formatTableCell(totalReducoes)}</div>
    </div>
    <div class="bg-surface-container p-3 rounded-lg border border-outline-variant/70">
      <div class="text-[10px] uppercase font-bold text-on-surface-variant">Impacto Líquido</div>
      <div class="text-lg font-bold ${saldoLiquido >= 0 ? "text-emerald-700" : "text-rose-700"} mt-0.5">
        ${saldoLiquido >= 0 ? "+" : ""}${formatTableCell(saldoLiquido)}
      </div>
    </div>
    <div class="bg-surface-container p-3 rounded-lg border border-outline-variant/70">
      <div class="text-[10px] uppercase font-bold text-amber-700">Dotações Excluídas</div>
      <div class="text-lg font-bold text-amber-700 mt-0.5">${data.exclusoes.length}</div>
    </div>
  </div>

  ${
    showAlteracoes
      ? `
  <!-- Seção: Alterações de Valor -->
  <div class="mb-8">
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant">
      <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-lg">tune</span>
        Ajustes e Alterações de Dotação Orçamentária (${data.alteracoes.length})
      </h2>
      <span class="text-xs text-on-surface-variant font-medium">Registros auditados e rastreáveis</span>
    </div>
    <div class="border border-outline-variant rounded-lg overflow-hidden">
      <table class="w-full text-left text-xs">
        <thead class="bg-surface-container font-bold text-on-surface-variant border-b border-outline-variant">
          <tr>
            <th class="p-2.5 whitespace-nowrap">Data / Hora</th>
            <th class="p-2.5 whitespace-nowrap">Operador</th>
            <th class="p-2.5 whitespace-nowrap">Secretaria & Ação</th>
            <th class="p-2.5 whitespace-nowrap">Subelemento & Natureza</th>
            <th class="p-2.5 text-right whitespace-nowrap">Valor Anterior</th>
            <th class="p-2.5 text-right whitespace-nowrap">Novo Valor</th>
            <th class="p-2.5 text-right whitespace-nowrap">Diferença</th>
            <th class="p-2.5 whitespace-nowrap">Justificativa Institucional</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          ${rowsAlteracoesHtml}
        </tbody>
        ${data.alteracoes.length > 0 ? `
        <tfoot class="bg-surface-container font-bold text-on-surface border-t-2 border-primary/40">
          <tr>
            <td colspan="4" class="p-2.5 uppercase tracking-wider text-[11px] text-on-surface">Total Consolidado (${data.alteracoes.length} registros)</td>
            <td class="p-2.5 text-right font-mono text-xs whitespace-nowrap">${formatTableCell(totalValorAnterior)}</td>
            <td class="p-2.5 text-right font-mono text-xs whitespace-nowrap text-primary">${formatTableCell(totalValorNovo)}</td>
            <td class="p-2.5 text-right font-mono text-xs whitespace-nowrap ${totalDiferenca >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}">
              ${totalDiferenca >= 0 ? "+" : ""}${formatTableCell(totalDiferenca)}
            </td>
            <td class="p-2.5 text-xs text-on-surface-variant italic">Impacto líquido confere com o quadro de métricas</td>
          </tr>
        </tfoot>` : ""}
      </table>
    </div>
  </div>`
      : ""
  }

  ${
    showExclusoes
      ? `
  <!-- Seção: Exclusões de Dotação -->
  <div class="mb-8">
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant">
      <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
        <span class="material-symbols-outlined text-rose-700 text-lg">delete</span>
        Histórico de Dotações Excluídas (${data.exclusoes.length})
      </h2>
      <span class="text-xs text-on-surface-variant font-medium">Rastreabilidade de exclusões e restaurações</span>
    </div>
    <div class="border border-outline-variant rounded-lg overflow-hidden">
      <table class="w-full text-left text-xs">
        <thead class="bg-surface-container font-bold text-on-surface-variant border-b border-outline-variant">
          <tr>
            <th class="p-2.5 whitespace-nowrap">Data / Hora</th>
            <th class="p-2.5 whitespace-nowrap">Operador</th>
            <th class="p-2.5 whitespace-nowrap">Secretaria & Ação</th>
            <th class="p-2.5 whitespace-nowrap">Subelemento Excluído</th>
            <th class="p-2.5 text-right whitespace-nowrap">Valor Original</th>
            <th class="p-2.5 whitespace-nowrap">Motivo da Exclusão</th>
            <th class="p-2.5 text-center whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          ${rowsExclusoesHtml}
        </tbody>
        ${data.exclusoes.length > 0 ? `
        <tfoot class="bg-surface-container font-bold text-on-surface border-t-2 border-rose-300">
          <tr>
            <td colspan="4" class="p-2.5 uppercase tracking-wider text-[11px] text-on-surface">Total Dotações Excluídas (${data.exclusoes.length} itens)</td>
            <td class="p-2.5 text-right font-mono text-xs whitespace-nowrap text-rose-800">${formatTableCell(totalExclusoesValor)}</td>
            <td colspan="2" class="p-2.5 text-xs text-on-surface-variant italic">Memória contábil de despesas retiradas</td>
          </tr>
        </tfoot>` : ""}
      </table>
    </div>
  </div>`
      : ""
  }

  <!-- Assinaturas / Visto de Auditoria (Para arquivo impresso) -->
  <div class="mt-auto pt-8">
    <div class="grid grid-cols-2 gap-12 text-center text-xs text-on-surface-variant pt-6 border-t border-outline-variant">
      <div>
        <div class="border-b border-on-surface/40 pb-1 mb-1 mx-8"></div>
        <p class="font-bold text-on-surface">Responsável pelo Planejamento Orçamentário</p>
        <p class="text-[10px]">Secretaria de Finanças • Prefeitura de Osasco</p>
      </div>
      <div>
        <div class="border-b border-on-surface/40 pb-1 mb-1 mx-8"></div>
        <p class="font-bold text-on-surface">Auditor / Conformidade Orçamentária</p>
        <p class="text-[10px]">Controle Interno e Rastreabilidade LOA</p>
      </div>
    </div>
    <div class="text-center text-[10px] text-on-surface-variant/70 mt-6 print-hidden">
      Documento gerado eletronicamente pelo Sistema de Planejamento LOA — Prefeitura do Município de Osasco
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      ${data.autoPrint ? `setTimeout(function() { window.print(); }, 500);` : ""}
    });
  </script>
</body>
</html>`;
}

export function openAuditoriaReportWindow(data: AuditoriaReportData, autoPrint = true): void {
  if (typeof window === "undefined") return;
  const html = generateAuditoriaReportHtml({ ...data, autoPrint });
  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  } else {
    // Fallback caso pop-ups estejam bloqueados
    downloadAuditoriaReportHtml(data);
  }
}

export function downloadAuditoriaReportHtml(data: AuditoriaReportData): void {
  if (typeof window === "undefined") return;
  const html = generateAuditoriaReportHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeSec = (data.secretariaFiltro || "geral").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.download = `auditoria-orcamentaria-${safeSec}-${data.exercicio || 2027}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
