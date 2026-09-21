"use client";

import React, { useState } from "react";
import { currency } from "@/lib/format";
import type { Conciliacao, LinhaConciliacao } from "@/lib/conciliacao-fontes";

interface ConciliacaoFontesTableProps {
  conciliacao: Conciliacao;
  carregando: boolean;
  /** Quantidade de linhas cadastradas; zero significa que o quadro ainda não foi importado. */
  totalCadastrado: number;
}

/** Zerado é equilíbrio; sobra e falta precisam se distinguir à primeira vista. */
const corDoValor = (valor: number) =>
  Math.abs(valor) < 0.005 ? "text-emerald-700" : valor < 0 ? "text-red-600" : "text-on-surface";

const Valor = ({ valor, forte = false }: { valor: number; forte?: boolean }) => (
  <span className={`tabular-nums ${corDoValor(valor)} ${forte ? "font-bold" : ""}`}>{currency.format(valor)}</span>
);

export const ConciliacaoFontesTable = React.memo(function ConciliacaoFontesTable({
  conciliacao,
  carregando,
  totalCadastrado,
}: ConciliacaoFontesTableProps) {
  const [ocultarZerados, setOcultarZerados] = useState(true);
  const { blocos, naoCadastradas, totais } = conciliacao;

  // A planilha tem muita fonte prevista sem movimento; escondê-las deixa visível o que importa.
  const blocosVisiveis = blocos
    .map((bloco) => ({
      ...bloco,
      linhas: ocultarZerados
        ? bloco.linhas.filter((l) => Math.abs(l.receita) >= 0.005 || Math.abs(l.despesa) >= 0.005)
        : bloco.linhas,
    }))
    .filter((bloco) => bloco.linhas.length > 0);

  const linhasOcultas = blocos.reduce((s, b) => s + b.linhas.length, 0) - blocosVisiveis.reduce((s, b) => s + b.linhas.length, 0);

  return (
    <div key="conciliacao-fontes" className="glass-card p-5 bg-surface border border-outline-variant flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-indigo-600">balance</span>
            <span>Conciliação de Fontes — Receita x Despesa</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            Por UG + Fonte de Acompanhamento. A despesa acompanha as edições do detalhamento analítico em tempo real.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-on-surface-variant cursor-pointer">
          <input
            type="checkbox"
            checked={ocultarZerados}
            onChange={(e) => setOcultarZerados(e.target.checked)}
            className="accent-indigo-600"
          />
          <span>Ocultar fontes sem receita e sem despesa{linhasOcultas > 0 ? ` (${linhasOcultas})` : ""}</span>
        </label>
      </div>

      {carregando && <p className="text-xs text-on-surface-variant py-6 text-center">Carregando a conciliação…</p>}

      {!carregando && totalCadastrado === 0 && (
        <div className="text-xs text-on-surface-variant py-6 text-center space-y-1">
          <p className="font-semibold">Quadro de conciliação ainda não cadastrado.</p>
          <p>
            Importe a planilha BATE FONTE com{" "}
            <code className="px-1 rounded bg-surface-variant">npx tsx scripts/importar-conciliacao-fontes.ts backups/bate-fonte-2027.csv --aplicar</code>
          </p>
        </div>
      )}

      {!carregando && totalCadastrado > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-outline-variant p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Receita</p>
              <p className="text-base font-extrabold tabular-nums text-on-surface">{currency.format(totais.receita)}</p>
            </div>
            <div className="rounded-xl border border-outline-variant p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Despesa</p>
              <p className="text-base font-extrabold tabular-nums text-on-surface">{currency.format(totais.despesa)}</p>
            </div>
            <div className="rounded-xl border border-outline-variant p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Diferença</p>
              <p className="text-base font-extrabold">
                <Valor valor={totais.diferenca} forte />
              </p>
            </div>
          </div>

          {naoCadastradas.length > 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <span className="font-semibold">{naoCadastradas.length} fonte(s) com despesa fora do quadro cadastrado.</span>{" "}
              Aparecem destacadas no fim da tabela — cadastre-as na planilha BATE FONTE para a conciliação ficar completa.
            </p>
          )}

          <div className="overflow-auto max-h-[70vh] rounded-lg border border-outline-variant">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-variant z-10">
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-3 py-2">UG</th>
                  <th className="px-3 py-2">F.A</th>
                  <th className="px-3 py-2">CONF</th>
                  <th className="px-3 py-2 text-right">Receita</th>
                  <th className="px-3 py-2 text-right">Despesa</th>
                  <th className="px-3 py-2 text-right">Diferença</th>
                </tr>
              </thead>
              {blocosVisiveis.map((bloco) => (
                <tbody key={bloco.bloco} className="border-t-4 border-t-surface-variant">
                  {bloco.linhas.map((linha: LinhaConciliacao) => (
                    <tr
                      key={linha.conf}
                      className={`border-t border-outline-variant hover:bg-surface-variant/40 ${linha.cadastrada ? "" : "bg-amber-50"}`}
                    >
                      <td className="px-3 py-1.5 font-semibold">{linha.ug}</td>
                      <td className="px-3 py-1.5 tabular-nums">{linha.fa}</td>
                      <td className="px-3 py-1.5 tabular-nums text-on-surface-variant">
                        {linha.conf}
                        {!linha.cadastrada && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-700">não cadastrada</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{currency.format(linha.receita)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{currency.format(linha.despesa)}</td>
                      <td className="px-3 py-1.5 text-right">
                        <Valor valor={linha.diferenca} />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface-variant/60 border-t border-outline">
                    <td colSpan={5} className="px-3 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Diferenças do bloco
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Valor valor={bloco.diferencas} forte />
                    </td>
                  </tr>
                </tbody>
              ))}
              <tfoot className="sticky bottom-0 bg-surface-variant">
                <tr className="border-t-2 border-outline font-bold">
                  <td colSpan={3} className="px-3 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant">
                    Total geral
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{currency.format(totais.receita)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{currency.format(totais.despesa)}</td>
                  <td className="px-3 py-2 text-right">
                    <Valor valor={totais.diferenca} forte />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
});
