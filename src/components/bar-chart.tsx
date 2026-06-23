import { currency } from "@/lib/format";
import type { GroupTotal } from "@/types/loa";

export function BarChart({ title, subtitle, data }: { title: string; subtitle: string; data: GroupTotal[] }) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  return (
    <section className="panel chart-card">
      <div className="chart-head"><h3>{title}</h3><span>{subtitle}</span></div>
      <div className="bar-list">
        {data.slice(0, 8).map((item) => <div className="bar-item" key={item.label} title={item.label}><span className="bar-label">{item.label}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / maximum) * 100}%` }} /></div><span className="bar-value">{currency.format(item.value)}</span></div>)}
        {!data.length && <p className="panel-caption">Sem dados para os filtros atuais.</p>}
      </div>
    </section>
  );
}

