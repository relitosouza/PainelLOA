import { useState } from "react";
import { currency, percent } from "@/lib/format";
import type { GroupTotal } from "@/types/loa";

type ViewMode = "bars" | "ranking" | "donut";

const VIEW_MODES: Array<{ mode: ViewMode; label: string }> = [
  { mode: "bars", label: "Barras" },
  { mode: "ranking", label: "Ranking" },
  { mode: "donut", label: "Composição" },
];
const CHART_COLORS = ["#28a879", "#3977d5", "#a85f08", "#168b8b", "#d45d52", "#526f91", "#55b88f", "#6e92c4"];

function ViewIcon({ mode }: { mode: ViewMode }) {
  if (mode === "ranking") return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h2v2H3V5Zm4 0h10v2H7V5ZM3 9h2v2H3V9Zm4 0h8v2H7V9Zm-4 4h2v2H3v-2Zm4 0h6v2H7v-2Z" /></svg>;
  if (mode === "donut") return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M9 2a8 8 0 1 0 8 8H9V2Zm2 0v6h6a8 8 0 0 0-6-6Z" /></svg>;
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h3v12H3V4Zm5 5h3v7H8V9Zm5-3h3v10h-3V6Z" /></svg>;
}

function getDonutGradient(data: GroupTotal[], total: number) {
  let cursor = 0;
  const segments = data.map((item, index) => {
    const start = cursor;
    cursor += total ? (item.value / total) * 100 : 0;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${[...segments, `#e7edef ${cursor}% 100%`].join(", ")})`;
}

export function BarChart({ title, subtitle, data, changeable = false }: { title: string; subtitle: string; data: GroupTotal[]; changeable?: boolean }) {
  const [display, setDisplay] = useState<"value" | "percentage">("value");
  const [viewMode, setViewMode] = useState<ViewMode>("bars");
  const visibleData = data.slice(0, 8);
  const maximum = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const modeIndex = VIEW_MODES.findIndex((item) => item.mode === viewMode);
  const format = (value: number) => display === "value" ? currency.format(value) : percent.format(total ? value / total : 0);
  const changeView = () => setViewMode(VIEW_MODES[(modeIndex + 1) % VIEW_MODES.length].mode);

  return (
    <section className="panel chart-card">
      <div className="chart-head">
        <div className="chart-title"><h3>{title}</h3><span>{subtitle}</span></div>
        <div className="chart-actions">
          {changeable && <button type="button" className="chart-view-button" onClick={changeView} title="Mudar visualização" aria-label={`Mudar visualização. Atual: ${VIEW_MODES[modeIndex].label}`}><ViewIcon mode={viewMode} /><span>{VIEW_MODES[modeIndex].label}</span></button>}
          <div className="chart-display-toggle" role="group" aria-label={`Exibição de ${title}`}>
            <button type="button" className={display === "value" ? "active" : ""} aria-pressed={display === "value"} onClick={() => setDisplay("value")}>Valor</button>
            <button type="button" className={display === "percentage" ? "active" : ""} aria-pressed={display === "percentage"} onClick={() => setDisplay("percentage")}>%</button>
          </div>
        </div>
      </div>

      {viewMode === "bars" && <div className="bar-list">
        {visibleData.map((item) => <div className="bar-item" key={item.label} title={item.label}><span className="bar-label">{item.label}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / maximum) * 100}%` }} /></div><span className="bar-value">{format(item.value)}</span></div>)}
      </div>}

      {viewMode === "ranking" && <ol className="chart-ranking">
        {visibleData.map((item, index) => <li key={item.label}><b>{index + 1}</b><span title={item.label}>{item.label}</span><strong>{format(item.value)}</strong></li>)}
      </ol>}

      {viewMode === "donut" && <div className="chart-donut-layout">
        <div className="chart-donut" style={{ background: getDonutGradient(visibleData, total) }}><div><strong>100%</strong><span>do total</span></div></div>
        <div className="chart-donut-legend">{visibleData.map((item, index) => <div key={item.label}><i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} /><span title={item.label}>{item.label}</span><strong>{format(item.value)}</strong></div>)}</div>
      </div>}

      {!data.length && <p className="panel-caption">Sem dados para os filtros atuais.</p>}
    </section>
  );
}
