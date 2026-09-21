import { currency } from "./format";
import { BancoProjetoLinha } from "@/components/banco-projetos-card";

export type BancoProjetosReportScope = "alocados" | "nao_alocados" | "geral";

export interface BancoProjetosReportGroup {
  secretaria: string;
  projetos: (BancoProjetoLinha & { isAllocated?: boolean })[];
  totalValor: number;
  totalQtd: number;
}

export interface BancoProjetosReportData {
  scope: BancoProjetosReportScope;
  scopeTitle: string;
  secretariaFiltro?: string; // Se selecionada secretaria específica para não-alocados ou geral
  exercicio?: string;
  groups: BancoProjetosReportGroup[];
  totalGeralValor: number;
  totalGeralQtd: number;
  totalAlocadosValor?: number;
  totalAlocadosQtd?: number;
  totalNaoAlocadosValor?: number;
  totalNaoAlocadosQtd?: number;
  autoPrint?: boolean;
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

export function generateBancoProjetosReportHtml(data: BancoProjetosReportData): string {
  const exercicio = escapeHtml(data.exercicio || "2027");
  const scopeTitle = escapeHtml(data.scopeTitle || "Relatório do Banco de Projetos");
  const secretariaFiltro = data.secretariaFiltro ? escapeHtml(data.secretariaFiltro) : "Todas as Secretarias";

  const totalGeralFormatado = currency.format(data.totalGeralValor || 0);

  const groupsHtml = data.groups
    .map((group) => {
      const secName = escapeHtml(group.secretaria);
      const groupTotal = currency.format(group.totalValor);
      const groupQtd = group.totalQtd;

      const rowsHtml = group.projetos
        .map((proj, idx) => {
          const num = idx + 1;
          const objeto = escapeHtml(proj.objeto || "Não informado");
          const natureza = escapeHtml(proj.natureza || "Não informada");
          const subelem = escapeHtml(proj.descricaoDespesa || "—");
          const edital = escapeHtml(proj.edital || "Não");
          const valorFormatado = currency.format(proj.valor || 0);
          const isAllocated = Boolean(proj.isAllocated);

          const statusBadge = isAllocated
            ? `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span class="material-symbols-outlined text-[12px]">check_circle</span> Alocado
               </span>`
            : `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Disponível
               </span>`;

          const editalBadge =
            proj.edital && proj.edital !== "Não"
              ? `<span class="inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">${edital}</span>`
              : `<span class="text-on-surface-variant text-[11.5px]">${edital}</span>`;

          return `
<tr class="zebra-row border-b border-outline-variant hover:bg-surface-container-low transition-colors text-[12.5px]">
  <td class="p-padding-cell-v px-padding-cell-h text-center text-on-surface-variant font-mono text-[11.5px] w-[36px]">${num}</td>
  <td class="p-padding-cell-v px-padding-cell-h min-w-[280px]">
    <div class="font-semibold text-on-surface leading-snug">${objeto}</div>
    ${subelem !== "—" ? `<div class="text-[11.5px] text-on-surface-variant font-normal mt-0.5 leading-snug">Subel.: ${subelem}</div>` : ""}
  </td>
  <td class="p-padding-cell-v px-padding-cell-h text-on-surface-variant text-[12px] min-w-[170px]">${natureza}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-center min-w-[100px]">${editalBadge}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-center min-w-[110px]">${statusBadge}</td>
  <td class="p-padding-cell-v px-padding-cell-h text-right font-mono font-bold text-on-surface text-[13px] min-w-[130px]">${valorFormatado}</td>
</tr>`;
        })
        .join("\n");

      return `
<!-- Grupo: ${secName} -->
<div class="mb-6 avoid-break-inside">
  <div class="flex items-center justify-between bg-surface-container-high px-4 py-2.5 rounded-t-lg border-t border-x border-outline-variant">
    <div class="flex items-center gap-2.5">
      <span class="material-symbols-outlined text-primary text-[20px]">apartment</span>
      <h2 class="font-headline-md text-[13.5px] font-bold text-on-surface uppercase tracking-wide">${secName}</h2>
      <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border-primary/30 uppercase tracking-wider">
        ${groupQtd} ${groupQtd === 1 ? "projeto" : "projetos"}
      </span>
    </div>
    <div class="text-right flex items-center gap-2">
      <span class="text-xs text-on-surface-variant font-medium">Subtotal da Secretaria:</span>
      <span class="font-mono text-sm font-bold text-primary">${groupTotal}</span>
    </div>
  </div>
  <div class="table-container overflow-x-auto border-x border-b border-outline-variant rounded-b-lg overflow-hidden shadow-xs bg-surface-container-lowest">
    <table class="w-full text-left border-collapse min-w-[1000px]">
      <thead class="bg-primary-container text-on-primary">
        <tr>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-center w-[36px]">#</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant min-w-[280px]">Objeto / Projeto</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant min-w-[170px]">Natureza da Despesa</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-center min-w-[100px]">Edital</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-center min-w-[110px]">Status</th>
          <th class="font-table-header text-table-header uppercase p-padding-cell-v px-padding-cell-h border-b border-outline-variant text-right min-w-[130px]">Valor Previsto</th>
        </tr>
      </thead>
      <tbody class="font-table-data text-table-data text-on-surface">
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</div>`;
    })
    .join("\n");

  const resumoGeralHtml = `
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 flex flex-col justify-center shadow-xs">
    <span class="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold mb-1">Escopo do Relatório</span>
    <span class="font-headline-md text-[14px] text-primary font-bold">${scopeTitle}</span>
  </div>
  <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 flex flex-col justify-center shadow-xs">
    <span class="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold mb-1">Filtro Secretaria</span>
    <span class="font-headline-md text-[13px] text-on-surface font-semibold truncate" title="${secretariaFiltro}">${secretariaFiltro}</span>
  </div>
  <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 flex flex-col justify-center shadow-xs">
    <span class="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold mb-1">Quantidade de Projetos</span>
    <span class="font-headline-md text-[16px] text-on-surface font-bold">${data.totalGeralQtd}</span>
  </div>
  <div class="bg-surface-container-lowest border-2 border-primary rounded-lg p-3.5 flex flex-col justify-center shadow-xs">
    <span class="font-label-caps text-[11px] text-primary uppercase font-bold mb-1">Valor Total Relatório</span>
    <span class="font-headline-md text-[16px] text-primary font-bold">${totalGeralFormatado}</span>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR" class="light">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${scopeTitle} - Banco de Projetos ${exercicio}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..900;1,300..900&family=IBM+Plex+Sans:ital,wght@0,400..700;1,400..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet"/>
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    "surface-container-low": "#f3f3f3",
                    "surface-container": "#eeeeee",
                    "surface-dim": "#dadada",
                    "surface": "#f9f9f9",
                    "surface-bright": "#f9f9f9",
                    "on-surface": "#1a1c1c",
                    "on-surface-variant": "#434749",
                    "outline": "#737779",
                    "outline-variant": "#c3c7c9",
                    "primary": "#003f87",
                    "primary-container": "#0056b3",
                    "on-primary": "#ffffff",
                    "surface-container-high": "#e8e8e8",
                    "surface-container-lowest": "#ffffff"
                },
                fontFamily: {
                    "headline-md": ["Hanken Grotesk", "sans-serif"],
                    "body-sm": ["Inter", "sans-serif"],
                    "table-data": ["Inter", "sans-serif"],
                    "table-header": ["IBM Plex Sans", "sans-serif"]
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
    .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .zebra-row:nth-child(even) { background-color: rgba(0, 63, 135, 0.02); }
    @media print {
        body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 11px;
        }
        .no-print {
            display: none !important;
        }
        .page-break {
            page-break-before: always;
        }
        .avoid-break-inside {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        table {
            page-break-inside: auto;
        }
        tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        thead {
            display: table-header-group;
        }
    }
</style>
</head>
<body class="bg-surface font-body-sm text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary">
<div class="flex-1 flex flex-col">
  <!-- Toolbar Não-Impressa -->
  <div class="no-print bg-surface-container-high border-b border-outline-variant px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-primary text-2xl">folder_special</span>
      <div>
        <h1 class="text-sm font-bold text-on-surface uppercase tracking-wide">Impressão · ${scopeTitle}</h1>
        <p class="text-xs text-on-surface-variant">Exercício ${exercicio} - Prefeitura do Município de Osasco</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="window.print()" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-sm hover:opacity-95 transition-opacity cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">print</span>
        Imprimir Relatório
      </button>
      <button onclick="window.close()" class="inline-flex items-center gap-1.5 px-3 py-2 bg-surface text-on-surface-variant border border-outline-variant text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
        Fechar
      </button>
    </div>
  </div>

  <main class="flex-1 px-8 py-6 max-w-[1600px] w-full mx-auto">
    <!-- Header Institucional -->
    <header class="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-2xl">folder_special</span>
        </div>
        <div>
          <span class="font-table-header text-xs text-primary font-bold tracking-widest uppercase block mb-1">
            SECRETARIA DE FINANÇAS · PREFEITURA DE OSASCO
          </span>
          <h1 class="font-headline-md text-2xl font-bold text-on-surface tracking-tight">
            Banco de Projetos · ${scopeTitle}
          </h1>
          <p class="text-xs text-on-surface-variant mt-0.5">
            Planejamento Orçamentário e Carteira de Investimentos · Exercício ${exercicio}
          </p>
        </div>
      </div>
      <div class="text-right flex flex-col items-end">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary text-on-primary uppercase tracking-wider mb-1">
          LOA ${exercicio}
        </span>
        <span class="text-[11px] text-on-surface-variant">Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </header>

    <!-- Resumo dos Cards -->
    ${resumoGeralHtml}

    <!-- Tabela por Secretaria -->
    ${
      groupsHtml ||
      `<div class="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-lg border border-outline-variant">
        Nenhum projeto encontrado para os critérios selecionados.
       </div>`
    }

    <!-- Rodapé Institucional -->
    <footer class="mt-8 pt-4 border-t border-outline-variant flex justify-between items-center text-xs text-on-surface-variant">
      <span>Banco de Projetos · Sistema de Elaboração LOA</span>
      <span>Prefeitura do Município de Osasco</span>
    </footer>
  </main>
</div>

<script>
  window.addEventListener('load', function() {
    ${data.autoPrint ? `setTimeout(function() { window.print(); }, 500);` : ""}
  });
</script>
</body>
</html>`;
}

export function openBancoProjetosReportWindow(data: BancoProjetosReportData, autoPrint = true): void {
  const html = generateBancoProjetosReportHtml({ ...data, autoPrint });
  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  } else {
    // Fallback: download
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-banco-projetos-${data.scope}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
