import { currency, percent, splitCode } from "@/lib/format";
import type { GroupTotal } from "@/types/loa";

export function SummaryCards({ title, description, data, total }: { title: string; description: string; data: GroupTotal[]; total: number }) {
  return (
    <section className="section">
      <div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div></div>
      <div className="summary-grid">
        {data.slice(0, 6).map((item) => {
          const { code, name } = splitCode(item.label);
          const share = total ? item.value / total : 0;
          return <article className="summary-card" key={item.label}><div className="summary-code">Código {code}</div><h3 title={name}>{name}</h3><div className="summary-total">{currency.format(item.value)}</div><div className="summary-meta"><span>{item.count.toLocaleString("pt-BR")} registros</span><strong>{percent.format(share)} da LOA</strong></div><div className="progress"><span style={{ width: `${Math.min(100, share * 100)}%` }} /></div></article>;
        })}
      </div>
    </section>
  );
}
