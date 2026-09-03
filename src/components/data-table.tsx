"use client";

import type { BudgetRow, FieldKey } from "@/types/loa";
import { FIELDS } from "@/types/loa";
import { FIELD_LABELS } from "./filters";
import { currency, integer } from "@/lib/format";
import { openLoaReportWindow, type LoaReportData, type LoaReportGroup } from "@/lib/loa-report-template";

type Row = BudgetRow & { id: string };

async function exportExcel(rows: Row[]) {
  const XLSX = await import("xlsx");
  const data = rows.map((row) => Object.fromEntries([...FIELDS.map((field) => [FIELD_LABELS[field], row[field]]), ["Valor", row.value]]));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data), "LOA");
  XLSX.writeFile(book, "relatorio-loa.xlsx");
}

async function exportPdf(rows: Row[]) {
  const organs = [...new Set(rows.map((r) => r.organ).filter(Boolean))];
  const units = [...new Set(rows.map((r) => r.budgetUnit).filter(Boolean))];

  const organTitle = organs.length === 1 ? organs[0] : organs.length > 0 ? organs.join(" · ") : "Prefeitura do Município de Osasco";
  const unitTitle = units.length === 1 ? units[0] : units.length > 0 ? units.join(" · ") : "Detalhamento Orçamentário";

  const totalValue = rows.reduce((acc, r) => acc + (r.value || 0), 0);

  // Agrupar por ação
  const groupMap = new Map<string, Row[]>();
  rows.forEach((row) => {
    const key = row.action || row.program || "Ação não informada";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(row);
  });

  const groups: LoaReportGroup[] = Array.from(groupMap.entries()).map(([actionTitle, items]) => {
    const groupTotal = items.reduce((acc, i) => acc + (i.value || 0), 0);
    return {
      groupTitle: actionTitle,
      valLdo: 0,
      valLoa: groupTotal,
      valorReajuste: 0,
      valorAditamento: 0,
      valorTotal: groupTotal,
      items: items.map((i) => ({
        natureza: i.expenseNature || "—",
        vinculo: i.subelement || "—",
        processoObs: i.administrativeProcess && i.administrativeProcess !== "—" ? `Proc: ${i.administrativeProcess}` : "—",
        valLdo: 0,
        valLoa: i.value || 0,
        valorReajuste: 0,
        valorAditamento: 0,
        valorTotal: i.value || 0,
      })),
    };
  });

  const reportData: LoaReportData = {
    tituloSecretaria: organTitle,
    unidadeOrcamentaria: unitTitle,
    orgao: organTitle,
    exercicio: "2027",
    hasAdjustments: false,
    totals: {
      ldo: 0,
      loa: totalValue,
      reajuste: 0,
      aditamento: 0,
      total: totalValue,
    },
    groups,
  };

  openLoaReportWindow(reportData, true);
}

export function DataTable({ rows, total, filteredValue, page, pages, search, sort, direction, onSearch, onSort, onPage }: { rows: Row[]; total: number; filteredValue: number; page: number; pages: number; search: string; sort: string; direction: "asc" | "desc"; onSearch(value: string): void; onSort(field: FieldKey | "value"): void; onPage(page: number): void }) {
  return (
    <section className="panel table-panel" aria-labelledby="table-title">
      <div className="panel-header"><div><h2 className="panel-title" id="table-title">Detalhamento orçamentário</h2><p className="panel-caption">{integer.format(total)} registros · Total filtrado: {currency.format(filteredValue)}</p></div><div className="table-tools"><input className="input table-search" type="search" aria-label="Buscar em todos os campos" placeholder="Buscar em todos os campos..." value={search} onChange={(event) => onSearch(event.target.value)} /><button className="button secondary" onClick={() => exportExcel(rows)} disabled={!rows.length}>Excel</button><button className="button secondary" onClick={() => exportPdf(rows)} disabled={!rows.length}>PDF</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr>{FIELDS.map((field) => <th key={field}><button onClick={() => onSort(field)}>{FIELD_LABELS[field]} {sort === field ? (direction === "asc" ? "↑" : "↓") : ""}</button></th>)}<th><button onClick={() => onSort("value")}>Valor {sort === "value" ? (direction === "asc" ? "↑" : "↓") : ""}</button></th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}>{FIELDS.map((field) => <td key={field} title={row[field]}>{row[field] || "—"}</td>)}<td className="value">{currency.format(row.value)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="table-footer"><span>Página {page} de {pages}</span><div className="pagination"><button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">‹</button><strong>{page}</strong><button onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Próxima página">›</button></div></div>
    </section>
  );
}

