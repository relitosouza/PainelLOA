"use client";

import { useState } from "react";
import { currency, percent, splitCode } from "@/lib/format";
import type { GroupTotal } from "@/types/loa";

export function SummaryCards({
  title,
  description,
  data,
  total,
  sortByCode = false,
  limit = 6,
}: {
  title: string;
  description: string;
  data: GroupTotal[];
  total: number;
  sortByCode?: boolean;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const processedData = [...data].sort((a, b) => {
    if (sortByCode) {
      const codeA = splitCode(a.label).code;
      const codeB = splitCode(b.label).code;
      return codeA.localeCompare(codeB, "pt-BR", { numeric: true, sensitivity: "base" });
    }
    return b.value - a.value;
  });

  const visibleData = expanded ? processedData : processedData.slice(0, limit);
  const hasMore = processedData.length > limit;

  return (
    <section className="section">
      <div className="section-heading flex items-center justify-between">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-surface-container/50 px-3 py-1.5 rounded-lg border border-outline-variant transition-colors"
          >
            {expanded ? (
              <>
                <span>Ver menos</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Ver todos ({processedData.length})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      <div className="summary-grid">
        {visibleData.map((item) => {
          const { code, name } = splitCode(item.label);
          const share = total ? item.value / total : 0;
          return (
            <article className="summary-card" key={item.label}>
              <div className="summary-code">Código {code}</div>
              <h3 title={name}>{name}</h3>
              <div className="summary-total">{currency.format(item.value)}</div>
              <div className="summary-meta">
                <span>{item.count.toLocaleString("pt-BR")} registros</span>
                <strong>{percent.format(share)} da LOA</strong>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(100, share * 100)}%` }} />
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                <span>Mostrar menos</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Mostrar todas as {processedData.length} secretarias</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

